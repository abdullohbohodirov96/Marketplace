-- ============================================================================
-- Telefy — 0031: real moderation enforcement
--
-- Two gaps existed even though the schema (store_status/product_status
-- enums, rejection_reason, approved_at/by, account_status) was already
-- built out back in 0002/0003/0005/0007/0025:
--
-- 1) A store's own read policy (0018) already hides it while status is
--    'pending'/'rejected'/'suspended', but product_offers_public_read and
--    used_device_units_public_read (0018/0027) only ever checked the
--    LISTING's own status — never its parent store's. So a listing under a
--    pending or later-suspended store still showed up publicly in
--    /search, /categories/[slug], etc. This closes that gap.
-- 2) public.is_account_active() (0003) was defined but never referenced by
--    any policy or app code — setting profiles.status = 'blocked' did
--    nothing. This wires it into the three seller-insert policies so a
--    blocked account can no longer create a new store or listing.
--
-- App code stops inserting stores/product_offers/used_device_units with
-- status = 'approved'/'active' directly (see src/app/sell/actions.ts) —
-- new rows now start 'pending' and wait for /admin/moderation.
-- ============================================================================

drop policy if exists product_offers_public_read on public.product_offers;
create policy product_offers_public_read on public.product_offers for select using (
  (
    status = 'active' and deleted_at is null
    and exists (select 1 from public.stores s where s.id = store_id and s.status = 'approved')
  )
  or public.is_store_member(store_id)
  or public.is_moderator_or_admin()
);

drop policy if exists product_offer_images_read on public.product_offer_images;
create policy product_offer_images_read on public.product_offer_images for select using (
  exists (
    select 1 from public.product_offers po
    join public.stores s on s.id = po.store_id
    where po.id = product_offer_id
      and (
        (po.status = 'active' and po.deleted_at is null and s.status = 'approved')
        or public.is_store_member(po.store_id)
        or public.is_moderator_or_admin()
      )
  )
);

drop policy if exists used_device_units_public_read on public.used_device_units;
create policy used_device_units_public_read on public.used_device_units for select using (
  (
    status = 'active' and deleted_at is null
    and exists (select 1 from public.stores s where s.id = store_id and s.status = 'approved')
  )
  or public.is_store_member(store_id)
  or public.is_moderator_or_admin()
);

drop policy if exists used_device_checklist_items_read on public.used_device_checklist_items;
create policy used_device_checklist_items_read on public.used_device_checklist_items for select using (
  exists (
    select 1 from public.used_device_units u
    join public.stores s on s.id = u.store_id
    where u.id = used_device_unit_id
      and (
        (u.status = 'active' and u.deleted_at is null and s.status = 'approved')
        or public.is_store_member(u.store_id)
        or public.is_moderator_or_admin()
      )
  )
);

-- ---------------------------------------------------------------------------
-- Blocked accounts (profiles.status = 'blocked') can no longer create a new
-- store or listing. Existing rows they already own aren't touched here —
-- an admin suspends the store itself (stores.status = 'suspended') to pull
-- its listings out of public view, which the read-policy fix above enforces.
-- ---------------------------------------------------------------------------
drop policy if exists stores_seller_insert on public.stores;
create policy stores_seller_insert on public.stores for insert with check (
  owner_id = auth.uid() and public.current_role() in ('seller', 'admin') and public.is_account_active()
);

drop policy if exists product_offers_seller_insert on public.product_offers;
create policy product_offers_seller_insert on public.product_offers for insert with check (
  public.is_store_member(store_id) and public.current_role() in ('seller', 'admin') and public.is_account_active()
);

drop policy if exists used_device_units_seller_insert on public.used_device_units;
create policy used_device_units_seller_insert on public.used_device_units for insert with check (
  public.is_store_member(store_id) and public.current_role() in ('seller', 'admin') and public.is_account_active()
);
