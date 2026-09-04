-- ============================================================================
-- Malika Market — 0004: Plans & subscriptions (monetization-ready, all free now)
-- ============================================================================

create table public.plans (
  code public.plan_code primary key,
  name_uz text not null,
  name_ru text,
  price_monthly numeric(12, 2) not null default 0,
  currency text not null default 'UZS',
  max_products integer,              -- null = unlimited
  max_images_per_product integer not null default 8,
  max_branches integer not null default 1,
  max_staff integer not null default 1,
  top_results_included boolean not null default false,
  verified_badge_included boolean not null default false,
  ad_banners_included boolean not null default false,
  analytics_level text not null default 'basic' check (analytics_level in ('basic', 'advanced')),
  sort_order smallint not null default 0,
  is_active boolean not null default true
);

insert into public.plans
  (code, name_uz, name_ru, price_monthly, max_products, max_images_per_product, max_branches, max_staff, top_results_included, verified_badge_included, ad_banners_included, analytics_level, sort_order)
values
  ('free', 'Bepul', 'Бесплатный', 0, 30, 5, 1, 1, false, false, false, 'basic', 1),
  ('standard', 'Standard', 'Стандарт', 149000, 150, 10, 2, 3, true, true, false, 'basic', 2),
  ('pro', 'Pro', 'Про', 349000, null, 20, 5, 10, true, true, true, 'advanced', 3);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,   -- FK added in 0005 after stores table exists
  plan_code public.plan_code not null references public.plans (code) default 'free',
  start_date timestamptz not null default now(),
  end_date timestamptz,     -- null = open-ended (used for FREE)
  status public.subscription_status not null default 'active',
  payment_status public.payment_status not null default 'not_applicable',
  external_payment_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
