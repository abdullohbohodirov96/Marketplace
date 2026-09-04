-- ============================================================================
-- Malika Market — 0003: Identity — roles metadata, profiles
-- ============================================================================

-- Reference/metadata table for roles (display + future granular permissions).
-- The authoritative, fast-checked role lives on profiles.role (enum).
create table public.roles (
  code public.user_role primary key,
  name_uz text not null,
  name_ru text,
  description_uz text,
  sort_order smallint not null default 0
);

insert into public.roles (code, name_uz, name_ru, sort_order) values
  ('customer', 'Mijoz', 'Клиент', 1),
  ('seller', 'Sotuvchi', 'Продавец', 2),
  ('moderator', 'Moderator', 'Модератор', 3),
  ('admin', 'Super Admin', 'Супер Админ', 4);

-- One row per auth.users row. Created automatically by trigger on signup.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  phone text unique,
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  avatar_url text,
  role public.user_role not null default 'customer',
  locale text not null default 'uz' check (locale in ('uz', 'ru')),
  status public.account_status not null default 'active',
  deletion_requested_at timestamptz,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_phone_format check (
    phone is null or phone ~ '^\+998[0-9]{9}$'
  )
);

create index profiles_role_idx on public.profiles (role);
create index profiles_phone_idx on public.profiles (phone);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created.
-- Expects role/full_name/phone passed through raw_user_meta_data at signUp().
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Foydalanuvchi'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'customer'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'uz')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Auth/permission helper functions used throughout RLS policies below.
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_moderator_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role in ('moderator', 'admin') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_account_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select status = 'active' from public.profiles where id = auth.uid()), false);
$$;
