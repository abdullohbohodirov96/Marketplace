-- ============================================================================
-- Telefy — 0026: Reservations ("Reserve this price")
--
-- MVP stand-in for full checkout: a buyer locks a price for a limited time,
-- the seller confirms, the buyer picks it up in person at the market. This
-- is also what a future "verified purchase" review has to check against —
-- see has_completed_purchase() below.
-- ============================================================================

create type public.reservation_status as enum (
  'pending', 'seller_confirmed', 'rejected', 'customer_arrived', 'purchased', 'cancelled', 'expired'
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  product_offer_id uuid references public.product_offers (id) on delete cascade,
  used_device_unit_id uuid references public.used_device_units (id) on delete cascade,
  branch_id uuid references public.store_locations (id) on delete set null,
  price_locked numeric(14, 2) not null check (price_locked >= 0),
  currency text not null default 'UZS',
  status public.reservation_status not null default 'pending',
  customer_comment text,
  seller_comment text,
  cancel_reason text,
  expires_at timestamptz not null default (now() + interval '4 hours'),
  confirmed_at timestamptz,
  purchased_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_target_check check (
    (product_offer_id is not null and used_device_unit_id is null) or
    (product_offer_id is null and used_device_unit_id is not null)
  )
);

create index reservations_user_idx on public.reservations (user_id);
create index reservations_store_idx on public.reservations (store_id);
create index reservations_offer_idx on public.reservations (product_offer_id);
create index reservations_device_idx on public.reservations (used_device_unit_id);
create index reservations_status_idx on public.reservations (status);

create trigger reservations_set_updated_at
  before update on public.reservations
  for each row execute function public.set_updated_at();

-- Used by the (future) review-submission action to decide whether a review
-- qualifies as a Verified Purchase.
create or replace function public.has_completed_purchase(
  target_user_id uuid,
  target_store_id uuid,
  target_offer_id uuid default null,
  target_device_id uuid default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.reservations r
    where r.user_id = target_user_id
      and r.store_id = target_store_id
      and r.status = 'purchased'
      and (
        (target_offer_id is not null and r.product_offer_id = target_offer_id)
        or (target_device_id is not null and r.used_device_unit_id = target_device_id)
      )
  );
$$;
