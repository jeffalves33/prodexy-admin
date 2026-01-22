# 🚀 Setup Completo do Supabase para Prodexy

## ✅ Status da Migração

**A migração do banco de dados já foi executada automaticamente!**

O script `/scripts/001_init_prodexy_schema.sql` foi executado com sucesso e criou:

- ✅ 10 tabelas principais (profiles, clients, invoices, payments, expenses, requests, etc.)
- ✅ Políticas RLS (Row Level Security) em todas as tabelas
- ✅ Índices para otimização de performance
- ✅ Triggers automáticos para criar profiles e notificações
- ✅ Funções auxiliares do PostgreSQL

## 📊 Estrutura do Banco

### Tabelas Criadas

1. **profiles** - Perfis de usuários (auto-criado no signup via trigger)
2. **clients** - Clientes da agência
3. **billing_plans** - Planos de cobrança recorrentes
4. **invoices** - Faturas/cobranças
5. **payments** - Pagamentos recebidos
6. **expenses** - Despesas registradas
7. **requests** - Solicitações/incidentes de clientes
8. **request_comments** - Comentários nas solicitações
9. **notifications** - Sistema de notificações
10. **audit_log** - Log de auditoria de ações

### Triggers Configurados

1. **handle_new_user()** - Cria automaticamente um profile quando usuário se registra
2. **notify_request_assignment()** - Cria notificação quando solicitação é atribuída
3. **notify_request_status_change()** - Notifica mudanças de status
4. **update_updated_at()** - Atualiza timestamp automaticamente

### Políticas de Segurança (RLS)

Todas as tabelas têm RLS habilitado com políticas para:
- ✅ SELECT - Ver apenas dados próprios/autorizados
- ✅ INSERT - Inserir com validação de usuário
- ✅ UPDATE - Atualizar apenas próprios registros
- ✅ DELETE - Deletar apenas próprios registros

## 🔑 Primeiro Acesso

### 1. Criar Usuário Inicial

1. Acesse: `/auth/login`
2. Como não há usuários ainda, você precisará criar um manualmente no Supabase:

**Via Supabase Dashboard:**
```
1. Vá em Authentication → Users
2. Clique em "Add user" → "Create new user"
3. Email: seu@email.com
4. Password: (defina uma senha)
5. Confirm: Yes
6. Email Confirm: Yes (marque como confirmado)
7. Clique em "Create user"
```

**Ou via SQL Editor:**
```sql
-- Criar usuário de teste (o trigger criará o profile automaticamente)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@prodexy.com',
  crypt('senha123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin Prodexy"}',
  false,
  ''
);
```

### 2. Fazer Login

Após criar o usuário:
1. Vá para `/auth/login`
2. Use o email e senha criados
3. Você será redirecionado para `/dashboard`

## 🧪 Testar o Sistema

### 1. Adicionar Cliente de Teste

```sql
INSERT INTO public.clients (name, email, phone, company, status, created_by)
SELECT 
  'Empresa Exemplo LTDA',
  'contato@exemplo.com',
  '+55 11 99999-9999',
  'Exemplo LTDA',
  'active',
  id
FROM auth.users
WHERE email = 'admin@prodexy.com'
LIMIT 1;
```

### 2. Criar Fatura de Teste

```sql
INSERT INTO public.invoices (
  client_id, 
  invoice_number, 
  amount, 
  due_date, 
  status, 
  description,
  created_by
)
SELECT 
  c.id,
  'FAT-001',
  5000.00,
  (CURRENT_DATE + INTERVAL '30 days')::date,
  'pending',
  'Serviço de desenvolvimento web',
  u.id
FROM public.clients c, auth.users u
WHERE u.email = 'admin@prodexy.com'
AND c.email = 'contato@exemplo.com'
LIMIT 1;
```

### 3. Criar Despesa de Teste

```sql
INSERT INTO public.expenses (
  description,
  amount,
  category,
  expense_date,
  payment_method,
  notes,
  created_by
)
SELECT
  'Assinatura AWS',
  450.00,
  'infrastructure',
  CURRENT_DATE,
  'credit_card',
  'Servidor de produção',
  id
FROM auth.users
WHERE email = 'admin@prodexy.com'
LIMIT 1;
```

### 4. Criar Solicitação Urgente

```sql
INSERT INTO public.requests (
  client_id,
  title,
  description,
  type,
  priority,
  status,
  created_by
)
SELECT
  c.id,
  'Site fora do ar',
  'O site principal está apresentando erro 500',
  'incident',
  'urgent',
  'open',
  u.id
FROM public.clients c, auth.users u
WHERE u.email = 'admin@prodexy.com'
AND c.email = 'contato@exemplo.com'
LIMIT 1;
```

## 🔍 Verificar Dados

### Ver todos os dados criados:

```sql
-- Ver usuários e profiles
SELECT u.email, p.name, p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;

-- Ver clientes
SELECT * FROM public.clients;

-- Ver faturas
SELECT 
  i.invoice_number,
  i.amount,
  i.status,
  i.due_date,
  c.name as client_name
FROM public.invoices i
JOIN public.clients c ON c.id = i.client_id;

-- Ver despesas
SELECT * FROM public.expenses;

-- Ver solicitações
SELECT 
  r.title,
  r.priority,
  r.status,
  c.name as client_name
FROM public.requests r
JOIN public.clients c ON c.id = r.client_id;

-- Ver notificações
SELECT * FROM public.notifications;
```

## 🛠️ Comandos Úteis

### Resetar o Banco (CUIDADO!)

```sql
-- Deletar todos os dados (mantém estrutura)
TRUNCATE 
  public.profiles,
  public.clients,
  public.billing_plans,
  public.invoices,
  public.payments,
  public.expenses,
  public.requests,
  public.request_comments,
  public.notifications,
  public.audit_log
CASCADE;
```

### Recriar Completamente

Se precisar executar o script novamente:
1. Vá no Supabase → SQL Editor
2. Cole o conteúdo completo de `/scripts/001_init_prodexy_schema.sql`
3. Execute

O script é idempotente - pode ser executado múltiplas vezes sem problemas.

## 📱 Próximos Passos

1. ✅ Banco de dados configurado
2. ✅ Usuário criado
3. ✅ Login realizado
4. ➡️ Adicionar clientes reais
5. ➡️ Começar a usar o sistema!

---

**Pronto! Seu Prodexy está 100% funcional! 🎉**
