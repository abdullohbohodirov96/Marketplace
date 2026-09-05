-- ============================================================================
-- Telefy — 0028: Reservation integrity, Telefy Check guard completeness,
-- variant/offer consistency, IMEI de-duplication
--
-- Closes real holes found in code review of 0024-0027:
--
--  1. A reservation's price_locked/store_id must match the offer/device it
--     targets at INSERT time — a client can otherwise send any price/store.
--  2. Once created, a reservation's target (store/offer/device/price/buyer)
--     is immutable for anyone but a store member/admin/service-role — a
--     buyer could otherwise edit their own row after the fact.
--  3. A buyer may only ever move their own reservation to 'cancelled' — the
--     RLS update policy alone let them set ANY status including 'purchased',
--     which would fabricate a Verified Purchase for themselves.
--  4. telefy_check_notes was missing from the moderator-only guard added in
--     0025 — a seller could still edit the check's own notes.
--  5. product_offers.color/memory could silently diverge from the variant
--     they claim to belong to (variant_id) — now the variant is the single
--     source of truth and offers/devices are checked against it.
--  6. product_variants' uniqueness used a plain multi-column UNIQUE
--     constraint, which in Postgres treats NULL as distinct from NULL —
--     unlimited "no color / no memory" duplicates could slip through.
--  7. used_device_units.imei_hash had no uniqueness — the same physical
--     phone could be listed more than once with no way to catch it.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1 & 2 & 3: reservation integrity
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
begin
  if (new.product_offer_id is not null) = (new.used_device_unit_id is not null) then
    raise exception 'reservations: aynan bittasi — product_offer_id yoki used_device_unit_id — berilishi shart';
  end if;

  if new.product_offer_id is not null then
    select store_id, price into target_store_id, target_price
    from public.product_offers where id = new.product_offer_id;
  else
    select store_id, price into target_store_id, target_price
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

  return new;
end;
$$;

create trigger reservations_validate_target
  before insert on public.reservations
  for each row execute function public.validate_reservation_target();

create or replace function public.guard_reservation_transitions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acting_uid uuid := auth.uid();
  is_buyer boolean := acting_uid is not null and acting_uid = old.user_id;
  is_privileged boolean := acting_uid is null or public.is_store_member(old.store_id) or public.is_moderator_or_admin();
begin
  -- Service-role/admin/store-member writes are trusted; everyone else can
  -- never move the reservation's target, price, or owner after creation.
  if not is_privileged then
    if new.store_id is distinct from old.store_id
       or new.product_offer_id is distinct from old.product_offer_id
       or new.used_device_unit_id is distinct from old.used_device_unit_id
       or new.price_locked is distinct from old.price_locked
       or new.user_id is distinct from old.user_id then
      raise exception 'reservations: bu maydonlarni faqat do''kon/admin o''zgartira oladi';
    end if;
  end if;

  if is_buyer and not (public.is_store_member(old.store_id) or public.is_moderator_or_admin()) then
    -- The buyer's only allowed move: cancel their own still-open hold.
    -- Never let them confirm their own purchase — that is exactly what
    -- would let anyone fabricate a Verified Purchase review later.
    if new.status is distinct from old.status
       and (new.status != 'cancelled' or old.status not in ('pending', 'seller_confirmed')) then
      raise exception 'reservations: xaridor faqat kutilayotgan band qilishni bekor qila oladi';
    end if;
    if new.seller_comment is distinct from old.seller_comment then
      raise exception 'reservations: seller_comment faqat sotuvchi tomonidan yoziladi';
    end if;
  end if;

  return new;
end;
$$;

create trigger reservations_guard_transitions
  before update on public.reservations
  for each row execute function public.guard_reservation_transitions();

-- ---------------------------------------------------------------------------
-- 4: extend the Telefy Check guard from 0025 to also cover check notes
-- ---------------------------------------------------------------------------
create or replace function public.guard_telefy_check_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and not public.is_moderator_or_admin() then
    if new.telefy_check_status is distinct from old.telefy_check_status
       or new.telefy_checked_by is distinct from old.telefy_checked_by
       or new.telefy_checked_at is distinct from old.telefy_checked_at
       or new.telefy_check_notes is distinct from old.telefy_check_notes then
      new.telefy_check_status := old.telefy_check_status;
      new.telefy_checked_by := old.telefy_checked_by;
      new.telefy_checked_at := old.telefy_checked_at;
      new.telefy_check_notes := old.telefy_check_notes;
    end if;
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5: variant is the single source of truth for color/memory; a
-- product_offer or used_device_unit can never point at a variant that
-- belongs to a different catalog product than the one it's listed under.
-- ---------------------------------------------------------------------------
create or replace function public.sync_offer_variant_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v record;
begin
  if new.variant_id is not null then
    select catalog_product_id, color, memory into v
    from public.product_variants where id = new.variant_id;

    if v is null then
      raise exception 'product_offers: variant_id noto''g''ri';
    end if;
    if v.catalog_product_id != new.catalog_product_id then
      raise exception 'product_offers: variant boshqa modelga tegishli';
    end if;

    new.color := v.color;
    new.memory := v.memory;
  end if;
  return new;
end;
$$;

create trigger product_offers_sync_variant_fields
  before insert or update of variant_id, catalog_product_id on public.product_offers
  for each row execute function public.sync_offer_variant_fields();

create or replace function public.validate_used_device_variant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  variant_catalog_id uuid;
begin
  if new.variant_id is not null then
    select catalog_product_id into variant_catalog_id
    from public.product_variants where id = new.variant_id;

    if variant_catalog_id is null then
      raise exception 'used_device_units: variant_id noto''g''ri';
    end if;
    if variant_catalog_id != new.catalog_product_id then
      raise exception 'used_device_units: variant boshqa modelga tegishli';
    end if;
  end if;
  return new;
end;
$$;

create trigger used_device_units_validate_variant
  before insert or update of variant_id, catalog_product_id on public.used_device_units
  for each row execute function public.validate_used_device_variant();

-- ---------------------------------------------------------------------------
-- 6: replace the plain UNIQUE constraint (NULL-blind) with a normalized
-- expression index so "no color / no memory" variants dedupe correctly.
-- ---------------------------------------------------------------------------
alter table public.product_variants
  drop constraint product_variants_catalog_product_id_color_memory_sku_suffix_key;

create unique index product_variants_normalized_unique_idx on public.product_variants (
  catalog_product_id, coalesce(color, ''), coalesce(memory, ''), coalesce(sku_suffix, '')
);

-- ---------------------------------------------------------------------------
-- 7: the same physical device (by IMEI) can't be listed twice.
-- ---------------------------------------------------------------------------
create unique index used_device_units_imei_hash_unique_idx
  on public.used_device_units (imei_hash) where imei_hash is not null;
