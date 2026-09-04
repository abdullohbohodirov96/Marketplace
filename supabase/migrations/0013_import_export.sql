-- ============================================================================
-- Malika Market — 0013: Bulk Excel/CSV import & export jobs
-- ============================================================================

create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  file_url text not null,
  file_name text not null,
  column_mapping jsonb not null default '{}',
  status text not null default 'pending' check (
    status in ('pending', 'validating', 'processing', 'completed', 'failed', 'cancelled')
  ),
  total_rows integer not null default 0,
  processed_rows integer not null default 0,
  success_rows integer not null default 0,
  error_rows integer not null default 0,
  error_file_url text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index import_jobs_store_idx on public.import_jobs (store_id, created_at desc);

create table public.import_rows (
  id uuid primary key default gen_random_uuid(),
  import_job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number integer not null,
  raw_data jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'valid', 'invalid', 'imported')),
  errors text[] not null default '{}',
  product_offer_id uuid references public.product_offers (id) on delete set null
);

create index import_rows_job_idx on public.import_rows (import_job_id);
create index import_rows_status_idx on public.import_rows (import_job_id, status);

create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  created_by uuid not null references public.profiles (id),
  format text not null default 'xlsx' check (format in ('xlsx', 'csv')),
  filters jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  file_url text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index export_jobs_store_idx on public.export_jobs (store_id, created_at desc);
