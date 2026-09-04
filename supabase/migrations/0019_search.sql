-- ============================================================================
-- Malika Market — 0019: Full-text + trigram search (PostgreSQL FTS today,
-- swappable for Meilisearch/Algolia later behind the SearchProvider interface
-- in src/lib/search/ — see that folder's README).
-- ============================================================================

alter table public.catalog_products
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(name, ''))), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(model, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(description, ''))), 'C')
  ) stored;

create index catalog_products_search_idx on public.catalog_products using gin (search_vector);
create index catalog_products_model_trgm_idx on public.catalog_products using gin (model gin_trgm_ops);

alter table public.product_offers
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(seller_product_name, ''))), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(description, ''))), 'C') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(public.immutable_array_to_string(tags, ' '))), 'B')
  ) stored;

create index product_offers_search_idx on public.product_offers using gin (search_vector);

-- Popular / recent search terms materialized cheaply from search_history —
-- refreshed periodically by a cron job (see src/app/api/cron/refresh-search-stats).
create materialized view public.popular_searches as
  select query, count(*) as search_count, max(created_at) as last_searched_at
  from public.search_history
  where created_at > now() - interval '30 days'
  group by query
  order by count(*) desc
  limit 50;

create unique index popular_searches_query_idx on public.popular_searches (query);
