# Prodexy - Sistema de Gestão Financeira e Solicitações

PWA completo para gestão de agência/sociedade com módulos financeiros, solicitações de clientes e sistema de notificações.

## ✨ Funcionalidades

### 💰 Gestão Financeira
- **Dashboard** - Resumo do mês: receita, despesas, lucro, faturas pendentes
- **Clientes** - CRUD completo de clientes com status
- **Faturas** - Criar cobranças, marcar como pagas, acompanhar status
- **Despesas** - Registrar gastos com categorias e métodos de pagamento

### 📋 Solicitações e Incidentes
- Criar solicitações vinculadas a clientes
- Sistema de prioridades (baixa, média, alta, urgente)
- Status: aberto, em progresso, resolvido, fechado
- Atribuir solicitações a membros da equipe
- Sistema de comentários em tempo real
- Notificações automáticas

### 🔔 Notificações
- Notificações em tempo real
- Badge com contador de não lidas
- Tipos: solicitações atribuídas, atualizações, pagamentos
- Marcar como lida individual ou em lote

### 🎨 Interface
- Design moderno e profissional (tema escuro)
- PWA instalável no celular
- Totalmente responsivo
- Navegação por bottom tabs no mobile
- Ícones personalizados

## 🚀 Instalação

### 1. Configurar Supabase

A migração do banco de dados já foi executada automaticamente. Se precisar executar novamente:

1. Acesse seu projeto Supabase: https://supabase.com/dashboard
2. Vá em **SQL Editor**
3. Copie o conteúdo do arquivo `/scripts/001_init_prodexy_schema.sql`
4. Cole no editor e execute

O script cria:
- ✅ Todas as tabelas (profiles, clients, invoices, payments, expenses, requests, notifications, etc.)
- ✅ Políticas RLS (Row Level Security)
- ✅ Índices para performance
- ✅ Triggers automáticos (criar profile, gerar notificações)
- ✅ Funções auxiliares

### 2. Variáveis de Ambiente

As seguintes variáveis já estão configuradas automaticamente pela integração Supabase:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Criar Primeiro Usuário

1. Acesse `/auth/login`
2. Use as credenciais configuradas ou crie uma nova conta

## 📱 Uso como PWA

### No Android (Chrome/Edge)
1. Acesse o site no navegador
2. Toque no menu (⋮) → "Instalar app" ou "Adicionar à tela inicial"
3. Confirme a instalação
4. O app aparecerá na gaveta de aplicativos

### No iOS (Safari)
1. Acesse o site no Safari
2. Toque no botão de compartilhar (quadrado com seta)
3. Role para baixo e toque em "Adicionar à Tela Inicial"
4. Confirme e pronto!

## 🗂️ Estrutura do Banco de Dados

### Tabelas Principais

- **profiles** - Perfis de usuários (criado automaticamente ao registrar)
- **clients** - Clientes da agência
- **billing_plans** - Planos de cobrança recorrentes
- **invoices** - Faturas emitidas
- **payments** - Pagamentos recebidos
- **expenses** - Despesas registradas
- **requests** - Solicitações/incidentes de clientes
- **request_comments** - Comentários nas solicitações
- **notifications** - Sistema de notificações
- **audit_log** - Log de auditoria

### Políticas de Segurança (RLS)

Todas as tabelas possuem Row Level Security habilitado:
- Usuários só veem seus próprios dados
- Políticas específicas para SELECT, INSERT, UPDATE, DELETE
- Proteção automática contra acesso não autorizado

## 🔧 Tecnologias

- **Next.js 16** (App Router, Server Actions)
- **React 19** (Server Components)
- **Supabase** (PostgreSQL + Auth + Realtime)
- **Tailwind CSS v4** (Design System)
- **shadcn/ui** (Componentes)
- **TypeScript** (Type Safety)

## 📊 Módulos

### Dashboard (`/dashboard`)
- Resumo financeiro do mês atual
- Gráfico de receitas vs despesas
- Lista de faturas pendentes
- Solicitações urgentes

### Clientes (`/dashboard/clients`)
- Listar todos os clientes
- Adicionar novo cliente
- Editar informações
- Excluir cliente

### Faturas (`/dashboard/invoices`)
- Criar nova fatura
- Marcar como paga (cria pagamento automaticamente)
- Filtrar por status
- Ver histórico

### Despesas (`/dashboard/expenses`)
- Registrar despesas
- Categorias customizáveis
- Métodos de pagamento
- Editar/excluir

### Solicitações (`/dashboard/requests`)
- Criar solicitação para cliente
- Definir tipo, prioridade e status
- Atribuir a membro da equipe
- Adicionar comentários
- Ver detalhes completos

### Notificações (`/dashboard/notifications`)
- Ver todas as notificações
- Marcar como lida
- Ir direto para item relacionado
- Excluir notificações

## 🎯 Fluxos Principais

### 1. Criar Fatura e Marcar como Paga
1. Ir em Faturas → Criar Nova
2. Selecionar cliente, valor, data de vencimento
3. Na lista, clicar em "Marcar como Paga"
4. Sistema cria registro de pagamento automaticamente

### 2. Criar Solicitação Urgente
1. Ir em Solicitações → Nova Solicitação
2. Preencher título e descrição
3. Selecionar cliente
4. Definir prioridade "Urgente"
5. Atribuir a um membro (cria notificação automática)
6. Adicionar comentários conforme necessário

### 3. Acompanhar Notificações
1. Ícone de sino no header mostra badge com contador
2. Clicar para ver lista completa
3. Clicar em "Ver Solicitação" para ir direto ao item
4. Marcar como lida individual ou todas de uma vez

## 🔐 Segurança

- Autenticação obrigatória via Supabase Auth
- Row Level Security em todas as tabelas
- Server Actions para mutations
- Validação de dados no backend
- Proteção contra SQL injection (queries parametrizadas)

## 📝 Próximos Passos

Após a instalação, recomendamos:

1. **Criar alguns clientes de teste**
2. **Adicionar categorias de despesas** (já pré-configuradas no código)
3. **Configurar notificações push** (requer service worker adicional)
4. **Personalizar categorias** conforme necessidades do negócio
5. **Adicionar mais membros da equipe** para testar colaboração

## 🆘 Suporte

Se encontrar problemas:
1. Verifique se a migração foi executada corretamente no Supabase
2. Confirme que as variáveis de ambiente estão configuradas
3. Verifique o console do navegador para erros
4. Abra um issue no repositório

---

**Desenvolvido com v0.app** 🚀
