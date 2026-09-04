-- ============================================================================
-- Malika Market — 0010: Notifications, preferences, delivery log
-- ============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb not null default '{}',
  dedupe_key text,        -- unique-per-user idempotency key, e.g. 'price_alert:{alertId}:{price}'
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where not is_read;
create unique index notifications_dedupe_idx on public.notifications (user_id, dedupe_key) where dedupe_key is not null;

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  in_app_enabled boolean not null default true,
  telegram_enabled boolean not null default false,
  email_enabled boolean not null default false,
  web_push_enabled boolean not null default false,
  sms_enabled boolean not null default false,
  muted_types public.notification_type[] not null default '{}',
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  timezone text not null default 'Asia/Tashkent',
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

create table public.notification_delivery_log (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  channel public.notification_channel not null,
  status public.notification_delivery_status not null default 'pending',
  provider_message_id text,
  error text,
  attempted_at timestamptz not null default now()
);

create index notification_delivery_log_notification_idx on public.notification_delivery_log (notification_id);

-- Auto-provision default preferences on signup.
create or replace function public.handle_new_profile_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id) values (new.id)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_profile_created_prefs
  after insert on public.profiles
  for each row execute function public.handle_new_profile_preferences();
