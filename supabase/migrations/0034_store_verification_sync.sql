-- ============================================================================
-- Telefy — 0034: approving a verification request actually badges the store
--
-- store_verifications (0014) has sat unused since it was created — nothing
-- ever set stores.verified once a request was approved (the column the
-- product/store pages actually render <BadgeCheck> from). Moderators can
-- update store_verifications.status (store_verifications_admin_update in
-- 0018_row_level_security.sql) but NOT stores directly (stores_owner_update
-- there is public.is_admin() only) — same trigger pattern as
-- 0009's reviews_sync_store_rating keeps that consistent without loosening
-- stores' RLS to moderators.
-- ============================================================================

create or replace function public.sync_store_verified_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if new.status = 'approved' then
    update public.stores set verified = true where id = new.store_id;
  elsif old.status = 'approved' and new.status = 'rejected' then
    -- A previously-granted badge being reversed — keep the two in sync both
    -- ways rather than only ever turning the badge on.
    update public.stores set verified = false where id = new.store_id;
  end if;

  return new;
end;
$$;

create trigger store_verifications_sync_badge
  after update of status on public.store_verifications
  for each row execute function public.sync_store_verified_badge();
