-- ============================================================================
-- Telefy — 0025: Used device units & Telefy Check
--
-- A used phone is not "a product_offer with condition = used" — it is one
-- specific physical device (its own IMEI, battery health, repair history).
-- This gives it its own table instead of overloading product_offers, plus a
-- per-item diagnostic checklist and a trust badge ("Telefy Check") that only
-- a moderator/admin can grant — never the seller listing the device.
-- ============================================================================

create type public.device_condition_grade as enum ('like_new', 'excellent', 'good', 'fair');
create type public.telefy_check_status as enum ('not_checked', 'pending', 'passed', 'passed_with_notes', 'failed');
create type public.device_part_status as enum ('working', 'faulty', 'not_tested', 'unknown');

create table public.used_device_units (
  id uuid primary key default gen_random_uuid(),
  catalog_product_id uuid not null references public.catalog_products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete set null,
  store_id uuid not null references public.stores (id) on delete cascade,
  branch_id uuid references public.store_locations (id) on delete set null,
  slug text not null unique,
  title text,                     -- optional seller-facing override of the catalog name
  price numeric(14, 2) not null check (price >= 0),
  currency text not null default 'UZS',

  -- Identity (never expose the raw IMEI on any public read path — the app
  -- stores/shows only a hash plus the last few digits, masked).
  serial_number text,
  imei_hash text,
  imei_last_digits text check (imei_last_digits is null or imei_last_digits ~ '^[0-9]{2,4}$'),
  imei_registered boolean not null default false,

  -- Condition & diagnostics — sellers fill these in themselves.
  battery_health smallint check (battery_health is null or battery_health between 0 and 100),
  battery_replaced boolean not null default false,
  screen_condition text not null default 'unknown' check (screen_condition in ('original', 'changed', 'unknown')),
  body_condition text,
  camera_status public.device_part_status not null default 'unknown',
  face_id_status public.device_part_status not null default 'unknown',
  touch_id_status public.device_part_status not null default 'unknown',
  true_tone_status public.device_part_status not null default 'unknown',
  speaker_status public.device_part_status not null default 'unknown',
  microphone_status public.device_part_status not null default 'unknown',
  charging_status public.device_part_status not null default 'unknown',
  wifi_status public.device_part_status not null default 'unknown',
  bluetooth_status public.device_part_status not null default 'unknown',
  cellular_status public.device_part_status not null default 'unknown',
  buttons_status public.device_part_status not null default 'unknown',
  parts_originality text,
  was_repaired boolean not null default false,
  repair_history text,
  box_available boolean not null default false,
  charger_available boolean not null default false,
  accessories text[] not null default '{}',
  condition_grade public.device_condition_grade not null default 'good',
  warranty_days integer not null default 0,
  diagnostic_notes text,

  -- Telefy Check — set only by a moderator/admin, guarded by trigger below.
  telefy_check_status public.telefy_check_status not null default 'not_checked',
  telefy_check_notes text,
  telefy_checked_by uuid references public.profiles (id),
  telefy_checked_at timestamptz,

  images text[] not null default '{}',
  description text,
  availability boolean not null default true,
  status public.product_status not null default 'draft',
  view_count integer not null default 0,
  favorite_count integer not null default 0,
  last_confirmed_at timestamptz not null default now(),
  rejection_reason text,
  published_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index used_device_units_catalog_idx on public.used_device_units (catalog_product_id);
create index used_device_units_store_idx on public.used_device_units (store_id);
create index used_device_units_status_idx on public.used_device_units (status) where deleted_at is null;
create index used_device_units_price_idx on public.used_device_units (price);
create index used_device_units_telefy_check_idx on public.used_device_units (telefy_check_status);

create trigger used_device_units_set_updated_at
  before update on public.used_device_units
  for each row execute function public.set_updated_at();

-- Sellers can edit every diagnostic field themselves, but the Telefy Check
-- trust badge has to come from an independent check — silently discard any
-- change to the check fields coming from a non-moderator/admin session
-- rather than trusting a client-side check alone.
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
       or new.telefy_checked_at is distinct from old.telefy_checked_at then
      new.telefy_check_status := old.telefy_check_status;
      new.telefy_checked_by := old.telefy_checked_by;
      new.telefy_checked_at := old.telefy_checked_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger used_device_units_guard_telefy_check
  before update on public.used_device_units
  for each row execute function public.guard_telefy_check_fields();

-- Per-item audit trail behind the Telefy Check badge (IMEI, Activation Lock,
-- display, touch, Face ID, camera, speaker, mic, charging, battery, buttons,
-- Wi-Fi, Bluetooth, cellular, repaired parts, body condition, ...).
create table public.used_device_checklist_items (
  id uuid primary key default gen_random_uuid(),
  used_device_unit_id uuid not null references public.used_device_units (id) on delete cascade,
  item_key text not null,
  item_label text not null,
  result text not null default 'not_tested' check (result in ('pass', 'fail', 'not_applicable', 'not_tested')),
  notes text,
  checked_by uuid references public.profiles (id),
  checked_at timestamptz not null default now(),
  unique (used_device_unit_id, item_key)
);

create index used_device_checklist_items_unit_idx on public.used_device_checklist_items (used_device_unit_id);
