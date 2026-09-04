-- ============================================================================
-- Malika Market — 0012: "Topib bering" (request for offer) & seller proposals
-- ============================================================================

create table public.request_for_offers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  title text not null,
  brand text,
  model text,
  description text,
  condition public.product_condition,
  min_price numeric(14, 2),
  max_price numeric(14, 2),
  currency text not null default 'UZS',
  color text,
  memory text,
  location_text text,
  delivery_required boolean not null default false,
  installment_required boolean not null default false,
  trade_in_required boolean not null default false,
  status text not null default 'open' check (status in ('open', 'closed', 'expired')),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  constraint request_for_offers_price_range check (
    min_price is null or max_price is null or min_price <= max_price
  )
);

create index request_for_offers_category_idx on public.request_for_offers (category_id) where status = 'open';
create index request_for_offers_user_idx on public.request_for_offers (user_id);

create table public.seller_proposals (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.request_for_offers (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  product_offer_id uuid references public.product_offers (id) on delete set null,
  price numeric(14, 2) not null,
  comment text,
  warranty_months integer,
  delivery_available boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (request_id, store_id)
);

create index seller_proposals_request_idx on public.seller_proposals (request_id);
create index seller_proposals_store_idx on public.seller_proposals (store_id);

alter table public.conversations
  add constraint conversations_request_fk foreign key (request_id) references public.request_for_offers (id) on delete set null;
