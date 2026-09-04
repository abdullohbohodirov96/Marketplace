-- ============================================================================
-- Malika Market — 0005: Stores, membership, locations, schedules
-- ============================================================================

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null unique,
  logo_url text,
  banner_url text,
  short_description text,
  description text,
  phone_primary text not null,
  phones_extra text[] not null default '{}',
  telegram_url text,
  instagram_url text,
  website_url text,
  market_name text not null default 'Malika',
  block text,
  row_label text,
  shop_number text,
  delivery_available boolean not null default false,
  payment_methods text[] not null default '{}',
  installment_available boolean not null default false,
  trade_in_available boolean not null default false,
  warranty_terms text,
  return_terms text,
  status public.store_status not null default 'pending',
  verified boolean not null default false,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  view_count integer not null default 0,
  plan_code public.plan_code not null references public.plans (code) default 'free',
  rejection_reason text,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_phone_format check (phone_primary ~ '^\+998[0-9]{9}$')
);

create index stores_owner_idx on public.stores (owner_id);
create index stores_status_idx on public.stores (status);
create index stores_slug_idx on public.stores (slug);
create index stores_name_trgm_idx on public.stores using gin (name gin_trgm_ops);

create trigger stores_set_updated_at
  before update on public.stores
  for each row execute function public.set_updated_at();

alter table public.subscriptions
  add constraint subscriptions_store_fk foreign key (store_id) references public.stores (id) on delete cascade;

create unique index subscriptions_active_store_idx on public.subscriptions (store_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.store_member_role not null default 'staff',
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  unique (store_id, user_id)
);

create index store_members_user_idx on public.store_members (user_id);

-- Helper: is current user a member (any role) of a given store?
create or replace function public.is_store_member(target_store_id uuid, min_role public.store_member_role default 'staff')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = auth.uid()
      and (
        min_role = 'staff'
        or (min_role = 'manager' and sm.role in ('manager', 'owner'))
        or (min_role = 'owner' and sm.role = 'owner')
      )
  );
$$;

-- Auto-add the creating seller as 'owner' member.
create or replace function public.handle_new_store()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_members (store_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict do nothing;

  insert into public.subscriptions (store_id, plan_code, status)
  values (new.id, 'free', 'active')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_store_created
  after insert on public.stores
  for each row execute function public.handle_new_store();

-- ---------------------------------------------------------------------------
create table public.store_locations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  label text not null default 'Asosiy',
  address_text text,
  latitude double precision not null,
  longitude double precision not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_locations_lat_range check (latitude between -90 and 90),
  constraint store_locations_lng_range check (longitude between -180 and 180)
);

create index store_locations_store_idx on public.store_locations (store_id);
create index store_locations_geo_idx on public.store_locations (latitude, longitude);

create unique index store_locations_one_primary_idx on public.store_locations (store_id)
  where is_primary;

create trigger store_locations_set_updated_at
  before update on public.store_locations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
create table public.store_schedules (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=Yakshanba..6=Shanba
  is_day_off boolean not null default false,
  opens_at time,
  closes_at time,
  unique (store_id, day_of_week)
);

create index store_schedules_store_idx on public.store_schedules (store_id);
