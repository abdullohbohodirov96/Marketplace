-- ============================================================================
-- Malika Market — 0007: Catalog products (canonical items) & seller offers
--
-- Design: a CatalogProduct is the single canonical item ("Apple iPhone 15 Pro
-- Max 256GB"). Each seller lists it via a ProductOffer (their price, stock,
-- condition, color/memory variant, warranty, etc). One catalog product can
-- have many offers from many stores — this is what powers price comparison.
-- ============================================================================

create table public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid not null references public.categories (id) on delete restrict,
  brand_id uuid references public.brands (id) on delete set null,
  model text,
  description text,
  main_image_url text,
  status public.moderation_status not null default 'pending',
  created_by uuid references public.profiles (id),
  offer_count integer not null default 0,      -- denormalized, kept in sync by trigger
  min_price numeric(14, 2),                    -- denormalized cheapest active offer price
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index catalog_products_category_idx on public.catalog_products (category_id);
create index catalog_products_brand_idx on public.catalog_products (brand_id);
create index catalog_products_status_idx on public.catalog_products (status);
create index catalog_products_name_trgm_idx on public.catalog_products using gin (name gin_trgm_ops);

create trigger catalog_products_set_updated_at
  before update on public.catalog_products
  for each row execute function public.set_updated_at();

-- Dynamic spec values (RAM, SSD, ekran o'lchami, ...) driven by category_attribute_defs.
create table public.catalog_product_specs (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products (id) on delete cascade,
  attribute_def_id uuid not null references public.category_attribute_defs (id) on delete cascade,
  value text not null,
  unique (catalog_product_id, attribute_def_id)
);

create index catalog_product_specs_product_idx on public.catalog_product_specs (catalog_product_id);

-- Alternate names used for rule-based duplicate matching:
-- "Apple 15 PM 256GB", "Айфон 15 Про Макс 256", "iphone15promax256" etc.
create table public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products (id) on delete cascade,
  alias text not null,
  normalized_alias text generated always as (public.slugify(alias)) stored,
  created_at timestamptz not null default now()
);

create index product_aliases_normalized_idx on public.product_aliases using gin (normalized_alias gin_trgm_ops);
create unique index product_aliases_unique_idx on public.product_aliases (catalog_product_id, normalized_alias);

-- Audit trail of admin/seller merge & unmerge actions between catalog products.
create table public.product_merge_history (
  id uuid primary key default gen_random_uuid(),
  source_catalog_product_id uuid not null references public.catalog_products (id),
  target_catalog_product_id uuid not null references public.catalog_products (id),
  merged_offer_ids uuid[] not null default '{}',
  performed_by uuid not null references public.profiles (id),
  action text not null default 'merge' check (action in ('merge', 'unmerge')),
  reason text,
  created_at timestamptz not null default now()
);

create index product_merge_history_target_idx on public.product_merge_history (target_catalog_product_id);

-- ---------------------------------------------------------------------------
-- Seller offers ("sotuvchi taklifi")
-- ---------------------------------------------------------------------------
create table public.product_offers (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products (id) on delete restrict,
  store_id uuid not null references public.stores (id) on delete cascade,
  seller_product_name text,             -- seller's own listing title, defaults to catalog name in UI
  slug text not null unique,
  sku text,
  barcode text,
  price numeric(14, 2) not null check (price >= 0),
  old_price numeric(14, 2) check (old_price is null or old_price >= 0),
  currency text not null default 'UZS',
  condition public.product_condition not null default 'new',
  color text,
  memory text,                          -- e.g. "256GB" — kept as text; category may not always be storage-based
  short_description text,
  description text,
  tags text[] not null default '{}',
  stock_quantity integer not null default 0,
  availability boolean not null default true,
  warranty_months integer not null default 0,
  delivery_available boolean not null default false,
  installment_available boolean not null default false,
  trade_in_available boolean not null default false,
  view_count integer not null default 0,
  favorite_count integer not null default 0,
  last_confirmed_at timestamptz not null default now(),
  status public.product_status not null default 'draft',
  rejection_reason text,
  published_at timestamptz,
  deleted_at timestamptz,               -- soft delete
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index product_offers_catalog_idx on public.product_offers (catalog_product_id);
create index product_offers_store_idx on public.product_offers (store_id);
create index product_offers_status_idx on public.product_offers (status) where deleted_at is null;
create index product_offers_price_idx on public.product_offers (price);
create index product_offers_last_confirmed_idx on public.product_offers (last_confirmed_at);
create unique index product_offers_store_sku_idx on public.product_offers (store_id, sku) where sku is not null;

create trigger product_offers_set_updated_at
  before update on public.product_offers
  for each row execute function public.set_updated_at();

create table public.product_offer_images (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  url text not null,
  sort_order smallint not null default 0,
  is_primary boolean not null default false
);

create index product_offer_images_offer_idx on public.product_offer_images (product_offer_id);
create unique index product_offer_images_one_primary_idx on public.product_offer_images (product_offer_id) where is_primary;

-- Keep catalog_products.offer_count / min_price in sync so the product page
-- and home-feed ranking don't need an expensive join+aggregate on every read.
create or replace function public.sync_catalog_product_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid := coalesce(new.catalog_product_id, old.catalog_product_id);
begin
  update public.catalog_products cp
  set offer_count = agg.cnt,
      min_price = agg.min_price
  from (
    select count(*) as cnt, min(price) as min_price
    from public.product_offers
    where catalog_product_id = target_id
      and status = 'active'
      and deleted_at is null
  ) agg
  where cp.id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger product_offers_sync_aggregates
  after insert or update of status, price, deleted_at or delete on public.product_offers
  for each row execute function public.sync_catalog_product_aggregates();

-- ---------------------------------------------------------------------------
-- Branch-level inventory (a store can have several physical branches — see
-- store_locations from migration 0005, which doubles as "Branch").
-- ---------------------------------------------------------------------------
create table public.branch_inventory (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.store_locations (id) on delete cascade,
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  stock_quantity integer not null default 0,
  availability boolean not null default true,
  last_confirmed_at timestamptz not null default now(),
  unique (branch_id, product_offer_id)
);

create index branch_inventory_offer_idx on public.branch_inventory (product_offer_id);

-- ---------------------------------------------------------------------------
-- Price history — every price change is preserved, never overwritten in place.
-- ---------------------------------------------------------------------------
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  old_price numeric(14, 2),
  new_price numeric(14, 2) not null,
  currency text not null default 'UZS',
  changed_by uuid references public.profiles (id),
  source text not null default 'manual' check (source in ('manual', 'import', 'admin', 'system')),
  changed_at timestamptz not null default now()
);

create index price_history_offer_idx on public.price_history (product_offer_id, changed_at desc);

create or replace function public.record_price_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.price_history (product_offer_id, old_price, new_price, currency, changed_by, source)
    values (new.id, null, new.price, new.currency, auth.uid(), 'manual');
  elsif tg_op = 'UPDATE' and new.price is distinct from old.price then
    insert into public.price_history (product_offer_id, old_price, new_price, currency, changed_by, source)
    values (new.id, old.price, new.price, new.currency, auth.uid(), 'manual');
  end if;
  return new;
end;
$$;

create trigger product_offers_record_price_history
  after insert or update of price on public.product_offers
  for each row execute function public.record_price_history();

-- ---------------------------------------------------------------------------
-- Version history for important fields (soft-audit, admin rollback UI reads this).
-- ---------------------------------------------------------------------------
create table public.product_versions (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  changed_by uuid references public.profiles (id),
  diff jsonb not null,          -- { field: { old, new } }
  created_at timestamptz not null default now()
);

create index product_versions_offer_idx on public.product_versions (product_offer_id, created_at desc);

create table public.store_versions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  changed_by uuid references public.profiles (id),
  diff jsonb not null,
  created_at timestamptz not null default now()
);

create index store_versions_store_idx on public.store_versions (store_id, created_at desc);
