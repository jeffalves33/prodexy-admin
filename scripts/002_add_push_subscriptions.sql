-- Tabela para armazenar push subscriptions dos dispositivos
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, subscription)
);

-- RLS
alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_subscriptions_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id);

create policy "push_subscriptions_delete_own" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

-- Índice para buscar subscriptions por user_id
create index if not exists idx_push_subscriptions_user_id on public.push_subscriptions(user_id);
