begin;

-- 1) Soft delete em clients (ao invés de deletar e perder histórico)
alter table public.clients
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_clients_deleted_at on public.clients(deleted_at);

-- 2) Garantir no máximo 1 billing_plan ativo por cliente
create unique index if not exists uq_billing_plans_one_active_per_client
on public.billing_plans(client_id)
where status = 'active';

-- 3) Tabela de entradas/receitas (faltava “um local pra colocar entrada do mês”)
create table if not exists public.income_entries (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references public.clients(id) on delete set null,
  description text not null,
  amount decimal(10,2) not null,
  income_date date not null,
  month integer not null check (month >= 1 and month <= 12),
  year integer not null,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.income_entries enable row level security;

create policy "income_entries_select_all"
on public.income_entries for select
using (auth.uid() is not null);

create policy "income_entries_insert_auth"
on public.income_entries for insert
with check (auth.uid() is not null);

create policy "income_entries_update_auth"
on public.income_entries for update
using (auth.uid() is not null);

create policy "income_entries_delete_auth"
on public.income_entries for delete
using (auth.uid() is not null);

create index if not exists idx_income_entries_date on public.income_entries(year, month);
create index if not exists idx_income_entries_client on public.income_entries(client_id);

-- 4) Função: gerar fatura de 1 cliente (mês/ano) a partir do plano ativo
create or replace function public.generate_invoice_for_client_month(
  p_client_id uuid,
  p_year int,
  p_month int
)
returns void
language plpgsql
security definer
as $$
declare
  v_plan record;
  v_due_date date;
begin
  select *
    into v_plan
  from public.billing_plans
  where client_id = p_client_id
    and status = 'active'
  order by created_at desc
  limit 1;

  if not found then
    return;
  end if;

  -- monta due_date: ano/mês + due_day (cap em último dia do mês)
  v_due_date :=
    make_date(p_year, p_month, 1)
    + ((least(v_plan.due_day, extract(day from (date_trunc('month', make_date(p_year, p_month, 1)) + interval '1 month - 1 day'))::int)) - 1) * interval '1 day';

  insert into public.invoices (client_id, billing_plan_id, month, year, amount, due_date, status)
  values (p_client_id, v_plan.id, p_month, p_year, v_plan.monthly_amount, v_due_date, 'open')
  on conflict (client_id, month, year) do nothing;
end;
$$;

-- 5) Função: gerar faturas do mês (para todos clientes com plano ativo)
create or replace function public.generate_invoices_for_month(
  p_year int,
  p_month int
)
returns void
language plpgsql
security definer
as $$
declare
  r record;
begin
  for r in
    select bp.client_id
    from public.billing_plans bp
    join public.clients c on c.id = bp.client_id
    where bp.status = 'active'
      and c.status = 'active'
      and c.deleted_at is null
  loop
    perform public.generate_invoice_for_client_month(r.client_id, p_year, p_month);
  end loop;
end;
$$;

commit;
