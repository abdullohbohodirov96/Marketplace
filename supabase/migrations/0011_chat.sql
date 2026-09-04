-- ============================================================================
-- Malika Market — 0011: In-app chat (customer <-> store)
-- ============================================================================

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  store_id uuid not null references public.stores (id) on delete cascade,
  product_offer_id uuid references public.product_offers (id) on delete set null,
  request_id uuid,   -- FK added in 0012 after request_for_offers table exists
  status text not null default 'open' check (status in ('open', 'archived', 'blocked')),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (customer_id, store_id, product_offer_id)
);

create index conversations_customer_idx on public.conversations (customer_id, last_message_at desc);
create index conversations_store_idx on public.conversations (store_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  text text,
  attachment_url text,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_content_check check (text is not null or attachment_url is not null)
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);
create index messages_unread_idx on public.messages (conversation_id) where read_at is null;

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

create table public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  constraint blocked_users_not_self check (blocker_id <> blocked_id)
);

create index blocked_users_blocker_idx on public.blocked_users (blocker_id);

-- Seller quick-reply templates ("tezkor javob shablonlari").
create table public.store_quick_replies (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  title text not null,
  message text not null,
  sort_order smallint not null default 0
);

create index store_quick_replies_store_idx on public.store_quick_replies (store_id);

alter table public.reports
  add constraint reports_conversation_fk foreign key (conversation_id) references public.conversations (id) on delete set null;
