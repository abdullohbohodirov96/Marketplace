-- ============================================================================
-- Malika Market — 0001: Extensions & helper functions
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";       -- fuzzy / typo-tolerant search
create extension if not exists "unaccent";      -- accent/latin-cyrillic-ish normalization

-- Generic updated_at trigger -------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- unaccent() ships as STABLE, not IMMUTABLE (its behavior can depend on
-- search_path), so it can't be used directly inside generated columns or
-- functional indexes. This wrapper pins the dictionary and is safe to mark
-- IMMUTABLE for our purposes (Latin/Cyrillic product names & slugs).
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select unaccent('unaccent', $1);
$$;

-- array_to_string() ships as STABLE in Postgres, so — like unaccent() — it
-- can't be used directly inside a generated column expression either.
create or replace function public.immutable_array_to_string(text[], text)
returns text
language sql
immutable
parallel safe
as $$
  select array_to_string($1, $2);
$$;

-- Slugify helper (used by app code too, kept here for db-side defaults/backfills)
create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(regexp_replace(public.immutable_unaccent(coalesce(input, '')), '[^a-zA-Z0-9]+', '-', 'g')),
    '-{2,}', '-', 'g')
  );
$$;
