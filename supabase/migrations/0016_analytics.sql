-- ============================================================================
-- Malika Market — 0016: Unified analytics events
--
-- Replaces separate ProductView/StoreView/ContactClick tables with one
-- append-only event stream — cheaper to extend (new event types need no
-- migration) and this is exactly the shape dashboards/funnels want to query.
-- No PII beyond an optional user_id; session_id is a random client token.
-- ============================================================================

create type public.analytics_event_type as enum (
  'product_view', 'store_view', 'search', 'filter_used', 'no_result_search',
  'favorite_added', 'favorite_removed', 'compare_added', 'phone_clicked',
  'telegram_clicked', 'instagram_clicked', 'location_clicked', 'directions_clicked',
  'shared', 'price_alert_created', 'request_created', 'proposal_sent', 'review_created'
);

create table public.analytics_events (
  id uuid not null default gen_random_uuid(),
  event_type public.analytics_event_type not null,
  user_id uuid references public.profiles (id) on delete set null,
  session_id text,
  catalog_product_id uuid references public.catalog_products (id) on delete set null,
  product_offer_id uuid references public.product_offers (id) on delete set null,
  store_id uuid references public.stores (id) on delete set null,
  search_query text,
  source_page text,
  referrer text,
  device_type text check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  created_at timestamptz not null default now(),
  primary key (id, created_at)
) partition by range (created_at);

-- Monthly partitions keep the hot table small; a cron/admin job creates the
-- next month ahead of time (see scripts/ + Stage 9 cron wiring).
create table public.analytics_events_default partition of public.analytics_events default;

create index analytics_events_type_idx on public.analytics_events (event_type, created_at desc);
create index analytics_events_store_idx on public.analytics_events (store_id, created_at desc);
create index analytics_events_offer_idx on public.analytics_events (product_offer_id, created_at desc);
create index analytics_events_user_idx on public.analytics_events (user_id, created_at desc);

-- contact_clicks / product_views / store_views are exposed as views for
-- backward-compatible, narrower reads from seller dashboards.
create view public.contact_clicks as
  select id, store_id, product_offer_id, user_id, event_type as channel, created_at
  from public.analytics_events
  where event_type in ('phone_clicked', 'telegram_clicked', 'instagram_clicked', 'location_clicked');

create view public.product_views as
  select id, product_offer_id, user_id, session_id, created_at
  from public.analytics_events
  where event_type = 'product_view';

create view public.store_views as
  select id, store_id, user_id, session_id, created_at
  from public.analytics_events
  where event_type = 'store_view';
