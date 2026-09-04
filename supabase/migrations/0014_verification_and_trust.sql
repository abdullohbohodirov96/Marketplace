-- ============================================================================
-- Malika Market — 0014: Store verification & availability confirmation
-- ============================================================================

create table public.store_verifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  verification_type text not null check (
    verification_type in (
      'phone', 'email', 'location', 'documents', 'malika_bozor_seller', 'verified_seller', 'premium_seller'
    )
  ),
  status public.moderation_status not null default 'pending',
  submitted_data jsonb not null default '{}',
  submitted_files text[] not null default '{}',
  reviewed_by uuid references public.profiles (id),
  rejection_reason text,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index store_verifications_store_idx on public.store_verifications (store_id);
create index store_verifications_status_idx on public.store_verifications (status);

-- Periodic "narx va mavjudlikni tasdiqlang" confirmations, tracked per offer
-- so ranking can penalize stale listings and cron can nudge inactive sellers.
create table public.availability_confirmations (
  id uuid primary key default gen_random_uuid(),
  product_offer_id uuid not null references public.product_offers (id) on delete cascade,
  confirmed_by uuid not null references public.profiles (id),
  action text not null check (
    action in ('confirmed_ok', 'price_changed', 'marked_unavailable', 'hidden', 'deleted')
  ),
  previous_price numeric(14, 2),
  new_price numeric(14, 2),
  created_at timestamptz not null default now()
);

create index availability_confirmations_offer_idx on public.availability_confirmations (product_offer_id, created_at desc);

-- Keeps last_confirmed_at on the offer itself in sync for cheap ranking/reads.
create or replace function public.sync_offer_last_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.product_offers
  set last_confirmed_at = new.created_at
  where id = new.product_offer_id;
  return new;
end;
$$;

create trigger availability_confirmations_sync
  after insert on public.availability_confirmations
  for each row execute function public.sync_offer_last_confirmed();
