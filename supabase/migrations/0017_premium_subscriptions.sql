alter table if exists public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_subscription_status text,
  add column if not exists stripe_current_period_end timestamptz,
  add column if not exists stripe_cancel_at_period_end boolean not null default false,
  add column if not exists premium_since timestamptz;

create unique index if not exists idx_profiles_stripe_customer_id_unique
  on public.profiles(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists idx_profiles_stripe_subscription_id_unique
  on public.profiles(stripe_subscription_id)
  where stripe_subscription_id is not null;

create index if not exists idx_profiles_stripe_subscription_status
  on public.profiles(stripe_subscription_status);
