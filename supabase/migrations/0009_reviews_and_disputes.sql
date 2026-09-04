-- ============================================================================
-- Malika Market — 0009: Reviews, ratings, reports/disputes
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_offer_id uuid references public.product_offers (id) on delete cascade,
  store_id uuid references public.stores (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  images text[] not null default '{}',
  status public.moderation_status not null default 'pending',
  helpful_count integer not null default 0,
  verified_purchase boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_target_check check (
    (product_offer_id is not null and store_id is null) or
    (product_offer_id is null and store_id is not null)
  )
);

create index reviews_offer_idx on public.reviews (product_offer_id);
create index reviews_store_idx on public.reviews (store_id);
create index reviews_user_idx on public.reviews (user_id);
create index reviews_status_idx on public.reviews (status);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  reply_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_replies_review_idx on public.review_replies (review_id);

create trigger review_replies_set_updated_at
  before update on public.review_replies
  for each row execute function public.set_updated_at();

create table public.review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_helpful boolean not null default true,
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);

-- Keep store / offer rating aggregates in sync.
create or replace function public.sync_review_aggregates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store uuid := coalesce(new.store_id, old.store_id);
begin
  if target_store is not null then
    update public.stores s
    set rating_avg = coalesce(agg.avg_rating, 0),
        rating_count = coalesce(agg.cnt, 0)
    from (
      select avg(rating)::numeric(3,2) as avg_rating, count(*) as cnt
      from public.reviews
      where store_id = target_store and status = 'approved' and deleted_at is null
    ) agg
    where s.id = target_store;
  end if;
  return coalesce(new, old);
end;
$$;

create trigger reviews_sync_store_rating
  after insert or update of status, deleted_at, rating or delete on public.reviews
  for each row execute function public.sync_review_aggregates();

-- ---------------------------------------------------------------------------
-- Reports / dispute center. A "report" is the intake; disputes track the
-- back-and-forth resolution thread for the ones that need it.
-- ---------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target_type not null,
  target_id uuid not null,
  reason text not null,
  description text,
  screenshot_url text,
  conversation_id uuid,   -- FK added in 0011 after conversations table exists
  status public.report_status not null default 'pending',
  resolved_by uuid references public.profiles (id),
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status);
create index reports_target_idx on public.reports (target_type, target_id);
create index reports_reporter_idx on public.reports (reporter_id);

create table public.disputes (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  store_id uuid references public.stores (id) on delete set null,
  status text not null default 'new' check (
    status in ('new', 'in_review', 'awaiting_seller', 'resolved', 'rejected')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index disputes_report_idx on public.disputes (report_id);
create index disputes_store_idx on public.disputes (store_id);

create trigger disputes_set_updated_at
  before update on public.disputes
  for each row execute function public.set_updated_at();

create table public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.disputes (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  message text not null,
  attachment_url text,
  created_at timestamptz not null default now()
);

create index dispute_messages_dispute_idx on public.dispute_messages (dispute_id);

-- Buyer/seller-declared outcome of a lead (self-reported, used only as a
-- soft signal — never single-handedly drops a seller's rating).
create table public.sale_outcomes (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  outcome text not null check (
    outcome in ('contacted', 'agreed', 'purchased', 'not_available', 'price_mismatch', 'no_response', 'cancelled')
  ),
  created_at timestamptz not null default now()
);

create index sale_outcomes_offer_idx on public.sale_outcomes (product_offer_id);
