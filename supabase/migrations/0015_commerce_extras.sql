-- ============================================================================
-- Malika Market — 0015: Delivery/installment options, trade-in, promotions,
-- warranty documents (feature-flagged, off by default)
-- ============================================================================

create table public.delivery_options (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  scope text not null default 'tashkent_only' check (scope in ('tashkent_only', 'nationwide', 'pickup_only')),
  is_free boolean not null default false,
  price numeric(14, 2),
  min_order_amount numeric(14, 2),
  estimated_days_min smallint,
  estimated_days_max smallint,
  pickup_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index delivery_options_store_idx on public.delivery_options (store_id);

create trigger delivery_options_set_updated_at
  before update on public.delivery_options
  for each row execute function public.set_updated_at();

create table public.installment_options (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  down_payment_percent numeric(5, 2) not null default 0,
  term_months smallint not null,
  markup_percent numeric(5, 2) not null default 0,
  partner_name text,
  required_documents text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index installment_options_offer_idx on public.installment_options (product_offer_id);

create table public.trade_in_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  old_device_brand text,
  old_device_model text,
  old_device_memory text,
  condition_overall text,
  condition_screen text,
  condition_body text,
  condition_battery text,
  was_repaired boolean not null default false,
  images text[] not null default '{}',
  customer_comment text,
  status text not null default 'pending' check (
    status in ('pending', 'offer_made', 'more_info_requested', 'rejected', 'accepted', 'closed')
  ),
  seller_offer_amount numeric(14, 2),
  seller_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trade_in_requests_offer_idx on public.trade_in_requests (product_offer_id);
create index trade_in_requests_user_idx on public.trade_in_requests (user_id);

create trigger trade_in_requests_set_updated_at
  before update on public.trade_in_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  discount_type text not null check (discount_type in ('percent', 'fixed_amount')),
  discount_percent numeric(5, 2),
  discount_amount numeric(14, 2),
  max_discount_amount numeric(14, 2),
  category_id uuid references public.categories (id),
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'ended', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint promotions_date_range check (ends_at > starts_at)
);

create index promotions_store_idx on public.promotions (store_id);
create index promotions_active_idx on public.promotions (starts_at, ends_at) where status in ('scheduled', 'active');

create table public.promotion_products (
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  primary key (promotion_id, product_offer_id)
);

create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  code text not null unique,
  usage_limit integer,
  usage_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'expired', 'disabled')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Warranty / purchase documents — feature-flagged (see 0017 feature_flags),
-- hidden from public UI until an admin enables it. Access restricted by RLS
-- to the customer, the store, and admins only.
-- ---------------------------------------------------------------------------
create table public.warranty_documents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  customer_id uuid not null references public.profiles (id) on delete cascade,
  product_offer_id uuid references public.product_offers (id) on delete set null,
  serial_number text,
  imei text,
  purchase_date date not null,
  warranty_start date not null,
  warranty_end date not null,
  attachment_url text,
  status text not null default 'active' check (status in ('active', 'expired', 'void')),
  created_at timestamptz not null default now(),
  constraint warranty_documents_dates check (warranty_end >= warranty_start)
);

create index warranty_documents_store_idx on public.warranty_documents (store_id);
create index warranty_documents_customer_idx on public.warranty_documents (customer_id);
