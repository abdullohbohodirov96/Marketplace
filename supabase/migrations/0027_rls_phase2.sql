-- ============================================================================
-- Telefy — 0027: RLS for markets, product_variants, used_device_units,
-- used_device_checklist_items and reservations (0023-0026).
--
-- Kept as its own migration rather than editing 0018 — same convention as
-- that file: public read for approved/active rows, write scoped to owning
-- store membership or moderator/admin.
-- ============================================================================

alter table public.markets enable row level security;
alter table public.product_variants enable row level security;
alter table public.used_device_units enable row level security;
alter table public.used_device_checklist_items enable row level security;
alter table public.reservations enable row level security;

-- ---------------------------------------------------------------------------
-- markets — reference data, public read, admin write
-- ---------------------------------------------------------------------------
create policy markets_public_read on public.markets for select using (
  is_active or public.is_moderator_or_admin()
);
create policy markets_admin_write on public.markets for all using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_variants — mirrors catalog_products' own read/write scoping
-- ---------------------------------------------------------------------------
create policy product_variants_public_read on public.product_variants for select using (
  exists (
    select 1 from public.catalog_products cp
    where cp.id = catalog_product_id
      and (cp.status = 'approved' or cp.created_by = auth.uid() or public.is_moderator_or_admin())
  )
);
create policy product_variants_write on public.product_variants for all using (
  exists (
    select 1 from public.catalog_products cp
    where cp.id = catalog_product_id and (cp.created_by = auth.uid() or public.is_moderator_or_admin())
  )
) with check (
  exists (
    select 1 from public.catalog_products cp
    where cp.id = catalog_product_id and (cp.created_by = auth.uid() or public.is_moderator_or_admin())
  )
);

-- ---------------------------------------------------------------------------
-- used_device_units — mirrors product_offers' policies exactly
-- ---------------------------------------------------------------------------
create policy used_device_units_public_read on public.used_device_units for select using (
  (status = 'active' and deleted_at is null)
  or public.is_store_member(store_id)
  or public.is_moderator_or_admin()
);
create policy used_device_units_seller_insert on public.used_device_units for insert with check (
  public.is_store_member(store_id) and public.current_role() in ('seller', 'admin')
);
create policy used_device_units_seller_update on public.used_device_units for update using (
  public.is_store_member(store_id) or public.is_moderator_or_admin()
) with check (
  public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy used_device_units_seller_delete on public.used_device_units for delete using (
  public.is_store_member(store_id, 'manager') or public.is_admin()
);

create policy used_device_checklist_items_read on public.used_device_checklist_items for select using (
  exists (
    select 1 from public.used_device_units u
    where u.id = used_device_unit_id
      and ((u.status = 'active' and u.deleted_at is null) or public.is_store_member(u.store_id) or public.is_moderator_or_admin())
  )
);
create policy used_device_checklist_items_write on public.used_device_checklist_items for all using (
  public.is_moderator_or_admin()
) with check (public.is_moderator_or_admin());

-- ---------------------------------------------------------------------------
-- reservations — buyer sees/creates their own, store side sees/updates
-- theirs, admin sees all
-- ---------------------------------------------------------------------------
create policy reservations_read on public.reservations for select using (
  user_id = auth.uid() or public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy reservations_buyer_insert on public.reservations for insert with check (
  user_id = auth.uid()
);
create policy reservations_update on public.reservations for update using (
  user_id = auth.uid() or public.is_store_member(store_id) or public.is_moderator_or_admin()
) with check (
  user_id = auth.uid() or public.is_store_member(store_id) or public.is_moderator_or_admin()
);
