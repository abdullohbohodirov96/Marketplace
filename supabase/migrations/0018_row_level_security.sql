-- ============================================================================
-- Malika Market — 0018: Row Level Security
--
-- Convention:
--   * "public read" = anon + authenticated may SELECT rows that are approved/
--     active/public; owners always see their own regardless of status.
--   * Every mutating policy is scoped to the owning user_id / store ownership
--     (via is_store_member) or to moderator/admin.
--   * Tables written only by trusted server code (service role, which bypasses
--     RLS entirely) get NO client-facing insert policy, e.g. audit_logs,
--     notification_delivery_log, analytics aggregate maintenance.
-- ============================================================================

-- Turn RLS on for every table in one pass.
do $$
declare
  t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public'
      and tablename not like 'pg_%'
  loop
    execute format('alter table public.%I enable row level security;', t.tablename);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Reference data — public read, admin write
-- ---------------------------------------------------------------------------
create policy roles_public_read on public.roles for select using (true);

create policy plans_public_read on public.plans for select using (is_active or public.is_admin());
create policy plans_admin_write on public.plans for all using (public.is_admin()) with check (public.is_admin());

create policy categories_public_read on public.categories for select using (is_active or public.is_moderator_or_admin());
create policy categories_admin_write on public.categories for insert with check (public.is_admin());
create policy categories_admin_update on public.categories for update using (public.is_admin()) with check (public.is_admin());
create policy categories_admin_delete on public.categories for delete using (public.is_admin());

create policy category_attrs_public_read on public.category_attribute_defs for select using (true);
create policy category_attrs_admin_write on public.category_attribute_defs for all using (public.is_admin()) with check (public.is_admin());

create policy brands_public_read on public.brands for select using (is_active or public.is_moderator_or_admin());
create policy brands_admin_write on public.brands for insert with check (public.is_admin());
create policy brands_admin_update on public.brands for update using (public.is_admin()) with check (public.is_admin());
create policy brands_admin_delete on public.brands for delete using (public.is_admin());

create policy search_synonyms_public_read on public.search_synonyms for select using (true);
create policy search_synonyms_admin_write on public.search_synonyms for all using (public.is_admin()) with check (public.is_admin());

create policy banners_public_read on public.banners for select using (is_active or public.is_admin());
create policy banners_admin_write on public.banners for all using (public.is_admin()) with check (public.is_admin());

create policy feature_flags_public_read on public.feature_flags for select using (true);
create policy feature_flags_admin_write on public.feature_flags for update using (public.is_admin()) with check (public.is_admin());

create policy platform_settings_public_read on public.platform_settings for select using (true);
create policy platform_settings_admin_write on public.platform_settings for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy profiles_self_read on public.profiles for select using (id = auth.uid());
create policy profiles_admin_read on public.profiles for select using (public.is_moderator_or_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = public.current_role());
create policy profiles_admin_update on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- stores / membership / locations / schedules
-- ---------------------------------------------------------------------------
create policy stores_public_read on public.stores for select using (
  status = 'approved' or owner_id = auth.uid() or public.is_store_member(id) or public.is_moderator_or_admin()
);
create policy stores_seller_insert on public.stores for insert with check (
  owner_id = auth.uid() and public.current_role() in ('seller', 'admin')
);
create policy stores_owner_update on public.stores for update using (
  public.is_store_member(id, 'manager') or public.is_admin()
) with check (
  public.is_store_member(id, 'manager') or public.is_admin()
);
create policy stores_admin_delete on public.stores for delete using (public.is_admin());

create policy store_members_read on public.store_members for select using (
  user_id = auth.uid() or public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy store_members_owner_manage on public.store_members for insert with check (
  public.is_store_member(store_id, 'owner') or public.is_admin()
);
create policy store_members_owner_update on public.store_members for update using (
  public.is_store_member(store_id, 'owner') or public.is_admin()
) with check (public.is_store_member(store_id, 'owner') or public.is_admin());
create policy store_members_owner_delete on public.store_members for delete using (
  public.is_store_member(store_id, 'owner') or public.is_admin()
);

create policy store_locations_public_read on public.store_locations for select using (
  exists (select 1 from public.stores s where s.id = store_id and s.status = 'approved')
  or public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy store_locations_manage on public.store_locations for all using (
  public.is_store_member(store_id, 'manager') or public.is_admin()
) with check (public.is_store_member(store_id, 'manager') or public.is_admin());

create policy store_schedules_public_read on public.store_schedules for select using (
  exists (select 1 from public.stores s where s.id = store_id and s.status = 'approved')
  or public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy store_schedules_manage on public.store_schedules for all using (
  public.is_store_member(store_id, 'manager') or public.is_admin()
) with check (public.is_store_member(store_id, 'manager') or public.is_admin());

create policy store_quick_replies_manage on public.store_quick_replies for all using (
  public.is_store_member(store_id) or public.is_admin()
) with check (public.is_store_member(store_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------
create policy subscriptions_store_read on public.subscriptions for select using (
  public.is_store_member(store_id) or public.is_admin()
);
create policy subscriptions_admin_write on public.subscriptions for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- catalog products / specs / aliases / merge history
-- ---------------------------------------------------------------------------
create policy catalog_products_public_read on public.catalog_products for select using (
  status = 'approved' or created_by = auth.uid() or public.is_moderator_or_admin()
);
create policy catalog_products_seller_insert on public.catalog_products for insert with check (
  created_by = auth.uid() and public.current_role() in ('seller', 'admin', 'moderator')
);
create policy catalog_products_owner_update on public.catalog_products for update using (
  created_by = auth.uid() or public.is_moderator_or_admin()
) with check (created_by = auth.uid() or public.is_moderator_or_admin());
create policy catalog_products_admin_delete on public.catalog_products for delete using (public.is_admin());

create policy catalog_product_specs_read on public.catalog_product_specs for select using (true);
create policy catalog_product_specs_write on public.catalog_product_specs for all using (
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

create policy product_aliases_read on public.product_aliases for select using (true);
create policy product_aliases_write on public.product_aliases for all using (public.is_moderator_or_admin())
  with check (public.is_moderator_or_admin());

create policy product_merge_history_read on public.product_merge_history for select using (public.is_moderator_or_admin());
create policy product_merge_history_write on public.product_merge_history for insert with check (public.is_moderator_or_admin());

-- ---------------------------------------------------------------------------
-- product offers, images, branch inventory, price/version history
-- ---------------------------------------------------------------------------
create policy product_offers_public_read on public.product_offers for select using (
  (status = 'active' and deleted_at is null)
  or public.is_store_member(store_id)
  or public.is_moderator_or_admin()
);
create policy product_offers_seller_insert on public.product_offers for insert with check (
  public.is_store_member(store_id) and public.current_role() in ('seller', 'admin')
);
create policy product_offers_seller_update on public.product_offers for update using (
  public.is_store_member(store_id) or public.is_moderator_or_admin()
) with check (public.is_store_member(store_id) or public.is_moderator_or_admin());
create policy product_offers_seller_delete on public.product_offers for delete using (
  public.is_store_member(store_id, 'manager') or public.is_admin()
);

create policy product_offer_images_read on public.product_offer_images for select using (
  exists (
    select 1 from public.product_offers po
    where po.id = product_offer_id
      and ((po.status = 'active' and po.deleted_at is null) or public.is_store_member(po.store_id) or public.is_moderator_or_admin())
  )
);
create policy product_offer_images_write on public.product_offer_images for all using (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
  or public.is_moderator_or_admin()
) with check (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
  or public.is_moderator_or_admin()
);

create policy branch_inventory_read on public.branch_inventory for select using (
  exists (select 1 from public.store_locations sl where sl.id = branch_id and (public.is_store_member(sl.store_id) or true))
);
create policy branch_inventory_write on public.branch_inventory for all using (
  exists (select 1 from public.store_locations sl where sl.id = branch_id and public.is_store_member(sl.store_id))
  or public.is_admin()
) with check (
  exists (select 1 from public.store_locations sl where sl.id = branch_id and public.is_store_member(sl.store_id))
  or public.is_admin()
);

create policy price_history_read on public.price_history for select using (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and (po.status = 'active' or public.is_store_member(po.store_id) or public.is_moderator_or_admin()))
);

create policy product_versions_read on public.product_versions for select using (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and (public.is_store_member(po.store_id) or public.is_moderator_or_admin()))
);
create policy store_versions_read on public.store_versions for select using (
  public.is_store_member(store_id) or public.is_moderator_or_admin()
);

-- ---------------------------------------------------------------------------
-- customer interactions — strictly owner-only
-- ---------------------------------------------------------------------------
create policy favorites_owner_all on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_stores_owner_all on public.saved_stores for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy product_comparisons_owner_all on public.product_comparisons for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy search_history_owner_all on public.search_history for all using (user_id = auth.uid() or user_id is null) with check (user_id = auth.uid() or user_id is null);
create policy saved_searches_owner_all on public.saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy price_alerts_owner_all on public.price_alerts for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- reviews / replies / votes / reports / disputes
-- ---------------------------------------------------------------------------
create policy reviews_public_read on public.reviews for select using (
  (status = 'approved' and deleted_at is null) or user_id = auth.uid() or public.is_moderator_or_admin()
  or (store_id is not null and public.is_store_member(store_id))
);
create policy reviews_customer_insert on public.reviews for insert with check (user_id = auth.uid());
create policy reviews_customer_update on public.reviews for update using (
  (user_id = auth.uid() and deleted_at is null) or public.is_moderator_or_admin()
) with check (user_id = auth.uid() or public.is_moderator_or_admin());
create policy reviews_admin_delete on public.reviews for delete using (public.is_admin());

create policy review_replies_public_read on public.review_replies for select using (true);
create policy review_replies_seller_write on public.review_replies for all using (
  public.is_store_member(store_id) or public.is_moderator_or_admin()
) with check (public.is_store_member(store_id) or public.is_moderator_or_admin());

create policy review_votes_owner_all on public.review_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reports_reporter_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_reporter_read on public.reports for select using (reporter_id = auth.uid() or public.is_moderator_or_admin());
create policy reports_admin_update on public.reports for update using (public.is_moderator_or_admin()) with check (public.is_moderator_or_admin());

create policy disputes_read on public.disputes for select using (
  public.is_moderator_or_admin() or (store_id is not null and public.is_store_member(store_id))
  or exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid())
);
create policy disputes_admin_write on public.disputes for all using (public.is_moderator_or_admin()) with check (public.is_moderator_or_admin());

create policy dispute_messages_participant_read on public.dispute_messages for select using (
  public.is_moderator_or_admin()
  or exists (
    select 1 from public.disputes d
    left join public.reports r on r.id = d.report_id
    where d.id = dispute_id and (r.reporter_id = auth.uid() or (d.store_id is not null and public.is_store_member(d.store_id)))
  )
);
create policy dispute_messages_participant_insert on public.dispute_messages for insert with check (
  sender_id = auth.uid() and (
    public.is_moderator_or_admin()
    or exists (
      select 1 from public.disputes d
      left join public.reports r on r.id = d.report_id
      where d.id = dispute_id and (r.reporter_id = auth.uid() or (d.store_id is not null and public.is_store_member(d.store_id)))
    )
  )
);

create policy sale_outcomes_owner_insert on public.sale_outcomes for insert with check (user_id = auth.uid());
create policy sale_outcomes_read on public.sale_outcomes for select using (
  user_id = auth.uid() or public.is_moderator_or_admin()
  or exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create policy notifications_owner_all on public.notifications for select using (user_id = auth.uid());
create policy notifications_owner_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_owner_delete on public.notifications for delete using (user_id = auth.uid());
create policy notification_preferences_owner_all on public.notification_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_delivery_log_admin_read on public.notification_delivery_log for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- chat
-- ---------------------------------------------------------------------------
create policy conversations_participant_read on public.conversations for select using (
  customer_id = auth.uid() or public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy conversations_customer_insert on public.conversations for insert with check (customer_id = auth.uid());
create policy conversations_participant_update on public.conversations for update using (
  customer_id = auth.uid() or public.is_store_member(store_id)
) with check (customer_id = auth.uid() or public.is_store_member(store_id));

create policy messages_participant_read on public.messages for select using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.customer_id = auth.uid() or public.is_store_member(c.store_id) or public.is_moderator_or_admin())
  )
);
create policy messages_participant_insert on public.messages for insert with check (
  sender_id = auth.uid() and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and c.status <> 'blocked'
      and (c.customer_id = auth.uid() or public.is_store_member(c.store_id))
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = c.customer_id and b.blocked_id = auth.uid())
           or (b.blocker_id = auth.uid() and b.blocked_id = c.customer_id)
      )
  )
);
create policy messages_sender_update on public.messages for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());

create policy blocked_users_owner_all on public.blocked_users for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- ---------------------------------------------------------------------------
-- request for offer / seller proposals
-- ---------------------------------------------------------------------------
create policy request_for_offers_public_read on public.request_for_offers for select using (
  status = 'open' or user_id = auth.uid() or public.is_moderator_or_admin()
);
create policy request_for_offers_owner_insert on public.request_for_offers for insert with check (user_id = auth.uid());
create policy request_for_offers_owner_update on public.request_for_offers for update using (
  user_id = auth.uid() or public.is_moderator_or_admin()
) with check (user_id = auth.uid() or public.is_moderator_or_admin());

create policy seller_proposals_read on public.seller_proposals for select using (
  public.is_store_member(store_id)
  or exists (select 1 from public.request_for_offers r where r.id = request_id and r.user_id = auth.uid())
  or public.is_moderator_or_admin()
);
create policy seller_proposals_seller_insert on public.seller_proposals for insert with check (public.is_store_member(store_id));
create policy seller_proposals_update on public.seller_proposals for update using (
  public.is_store_member(store_id)
  or exists (select 1 from public.request_for_offers r where r.id = request_id and r.user_id = auth.uid())
) with check (
  public.is_store_member(store_id)
  or exists (select 1 from public.request_for_offers r where r.id = request_id and r.user_id = auth.uid())
);

-- ---------------------------------------------------------------------------
-- import / export jobs — store-scoped only
-- ---------------------------------------------------------------------------
create policy import_jobs_store_all on public.import_jobs for all using (
  public.is_store_member(store_id) or public.is_admin()
) with check (public.is_store_member(store_id) or public.is_admin());
create policy import_rows_store_read on public.import_rows for select using (
  exists (select 1 from public.import_jobs j where j.id = import_job_id and (public.is_store_member(j.store_id) or public.is_admin()))
);
create policy export_jobs_store_all on public.export_jobs for all using (
  public.is_store_member(store_id) or public.is_admin()
) with check (public.is_store_member(store_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- verification / availability confirmations
-- ---------------------------------------------------------------------------
create policy store_verifications_read on public.store_verifications for select using (
  public.is_store_member(store_id) or public.is_moderator_or_admin()
);
create policy store_verifications_seller_insert on public.store_verifications for insert with check (public.is_store_member(store_id));
create policy store_verifications_admin_update on public.store_verifications for update using (public.is_moderator_or_admin()) with check (public.is_moderator_or_admin());

create policy availability_confirmations_store_all on public.availability_confirmations for all using (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
  or public.is_moderator_or_admin()
) with check (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
  or public.is_moderator_or_admin()
);

-- ---------------------------------------------------------------------------
-- delivery / installment / trade-in / promotions / warranty
-- ---------------------------------------------------------------------------
create policy delivery_options_public_read on public.delivery_options for select using (true);
create policy delivery_options_seller_write on public.delivery_options for all using (
  public.is_store_member(store_id, 'manager') or public.is_admin()
) with check (public.is_store_member(store_id, 'manager') or public.is_admin());

create policy installment_options_public_read on public.installment_options for select using (true);
create policy installment_options_seller_write on public.installment_options for all using (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
) with check (
  exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
);

create policy trade_in_requests_read on public.trade_in_requests for select using (
  user_id = auth.uid()
  or exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
  or public.is_moderator_or_admin()
);
create policy trade_in_requests_customer_insert on public.trade_in_requests for insert with check (user_id = auth.uid());
create policy trade_in_requests_update on public.trade_in_requests for update using (
  user_id = auth.uid()
  or exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
) with check (
  user_id = auth.uid()
  or exists (select 1 from public.product_offers po where po.id = product_offer_id and public.is_store_member(po.store_id))
);

create policy promotions_public_read on public.promotions for select using (
  status in ('active', 'scheduled') or public.is_store_member(store_id) or public.is_admin()
);
create policy promotions_seller_write on public.promotions for all using (
  public.is_store_member(store_id, 'manager') or public.is_admin()
) with check (public.is_store_member(store_id, 'manager') or public.is_admin());

create policy promotion_products_public_read on public.promotion_products for select using (true);
create policy promotion_products_seller_write on public.promotion_products for all using (
  exists (select 1 from public.promotions p where p.id = promotion_id and public.is_store_member(p.store_id, 'manager'))
) with check (
  exists (select 1 from public.promotions p where p.id = promotion_id and public.is_store_member(p.store_id, 'manager'))
);

create policy promo_codes_public_read on public.promo_codes for select using (status = 'active');
create policy promo_codes_seller_write on public.promo_codes for all using (
  exists (select 1 from public.promotions p where p.id = promotion_id and public.is_store_member(p.store_id, 'manager'))
) with check (
  exists (select 1 from public.promotions p where p.id = promotion_id and public.is_store_member(p.store_id, 'manager'))
);

-- Warranty documents: strictly the customer, the store, and admins — never public.
create policy warranty_documents_participant_read on public.warranty_documents for select using (
  customer_id = auth.uid() or public.is_store_member(store_id) or public.is_admin()
);
create policy warranty_documents_seller_write on public.warranty_documents for all using (
  public.is_store_member(store_id) or public.is_admin()
) with check (public.is_store_member(store_id) or public.is_admin());

-- ---------------------------------------------------------------------------
-- analytics — anyone (incl. anon) may insert their own event; reads scoped
-- to the owning store or admin. No update/delete from the client.
-- ---------------------------------------------------------------------------
create policy analytics_events_insert on public.analytics_events for insert with check (
  user_id is null or user_id = auth.uid()
);
create policy analytics_events_store_read on public.analytics_events for select using (
  (store_id is not null and public.is_store_member(store_id)) or public.is_admin()
);

-- ---------------------------------------------------------------------------
-- moderation / audit logs — moderator/admin read only; written by server code
-- using the service role (bypasses RLS), never directly by clients.
-- ---------------------------------------------------------------------------
create policy moderation_logs_read on public.moderation_logs for select using (public.is_moderator_or_admin());
create policy moderation_logs_insert on public.moderation_logs for insert with check (public.is_moderator_or_admin());

create policy audit_logs_admin_read on public.audit_logs for select using (public.is_admin());
