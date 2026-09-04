-- ============================================================================
-- Malika Market — 0006: Categories, brands, dynamic attribute schema
-- ============================================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  name_uz text not null,
  name_ru text,
  slug text not null unique,
  icon text,
  image_url text,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_parent_idx on public.categories (parent_id);
create index categories_slug_idx on public.categories (slug);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Defines which dynamic spec fields apply to a category (e.g. Telefon -> RAM, xotira, rang).
-- Rendered by the product form / filters; values are stored per-catalog-product in
-- catalog_product_specs as key/value so the schema stays data-driven, not code-driven.
create table public.category_attribute_defs (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  key text not null,                 -- e.g. 'ram', 'storage', 'color', 'processor'
  label_uz text not null,
  label_ru text,
  input_type text not null default 'text' check (input_type in ('text', 'number', 'select', 'boolean')),
  options text[],                     -- for input_type = 'select'
  unit text,                          -- e.g. 'GB', 'mm'
  is_filterable boolean not null default true,
  is_required boolean not null default false,
  sort_order smallint not null default 0,
  unique (category_id, key)
);

create index category_attribute_defs_category_idx on public.category_attribute_defs (category_id);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index brands_name_trgm_idx on public.brands using gin (name gin_trgm_ops);

-- Free-form / curated synonyms so search understands "iphone" = "ayfon" = "айфон".
create table public.search_synonyms (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  synonym text not null,
  locale text not null default 'uz',
  created_at timestamptz not null default now(),
  unique (term, synonym, locale)
);

create index search_synonyms_term_idx on public.search_synonyms using gin (term gin_trgm_ops);
