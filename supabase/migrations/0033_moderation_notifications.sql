-- ============================================================================
-- Telefy — 0033: notify sellers when moderation decides on their stuff
--
-- notifications (0010) has never had an insert policy — by design, nothing
-- but a trusted server-side path should be able to write a notification a
-- user didn't create themselves (see notifications_owner_all/update/delete
-- in 0018_row_level_security.sql: select/update/delete only, no insert at
-- all). The trusted path is triggers, the same pattern this project already
-- uses for stores.rating_avg (reviews_sync_store_rating, 0009) and
-- store_members auto-add (handle_new_store, 0005) — security definer
-- functions bypass RLS, so no insert policy is ever needed here.
--
-- Three triggers, matching notification_type values that were already
-- defined back in 0002 and never used by anything: store_approved/
-- store_rejected, product_approved/product_rejected (shared by
-- product_offers and used_device_units), and new_review (fires once a
-- review clears moderation, not on every insert — a store owner shouldn't
-- be notified about a review nobody can see yet).
-- ============================================================================

create or replace function public.notify_on_store_status_change()
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
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.owner_id,
      'store_approved',
      'Do''koningiz tasdiqlandi',
      new.name || ' endi Telefy''da ko''rinadi.',
      jsonb_build_object('store_id', new.id)
    );
  elsif new.status = 'rejected' then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      new.owner_id,
      'store_rejected',
      'Do''koningiz rad etildi',
      coalesce('Sabab: ' || new.rejection_reason, 'Sabab ko''rsatilmagan.'),
      jsonb_build_object('store_id', new.id)
    );
  end if;

  return new;
end;
$$;

create trigger stores_notify_owner
  after update of status on public.stores
  for each row execute function public.notify_on_store_status_change();

-- ---------------------------------------------------------------------------
create or replace function public.notify_on_listing_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_owner uuid;
  listing_title text;
begin
  if new.status = old.status then
    return new;
  end if;
  if new.status not in ('active', 'rejected') then
    return new;
  end if;

  select owner_id into target_owner from public.stores where id = new.store_id;
  if target_owner is null then
    return new;
  end if;

  if tg_table_name = 'product_offers' then
    listing_title := coalesce(new.seller_product_name, 'E''lon');
  else
    listing_title := coalesce(new.title, 'E''lon');
  end if;

  if new.status = 'active' then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      target_owner,
      'product_approved',
      'E''loningiz tasdiqlandi',
      listing_title || ' endi marketplace''da ko''rinadi.',
      jsonb_build_object('listing_id', new.id, 'table', tg_table_name)
    );
  else
    insert into public.notifications (user_id, type, title, body, data)
    values (
      target_owner,
      'product_rejected',
      'E''loningiz rad etildi',
      listing_title || coalesce(' — sabab: ' || new.rejection_reason, ' — sabab ko''rsatilmagan.'),
      jsonb_build_object('listing_id', new.id, 'table', tg_table_name)
    );
  end if;

  return new;
end;
$$;

create trigger product_offers_notify_owner
  after update of status on public.product_offers
  for each row execute function public.notify_on_listing_status_change();

create trigger used_device_units_notify_owner
  after update of status on public.used_device_units
  for each row execute function public.notify_on_listing_status_change();

-- ---------------------------------------------------------------------------
create or replace function public.notify_on_review_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_owner uuid;
begin
  if new.status <> 'approved' or old.status = 'approved' then
    return new;
  end if;

  if new.store_id is not null then
    select owner_id into target_owner from public.stores where id = new.store_id;
  else
    select s.owner_id into target_owner
    from public.product_offers po
    join public.stores s on s.id = po.store_id
    where po.id = new.product_offer_id;
  end if;

  if target_owner is not null then
    insert into public.notifications (user_id, type, title, body, data)
    values (
      target_owner,
      'new_review',
      'Yangi baho',
      new.rating || ' yulduzli baho qoldirildi.',
      jsonb_build_object('review_id', new.id)
    );
  end if;

  return new;
end;
$$;

create trigger reviews_notify_owner
  after update of status on public.reviews
  for each row execute function public.notify_on_review_approved();
