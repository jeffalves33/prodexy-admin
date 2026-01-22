# 📱 Push Notifications - Guia Completo

## O que são Push Notifications?

Push Notifications são notificações que aparecem no seu celular/desktop mesmo quando o app está fechado. Quando alguém atribuir uma solicitação urgente para você, você receberá uma notificação no dispositivo instantaneamente!

## 🔧 Configuração (Obrigatória)

### 1. Gerar VAPID Keys

VAPID keys são necessárias para autenticar as notificações push. Execute:

```bash
# Instalar web-push globalmente
npm install -g web-push

# Gerar as keys
npx web-push generate-vapid-keys
```

Você receberá algo assim:
```
Public Key: BKxN...
Private Key: aBcD...
```

### 2. Adicionar ao Vercel

No seu projeto Vercel:
1. Vá em **Settings → Environment Variables**
2. Adicione as variáveis:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: sua public key
   - `VAPID_PRIVATE_KEY`: sua private key

### 3. Executar Migration

A migration já foi executada durante o setup inicial, mas se precisar rodar manualmente:

```sql
-- No Supabase SQL Editor
-- Copie e cole o conteúdo de /scripts/002_add_push_subscriptions.sql
```

## 📲 Como Usar

### 1. Ativar Notificações no App

1. Faça login no app
2. Vá em **Configurações** (ícone de engrenagem no menu)
3. Clique em **"Ativar Notificações"**
4. Aceite a permissão no navegador

### 2. Instalar como PWA (Recomendado)

**No Android (Chrome):**
1. Abra o app no Chrome
2. Toque nos 3 pontinhos → "Adicionar à tela inicial"
3. Confirme

**No iOS (Safari):**
1. Abra o app no Safari
2. Toque no ícone de compartilhar
3. "Adicionar à Tela de Início"

### 3. Quando Você Receberá Notificações

Você receberá notificações push quando:
- **Alguém atribuir uma solicitação para você**
- **Criar uma nova solicitação urgente**
- **Alguém comentar em uma solicitação que você está atribuído**

## 🔔 Tipos de Notificações

### Solicitação Atribuída
```
📋 Solicitação Atribuída
Website fora do ar - Prioridade URGENTE
```

### Nova Solicitação Urgente
```
🔔 Nova Solicitação: Cliente XYZ
Prioridade URGENTE - suporte
```

## 🧪 Testando

### Teste Local (sem HTTPS)

Para testar localmente, você precisa:
1. Usar `localhost` (funciona sem HTTPS)
2. Ou usar ngrok para ter HTTPS temporário

### Teste de Produção

1. Deploy no Vercel
2. Abra o app no celular
3. Ative as notificações
4. Peça para alguém atribuir uma solicitação para você
5. Você deve receber a notificação!

## 🛠️ Arquitetura Técnica

### Service Worker (`/public/sw.js`)
- Escuta eventos `push`
- Mostra notificações com `showNotification()`
- Gerencia cliques nas notificações

### Hook (`/lib/use-push-notifications.ts`)
- Solicita permissão ao usuário
- Registra subscription no servidor
- Gerencia estado da subscrição

### API Routes
- `POST /api/push/subscribe` - Salva subscription no banco
- `POST /api/push/send` - Envia notificação push

### Banco de Dados
- Tabela `push_subscriptions` armazena subscriptions por usuário
- Um usuário pode ter múltiplos dispositivos

### Server Actions
- `sendPushNotification()` é chamada automaticamente quando:
  - Uma solicitação é criada com assigned_to
  - Uma solicitação é atribuída via assignRequest()

## 📊 Monitoramento

Para ver se as notificações estão funcionando:

```javascript
// No navegador (F12 → Console)
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub ? 'Ativa' : 'Inativa')
  })
})
```

## 🚨 Troubleshooting

### "Notificações não aparecem"

1. Verifique se as VAPID keys estão configuradas
2. Verifique se o Service Worker está registrado (Console)
3. Verifique permissões do navegador
4. Teste com HTTPS (produção)

### "Subscription failed"

1. VAPID keys incorretas ou faltando
2. Service Worker não registrado
3. Navegador não suporta Push API

### "Push enviado mas não recebido"

1. Subscription pode ter expirado (navegador remove automaticamente)
2. Usuário pode ter desativado notificações no SO
3. Verificar logs do servidor

## 🔐 Segurança

- VAPID Private Key **NUNCA** deve ser exposta no client
- Apenas Public Key vai para o frontend
- Subscriptions são protegidas por RLS (Row Level Security)
- Cada usuário só pode gerenciar suas próprias subscriptions

## 📖 Referências

- [Web Push Protocol](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Keys](https://blog.mozilla.org/services/2016/08/23/sending-vapid-identified-webpush-notifications-via-mozillas-push-service/)
