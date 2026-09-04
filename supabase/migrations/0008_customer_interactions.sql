-- ============================================================================
-- Malika Market — 0008: Favorites, saved stores, comparisons, search, alerts
-- ============================================================================

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  list_name text not null default 'Sevimlilar',   -- lets a customer keep several named lists
  created_at timestamptz not null default now(),
  unique (user_id, product_offer_id, list_name)
);

create index favorites_user_idx on public.favorites (user_id);
create index favorites_offer_idx on public.favorites (product_offer_id);

create table public.saved_stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, store_id)
);

create index saved_stores_user_idx on public.saved_stores (user_id);

-- Compare list persisted server-side once the user is logged in.
-- Guests keep this in browser localStorage (app-level) and it merges in on login.
create table public.product_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  catalog_product_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table public.search_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  session_id text,
  query text not null,
  results_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index search_history_user_idx on public.search_history (user_id);
create index search_history_query_trgm_idx on public.search_history using gin (query gin_trgm_ops);
create index search_history_no_result_idx on public.search_history (created_at) where results_count = 0;

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  query text,
  filters jsonb not null default '{}',
  notify_on_match boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index saved_searches_user_idx on public.saved_searches (user_id);

-- "Narx tushsa xabar ber" — target can be a whole catalog product or one specific offer.
create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  catalog_product_id uuid references public.catalog_products (id) on delete cascade,
  product_offer_id uuid references public.product_offers (id) on delete cascade,
  target_price numeric(14, 2) not null check (target_price >= 0),
  currency text not null default 'UZS',
  status text not null default 'active' check (status in ('active', 'paused', 'triggered', 'expired')),
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  constraint price_alerts_target_check check (
    (catalog_product_id is not null and product_offer_id is null) or
    (catalog_product_id is null and product_offer_id is not null)
  )
);

create index price_alerts_user_idx on public.price_alerts (user_id);
create index price_alerts_catalog_idx on public.price_alerts (catalog_product_id) where status = 'active';
create index price_alerts_offer_idx on public.price_alerts (product_offer_id) where status = 'active';
