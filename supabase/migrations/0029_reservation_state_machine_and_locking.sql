-- ============================================================================
-- Telefy — 0029: Reservation state machine, insert-time integrity, atomic
-- double-booking prevention
--
-- 0028 closed the UPDATE-side holes (price/store tampering, buyer status
-- fabrication) but a second review found the INSERT side and the seller's
-- UPDATE privileges were still wide open, plus a real concurrency bug:
--
--  1. INSERT was never guarded at all — reservations_buyer_insert only
--     checks user_id = auth.uid(), so a client could INSERT a reservation
--     with status='purchased' (or seller_comment/*_at columns pre-filled)
--     directly via the Supabase REST API, fabricating a Verified Purchase
--     without ever going through pending -> ... -> purchased.
--  2. guard_reservation_transitions (0028) treated ANY store member as
--     fully privileged, so a seller could rewrite user_id, price_locked,
--     the target offer/device, branch_id or expires_at on someone else's
--     reservation — only a real admin/service-role should ever touch those.
--  3. No state machine was enforced for seller-driven status changes — a
--     store member could jump pending -> purchased directly, or resurrect
--     a cancelled/rejected/expired reservation.
--  4. Two buyers could reserve the same physical used_device_unit at the
--     same time — nothing enforced "at most one active reservation per
--     unit". Fixed with a partial unique index rather than an app-level
--     lock: Postgres enforces a unique index atomically across concurrent
--     transactions, so the second concurrent INSERT simply fails with
--     23505 instead of racing.
--  5. availability was never checked — an offer/device marked unavailable
--     by its seller could still be reserved.
--  6. A purchased used_device_unit stayed listed as available forever —
--     nothing ever closed it out.
--  7. expires_at was accepted verbatim from the client (a buyer could send
--     next year's date and hold a price forever) and confirmed_at/
--     purchased_at/cancelled_at were client-supplied too (a seller update
--     could backdate a "purchase").
--  8. Nothing ever flips a stale pending/seller_confirmed reservation to
--     'expired' once its hold has lapsed — expire_stale_reservations() is
--     new here and is meant to be called by a cron route.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1, 5, 7 (expires_at): re-validate at INSERT time, this time also locking
-- down every field a non-privileged INSERT could otherwise set to fabricate
-- an already-resolved reservation, and checking availability.
-- ---------------------------------------------------------------------------
create or replace function public.validate_reservation_target()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_store_id uuid;
  target_price numeric(14, 2);
  target_availability boolean;
  acting_uid uuid := auth.uid();
  is_privileged boolean := acting_uid is null or public.is_moderator_or_admin();
begin
  if (new.product_offer_id is not null) = (new.used_device_unit_id is not null) then
    raise exception 'reservations: aynan bittasi — product_offer_id yoki used_device_unit_id — berilishi shart';
  end if;

  if new.product_offer_id is not null then
    select store_id, price, availability into target_store_id, target_price, target_availability
    from public.product_offers where id = new.product_offer_id;
  else
    select store_id, price, availability into target_store_id, target_price, target_availability
    from public.used_device_units where id = new.used_device_unit_id;
  end if;

  if target_store_id is null then
    raise exception 'reservations: band qilinayotgan mahsulot topilmadi';
  end if;
  if target_store_id != new.store_id then
    raise exception 'reservations: store_id mahsulotning haqiqiy do''koniga mos emas';
  end if;
  if new.price_locked != target_price then
    raise exception 'reservations: price_locked joriy narxga mos emas';
  end if;
  if not is_privileged and not target_availability then
    raise exception 'reservations: mahsulot hozir mavjud emas';
  end if;

  if not is_privileged then
    -- A buyer's INSERT payload can otherwise carry ANY value for these —
    -- RLS's reservations_buyer_insert only checks user_id = auth.uid().
    -- Force every reservation to start in the one legitimate initial
    -- state, and force a server-computed hold window regardless of
    -- whatever expires_at the client sent.
    new.status := 'pending';
    new.confirmed_at := null;
    new.purchased_at := null;
    new.cancelled_at := null;
    new.seller_comment := null;
    new.cancel_reason := null;
    new.expires_at := now() + interval '4 hours';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2, 3, 7 (confirmed_at/purchased_at/cancelled_at): a real state machine,
-- with store-member and buyer privileges kept separate from true
-- admin/service-role privilege, and system timestamps stamped server-side.
-- ---------------------------------------------------------------------------
create or replace function public.guard_reservation_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_uid uuid := auth.uid();
  is_buyer boolean := acting_uid is not null and acting_uid = old.user_id;
  is_seller boolean := acting_uid is not null and public.is_store_member(old.store_id);
  is_privileged boolean := acting_uid is null or public.is_moderator_or_admin();
begin
  if is_privileged then
    return new; -- admin / service-role: unrestricted, for support/corrections
  end if;

  -- Nobody but a privileged actor may ever move the reservation's
  -- identity, target, price, buyer-authored comment, or expiry — these
  -- are fixed at creation time. A store member managing the reservation
  -- is NOT privileged for this purpose (0028 wrongly treated it as such).
  if new.store_id is distinct from old.store_id
     or new.product_offer_id is distinct from old.product_offer_id
     or new.used_device_unit_id is distinct from old.used_device_unit_id
     or new.branch_id is distinct from old.branch_id
     or new.price_locked is distinct from old.price_locked
     or new.user_id is distinct from old.user_id
     or new.expires_at is distinct from old.expires_at
     or new.customer_comment is distinct from old.customer_comment then
    raise exception 'reservations: bu maydonlarni faqat administrator o''zgartira oladi';
  end if;

  if is_seller then
    -- Fixed state machine — no skipping ahead, no resurrecting a terminal
    -- reservation. Only these forward edges are legal for a store member:
    --   pending          -> seller_confirmed | rejected | cancelled
    --   seller_confirmed -> customer_arrived | cancelled | expired
    --   customer_arrived -> purchased | cancelled
    if new.status is distinct from old.status and not (
      (old.status = 'pending' and new.status in ('seller_confirmed', 'rejected', 'cancelled'))
      or (old.status = 'seller_confirmed' and new.status in ('customer_arrived', 'cancelled', 'expired'))
      or (old.status = 'customer_arrived' and new.status in ('purchased', 'cancelled'))
    ) then
      raise exception 'reservations: bu status o''tishi ruxsat etilmagan (% -> %)', old.status, new.status;
    end if;
  elsif is_buyer then
    -- Buyer's only allowed move: cancel their own still-open hold. Never
    -- let them confirm their own purchase — that is exactly what would
    -- let anyone fabricate a Verified Purchase review later.
    if new.status is distinct from old.status
       and (new.status != 'cancelled' or old.status not in ('pending', 'seller_confirmed')) then
      raise exception 'reservations: xaridor faqat kutilayotgan band qilishni bekor qila oladi';
    end if;
    if new.seller_comment is distinct from old.seller_comment
       or new.cancel_reason is distinct from old.cancel_reason then
      raise exception 'reservations: bu maydonlarni faqat sotuvchi yozadi';
    end if;
  else
    raise exception 'reservations: sizda bu yozuvni o''zgartirish huquqi yo''q';
  end if;

  -- Status-transition timestamps are always system-derived from here on —
  -- never trust a client-supplied confirmed_at/purchased_at/cancelled_at,
  -- which would otherwise let a status change be silently backdated.
  if new.status is distinct from old.status then
    new.confirmed_at := case when new.status = 'seller_confirmed' then now() else old.confirmed_at end;
    new.purchased_at := case when new.status = 'purchased' then now() else old.purchased_at end;
    new.cancelled_at := case when new.status in ('cancelled', 'rejected', 'expired') then now() else old.cancelled_at end;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4: at most one active (non-terminal) reservation per physical used
-- phone. A plain unique index on used_device_unit_id would forbid ever
-- re-reserving a device once its first reservation ends — this partial
-- index only applies while a reservation is still "in flight", so a
-- cancelled/rejected/expired/purchased row never blocks a new one, but
-- two people can never simultaneously hold the same unit.
-- ---------------------------------------------------------------------------
create unique index reservations_one_active_per_device_idx
  on public.reservations (used_device_unit_id)
  where used_device_unit_id is not null
    and status in ('pending', 'seller_confirmed', 'customer_arrived');

-- ---------------------------------------------------------------------------
-- 6: once a used-phone reservation is marked purchased, the unit itself
-- must stop appearing as available — otherwise a sold phone stays
-- searchable and could be "reserved" again by someone else. Deliberately
-- scoped to used_device_units only: product_offers represent a seller's
-- general listing rather than a single physical unit, and this codebase
-- does not yet track per-unit stock for new phones (see project notes on
-- store inventory) — closing an offer on one sale would be wrong when the
-- seller may have more of the same phone in stock.
-- ---------------------------------------------------------------------------
create or replace function public.close_used_device_on_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.used_device_unit_id is not null
     and new.status = 'purchased'
     and old.status is distinct from 'purchased' then
    update public.used_device_units
    set status = 'out_of_stock', availability = false
    where id = new.used_device_unit_id;
  end if;
  return new;
end;
$$;

create trigger reservations_close_device_on_purchase
  after update on public.reservations
  for each row execute function public.close_used_device_on_purchase();

-- ---------------------------------------------------------------------------
-- 8: lazy/scheduled expiry. Postgres has no "trigger on SELECT", so a
-- lapsed hold can't flip itself the instant it expires — this function is
-- meant to be invoked periodically (see src/app/api/cron/expire-
-- reservations/route.ts, using the existing CRON_SECRET convention) and
-- is also safe to call ad hoc from the admin panel later.
-- ---------------------------------------------------------------------------
create or replace function public.expire_stale_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  -- Callable by the service role (auth.uid() is null for a service-role
  -- request) or a real admin/moderator — never by an ordinary
  -- authenticated/anon caller, even though this only ever touches already-
  -- lapsed rows. Matches this codebase's existing convention of enforcing
  -- privilege inside the function body rather than via schema grants.
  if auth.uid() is not null and not public.is_moderator_or_admin() then
    raise exception 'expire_stale_reservations: ruxsat etilmagan';
  end if;

  update public.reservations
  set status = 'expired'
  where status in ('pending', 'seller_confirmed')
    and expires_at < now();
  get diagnostics affected = row_count;
  return affected;
end;
$$;
