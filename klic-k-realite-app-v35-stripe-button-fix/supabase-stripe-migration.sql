-- Stripe subscription columns for public.subscriptions
alter table public.subscriptions
  add column if not exists payment_provider text,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists subscription_until timestamptz,
  add column if not exists updated_at timestamptz default now();

create unique index if not exists subscriptions_telegram_id_unique_idx
on public.subscriptions (telegram_id);
