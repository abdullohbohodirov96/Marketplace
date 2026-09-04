-- ============================================================================
-- Malika Market — 0017: Moderation log, audit log, banners, feature flags,
-- platform settings
-- ============================================================================

create table public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references public.profiles (id),
  target_type text not null,   -- 'store' | 'product_offer' | 'review' | 'catalog_product' | ...
  target_id uuid not null,
  action text not null,        -- 'approve' | 'reject' | 'hide' | 'merge' | ...
  reason text,
  created_at timestamptz not null default now()
);

create index moderation_logs_target_idx on public.moderation_logs (target_type, target_id);
create index moderation_logs_moderator_idx on public.moderation_logs (moderator_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}',
  ip_address inet,
  created_at timestamptz not null default now()
);

create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);
create index audit_logs_target_idx on public.audit_logs (target_type, target_id);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  placement text not null default 'home_top' check (
    placement in ('home_top', 'home_middle', 'category_top', 'store_page')
  ),
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index banners_placement_idx on public.banners (placement) where is_active;

-- Toggle large feature areas without a deploy. Checked both client-side (hide
-- nav entries) and server-side (route/RPC guards) — see src/lib/feature-flags.ts.
create table public.feature_flags (
  key text primary key,
  label text not null,
  is_enabled boolean not null default false,
  description text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.feature_flags (key, label, is_enabled, description) values
  ('internal_chat', 'Ichki chat', true, 'Mijoz-sotuvchi platforma ichi chat'),
  ('trade_in_requests', 'Trade-in so''rovlari', true, 'Eski qurilmani almashtirish so''rovi'),
  ('installment_calculator', 'Bo''lib to''lash kalkulyatori', true, 'Mahsulot sahifasidagi bo''lib to''lash hisoblagichi'),
  ('warranty_documents', 'Kafolat hujjatlari', false, 'Elektron kafolat va xarid hujjatlari moduli'),
  ('price_history', 'Narx tarixi', true, 'Mahsulot sahifasidagi narx tarixi grafigi'),
  ('price_alerts', 'Narx tushsa xabar ber', true, 'Mijozlar uchun narx bildirishnomasi'),
  ('request_for_offer', '"Topib bering" so''rovlari', true, 'Mijozning maxsus so''rovlari va sotuvchi takliflari'),
  ('promo_codes', 'Promokod va aksiyalar', true, 'Sotuvchi aksiyalari va promokodlar'),
  ('web_push', 'Web push bildirishnomalar', false, 'Brauzer push notification kanali'),
  ('seller_verification', 'Sotuvchi verifikatsiyasi', true, 'Do''kon tekshiruv va ishonch belgilari');

-- Free-form key/value platform settings (moderation SLAs, limits, SEO, etc.)
-- so operational knobs don't require a code change.
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles (id),
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (key, value, description) values
  ('platform_name', '"Malika Market"', 'Platforma nomi'),
  ('product_moderation_review_days', '3', 'Yangi mahsulotni moderator ko''rib chiqishi kutilayotgan kun'),
  ('offer_stale_after_days', '3', 'Nechi kundan keyin taklif "eskirgan" deb belgilanadi'),
  ('offer_auto_inactive_after_days', '14', 'Nechi kundan keyin tasdiqlanmagan taklif avtomatik inactive bo''ladi'),
  ('notification_cooldown_hours', '72', 'Bir xil turdagi bildirishnoma orasidagi minimal interval'),
  ('import_max_rows', '2000', 'Bitta import faylida ruxsat etilgan maksimal qator soni'),
  ('max_images_per_offer_default', '8', 'Rejaga bog''liq bo''lmagan holatdagi standart rasm limiti'),
  ('max_file_size_mb', '10', 'Yuklanadigan fayl uchun maksimal hajm (MB)'),
  ('review_requires_moderation', 'true', 'Izohlar chop etilishidan oldin moderatsiyadan o''tishi kerakmi'),
  ('maintenance_mode', 'false', 'Platformani texnik xizmat rejimiga o''tkazish'),
  ('seo_default_title', '"Malika Market — Malika bozori onlayn"', 'Standart meta title'),
  ('seo_default_description', '"Malika elektronika bozoridagi eng yaxshi takliflarni toping va solishtiring."', 'Standart meta description');

create trigger feature_flags_set_updated_at
  before update on public.feature_flags
  for each row execute function public.set_updated_at();

create trigger platform_settings_set_updated_at
  before update on public.platform_settings
  for each row execute function public.set_updated_at();
