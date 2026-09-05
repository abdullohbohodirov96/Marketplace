-- ============================================================================
-- Telefy — 0023: Markets (physical bazaars) & richer branch addressing
--
-- Until now a store's location lived as flat text on `stores`
-- (market_name/block/row_label/shop_number) with no normalized market
-- entity, and `store_locations` (multi-branch support, added in 0005) had
-- no link to a market or indoor address at all. This introduces `markets`
-- as first-class rows (Malika today, other bazaars/cities later per the
-- roadmap) and extends `store_locations` to carry the indoor address so a
-- store's branches can each sit in a different market or block.
--
-- `stores.market_name/block/row_label/shop_number` are left in place (no
-- destructive drop) and are backfilled into a primary `store_locations` row
-- per store below; new code should read location from `store_locations`.
-- ============================================================================

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  city text not null default 'Toshkent',
  region text,
  address text,
  latitude double precision,
  longitude double precision,
  description text,
  map_image_url text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint markets_lat_range check (latitude is null or latitude between -90 and 90),
  constraint markets_lng_range check (longitude is null or longitude between -180 and 180)
);

create index markets_active_idx on public.markets (is_active);

create trigger markets_set_updated_at
  before update on public.markets
  for each row execute function public.set_updated_at();

-- Fixed id so it can be safely used as a column default below and referenced
-- from seed/backfill data — this is the market every store defaults to today.
insert into public.markets (id, name, slug, city, is_active, sort_order)
values ('00000000-0000-0000-0000-000000000001', 'Malika', 'malika', 'Toshkent', true, 0)
on conflict (id) do nothing;

alter table public.store_locations
  add column market_id uuid references public.markets (id) on delete restrict
    not null default '00000000-0000-0000-0000-000000000001',
  add column block text,
  add column floor text,
  add column row_label text,
  add column shop_number text;

-- Indoor bazaar shops rarely carry their own GPS pin (only the market does),
-- so a branch's own coordinates become optional — the UI falls back to the
-- market's latitude/longitude when a branch has none of its own.
alter table public.store_locations
  alter column latitude drop not null,
  alter column longitude drop not null;

create index store_locations_market_idx on public.store_locations (market_id);

-- Backfill: give every existing store a primary store_locations row built
-- from its flat legacy fields, so app code can read location from one place
-- going forward. Skips stores that already have a primary location.
insert into public.store_locations (store_id, label, market_id, block, row_label, shop_number, is_primary)
select s.id, 'Asosiy', '00000000-0000-0000-0000-000000000001', s.block, s.row_label, s.shop_number, true
from public.stores s
where not exists (
  select 1 from public.store_locations sl where sl.store_id = s.id and sl.is_primary
);
