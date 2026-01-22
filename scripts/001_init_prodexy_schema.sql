-- ============================================
-- PRODEXY - Schema Completo
-- PWA de Gestão Financeira e Solicitações
-- ============================================

-- Extensões necessárias
create extension if not exists "uuid-ossp";

-- ============================================
-- TABELA: profiles (usuários internos)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles for select using (auth.uid() is not null);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- ============================================
-- TABELA: clients (clientes da agência)
-- ============================================
create table if not exists public.clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text not null,
  email text,
  project_service text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  trello_link text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

create policy "clients_select_all" on public.clients for select using (auth.uid() is not null);
create policy "clients_insert_auth" on public.clients for insert with check (auth.uid() is not null);
create policy "clients_update_auth" on public.clients for update using (auth.uid() is not null);
create policy "clients_delete_auth" on public.clients for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: billing_plans (planos de cobrança)
-- ============================================
create table if not exists public.billing_plans (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  monthly_amount decimal(10,2) not null,
  due_day integer not null check (due_day >= 1 and due_day <= 31),
  status text not null default 'active' check (status in ('active', 'inactive')),
  setup_fee decimal(10,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.billing_plans enable row level security;

create policy "billing_plans_select_all" on public.billing_plans for select using (auth.uid() is not null);
create policy "billing_plans_insert_auth" on public.billing_plans for insert with check (auth.uid() is not null);
create policy "billing_plans_update_auth" on public.billing_plans for update using (auth.uid() is not null);
create policy "billing_plans_delete_auth" on public.billing_plans for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: invoices (faturas mensais)
-- ============================================
create table if not exists public.invoices (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  billing_plan_id uuid references public.billing_plans(id) on delete set null,
  month integer not null check (month >= 1 and month <= 12),
  year integer not null,
  amount decimal(10,2) not null,
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'paid', 'overdue', 'canceled')),
  paid_at timestamptz,
  payment_method text,
  notes text,
  confirmed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, month, year)
);

alter table public.invoices enable row level security;

create policy "invoices_select_all" on public.invoices for select using (auth.uid() is not null);
create policy "invoices_insert_auth" on public.invoices for insert with check (auth.uid() is not null);
create policy "invoices_update_auth" on public.invoices for update using (auth.uid() is not null);
create policy "invoices_delete_auth" on public.invoices for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: payments (pagamentos recebidos)
-- ============================================
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount decimal(10,2) not null,
  payment_date date not null,
  payment_method text,
  notes text,
  confirmed_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

create policy "payments_select_all" on public.payments for select using (auth.uid() is not null);
create policy "payments_insert_auth" on public.payments for insert with check (auth.uid() is not null);
create policy "payments_update_auth" on public.payments for update using (auth.uid() is not null);
create policy "payments_delete_auth" on public.payments for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: expenses (despesas)
-- ============================================
create table if not exists public.expenses (
  id uuid primary key default uuid_generate_v4(),
  description text not null,
  category text,
  amount decimal(10,2) not null,
  expense_date date not null,
  is_recurring boolean not null default false,
  recurrence_day integer check (recurrence_day is null or (recurrence_day >= 1 and recurrence_day <= 31)),
  status text not null default 'open' check (status in ('open', 'paid', 'canceled')),
  month integer check (month is null or (month >= 1 and month <= 12)),
  year integer,
  paid_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create policy "expenses_select_all" on public.expenses for select using (auth.uid() is not null);
create policy "expenses_insert_auth" on public.expenses for insert with check (auth.uid() is not null);
create policy "expenses_update_auth" on public.expenses for update using (auth.uid() is not null);
create policy "expenses_delete_auth" on public.expenses for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: requests (solicitações/incidentes)
-- ============================================
create table if not exists public.requests (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  description text not null,
  type text not null check (type in ('bug', 'adjustment', 'improvement', 'support')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'open' check (status in ('open', 'triage', 'in_progress', 'blocked', 'done', 'canceled')),
  created_by uuid not null references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  trello_link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.requests enable row level security;

create policy "requests_select_all" on public.requests for select using (auth.uid() is not null);
create policy "requests_insert_auth" on public.requests for insert with check (auth.uid() is not null);
create policy "requests_update_auth" on public.requests for update using (auth.uid() is not null);
create policy "requests_delete_auth" on public.requests for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: request_comments (comentários)
-- ============================================
create table if not exists public.request_comments (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid not null references public.requests(id) on delete cascade,
  message text not null,
  created_by uuid not null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.request_comments enable row level security;

create policy "request_comments_select_all" on public.request_comments for select using (auth.uid() is not null);
create policy "request_comments_insert_auth" on public.request_comments for insert with check (auth.uid() is not null);
create policy "request_comments_update_auth" on public.request_comments for update using (auth.uid() is not null);
create policy "request_comments_delete_auth" on public.request_comments for delete using (auth.uid() is not null);

-- ============================================
-- TABELA: notifications (notificações)
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  reference_id uuid,
  reference_type text,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- ============================================
-- TABELA: audit_log (auditoria)
-- ============================================
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create policy "audit_log_select_all" on public.audit_log for select using (auth.uid() is not null);
create policy "audit_log_insert_auth" on public.audit_log for insert with check (auth.uid() is not null);

-- ============================================
-- TRIGGER: Criar profile automaticamente
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- TRIGGER: Atualizar updated_at
-- ============================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger update_clients_updated_at before update on public.clients
  for each row execute function public.handle_updated_at();

create trigger update_billing_plans_updated_at before update on public.billing_plans
  for each row execute function public.handle_updated_at();

create trigger update_invoices_updated_at before update on public.invoices
  for each row execute function public.handle_updated_at();

create trigger update_expenses_updated_at before update on public.expenses
  for each row execute function public.handle_updated_at();

create trigger update_requests_updated_at before update on public.requests
  for each row execute function public.handle_updated_at();

-- ============================================
-- FUNÇÃO: Criar notificações para todos
-- ============================================
create or replace function public.notify_all_users(
  p_type text,
  p_title text,
  p_message text,
  p_reference_id uuid default null,
  p_reference_type text default null
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.notifications (user_id, type, title, message, reference_id, reference_type)
  select id, p_type, p_title, p_message, p_reference_id, p_reference_type
  from public.profiles;
end;
$$;

-- ============================================
-- TRIGGER: Notificar nova solicitação
-- ============================================
create or replace function public.notify_new_request()
returns trigger
language plpgsql
security definer
as $$
declare
  client_name text;
begin
  select name into client_name from public.clients where id = new.client_id;
  
  perform public.notify_all_users(
    'request_created',
    'Nova Solicitação',
    'Cliente: ' || client_name || ' - ' || new.title,
    new.id,
    'request'
  );
  
  return new;
end;
$$;

drop trigger if exists on_request_created on public.requests;

create trigger on_request_created
  after insert on public.requests
  for each row
  execute function public.notify_new_request();

-- ============================================
-- TRIGGER: Notificar atribuição
-- ============================================
create or replace function public.notify_request_assigned()
returns trigger
language plpgsql
security definer
as $$
declare
  client_name text;
  assigned_name text;
begin
  if new.assigned_to is not null and (old.assigned_to is null or old.assigned_to != new.assigned_to) then
    select name into client_name from public.clients where id = new.client_id;
    select name into assigned_name from public.profiles where id = new.assigned_to;
    
    perform public.notify_all_users(
      'request_assigned',
      'Solicitação Assumida',
      assigned_name || ' assumiu: ' || new.title,
      new.id,
      'request'
    );
  end if;
  
  return new;
end;
$$;

drop trigger if exists on_request_assigned on public.requests;

create trigger on_request_assigned
  after update on public.requests
  for each row
  execute function public.notify_request_assigned();

-- ============================================
-- TRIGGER: Notificar mudança de status
-- ============================================
create or replace function public.notify_request_status_changed()
returns trigger
language plpgsql
security definer
as $$
declare
  client_name text;
begin
  if new.status != old.status then
    select name into client_name from public.clients where id = new.client_id;
    
    perform public.notify_all_users(
      'request_status_changed',
      'Status Atualizado',
      new.title || ' → ' || new.status,
      new.id,
      'request'
    );
  end if;
  
  return new;
end;
$$;

drop trigger if exists on_request_status_changed on public.requests;

create trigger on_request_status_changed
  after update on public.requests
  for each row
  execute function public.notify_request_status_changed();

-- ============================================
-- TRIGGER: Notificar novo comentário
-- ============================================
create or replace function public.notify_request_comment()
returns trigger
language plpgsql
security definer
as $$
declare
  request_title text;
  commenter_name text;
begin
  select title into request_title from public.requests where id = new.request_id;
  select name into commenter_name from public.profiles where id = new.created_by;
  
  perform public.notify_all_users(
    'request_commented',
    'Novo Comentário',
    commenter_name || ' comentou em: ' || request_title,
    new.request_id,
    'request'
  );
  
  return new;
end;
$$;

drop trigger if exists on_request_comment_created on public.request_comments;

create trigger on_request_comment_created
  after insert on public.request_comments
  for each row
  execute function public.notify_request_comment();

-- ============================================
-- ÍNDICES para performance
-- ============================================
create index if not exists idx_clients_status on public.clients(status);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_invoices_date on public.invoices(year, month);
create index if not exists idx_expenses_date on public.expenses(year, month);
create index if not exists idx_requests_status on public.requests(status);
create index if not exists idx_requests_priority on public.requests(priority);
create index if not exists idx_requests_client on public.requests(client_id);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read);
create index if not exists idx_notifications_created on public.notifications(created_at desc);

-- ============================================
-- FIM DO SCHEMA
-- ============================================
