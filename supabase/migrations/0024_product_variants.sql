-- ============================================================================
-- Telefy — 0024: Product variants (SKU-level: storage / color / etc)
--
-- Until now a CatalogProduct ("Apple iPhone 16 Pro") went straight to a
-- ProductOffer, with color/memory as free-text fields duplicated on every
-- seller's row — two stores selling the exact same 256GB Natural Titanium
-- unit had no shared identity, which is exactly what breaks true price
-- comparison. This inserts ProductVariant between them:
--
--   CatalogProduct -> ProductVariant -> ProductOffer (-> BranchInventory)
--
-- product_offers.variant_id is added as NULLABLE (not enforced NOT NULL
-- yet) so existing rows keep working; new seller-facing code should always
-- set it going forward. color/memory stay on product_offers for backward
-- compatibility but are superseded by the variant's own fields there.
-- ============================================================================

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products (id) on delete cascade,
  slug text not null unique,
  color text,
  memory text,
  sku_suffix text,               -- extra distinguishing spec, e.g. "eSIM"
  main_image_url text,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (catalog_product_id, color, memory, sku_suffix)
);

create index product_variants_catalog_idx on public.product_variants (catalog_product_id);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_offers
  add column variant_id uuid references public.product_variants (id) on delete restrict;

create index product_offers_variant_idx on public.product_offers (variant_id);

-- Backfill: every product_offer created before this migration was created
-- through a flow where one catalog_product == one seller's exact listing
-- (no shared variants yet), so each gets its own variant carrying whatever
-- color/memory it already had.
insert into public.product_variants (catalog_product_id, slug, color, memory)
select cp.id,
       public.slugify(cp.slug || '-' || coalesce(po.memory, '') || '-' || coalesce(po.color, ''))
         || '-' || substr(md5(random()::text || cp.id::text), 1, 6),
       po.color,
       po.memory
from public.product_offers po
join public.catalog_products cp on cp.id = po.catalog_product_id
where po.variant_id is null
group by cp.id, cp.slug, po.color, po.memory;

update public.product_offers po
set variant_id = pv.id
from public.product_variants pv
where po.variant_id is null
  and pv.catalog_product_id = po.catalog_product_id
  and pv.color is not distinct from po.color
  and pv.memory is not distinct from po.memory;
