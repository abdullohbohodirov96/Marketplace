-- ============================================================================
-- Malika Market — 0002: Enum types
-- ============================================================================

create type public.user_role as enum ('customer', 'seller', 'moderator', 'admin');
create type public.account_status as enum ('active', 'blocked', 'deletion_requested', 'deleted');

create type public.store_member_role as enum ('owner', 'manager', 'staff');
create type public.store_status as enum ('pending', 'approved', 'rejected', 'suspended');

create type public.product_condition as enum ('new', 'used');
create type public.product_status as enum ('draft', 'pending', 'active', 'hidden', 'out_of_stock', 'rejected', 'archived');

create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.report_target_type as enum ('product', 'store', 'review', 'user');
create type public.report_status as enum ('pending', 'reviewed', 'resolved', 'dismissed');

create type public.notification_type as enum (
  'new_review', 'seller_reply', 'favorite_price_change', 'new_product',
  'saved_search_match', 'product_back_in_stock', 'moderator_message',
  'store_approved', 'store_rejected', 'product_approved', 'product_rejected',
  'inactivity_reminder'
);
create type public.notification_channel as enum ('in_app', 'telegram', 'email', 'web_push', 'sms');
create type public.notification_delivery_status as enum ('pending', 'sent', 'failed', 'skipped');

create type public.plan_code as enum ('free', 'standard', 'pro');
create type public.subscription_status as enum ('active', 'expired', 'cancelled', 'trialing');
create type public.payment_status as enum ('not_applicable', 'pending', 'paid', 'failed');

create type public.contact_channel as enum ('call', 'telegram', 'location', 'instagram', 'website');
