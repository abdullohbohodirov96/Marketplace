-- ============================================================================
-- Telefy — 0032: one review per user per target
--
-- reviews (0009) never had a uniqueness guard — nothing stopped the same
-- user submitting the same store or listing five times and inflating (or
-- tanking) rating_avg. Two partial unique indexes, one per target column
-- (reviews_target_check already guarantees exactly one of the two is set),
-- soft-delete aware so a user can leave a new review after deleting an old
-- one.
-- ============================================================================

create unique index reviews_one_per_user_offer_idx on public.reviews (user_id, product_offer_id)
  where product_offer_id is not null and deleted_at is null;

create unique index reviews_one_per_user_store_idx on public.reviews (user_id, store_id)
  where store_id is not null and deleted_at is null;
