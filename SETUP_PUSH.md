# 🔔 Configuração de Push Notifications - Prodexy

## ✅ O que foi implementado

### Sistema Completo de Push Notifications para PWA:

1. **Service Worker** (`/public/sw.js`)
   - Intercepta notificações push
   - Exibe notificações no dispositivo
   - Gerencia cliques e ações

2. **API Routes**
   - `/api/push/subscribe` - Registra dispositivo
   - `/api/push/send` - Envia notificações

3. **Componentes**
   - `PushNotificationSetup` - UI para ativar notificações
   - `RegisterServiceWorker` - Registra SW automaticamente

4. **Banco de Dados**
   - Tabela `push_subscriptions` criada
   - RLS configurado

5. **Integração**
   - Notificações enviadas quando:
     - Nova solicitação atribuída
     - Solicitação urgente criada
     - Comentário adicionado
     - Status alterado

## 🚀 Como Ativar (Passo a Passo)

### 1. Gerar Chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Ou use o script:
```bash
node scripts/generate-vapid-keys.js
```

### 2. Adicionar Variáveis de Ambiente

Adicione no Vercel (ou .env.local):

```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica_aqui
VAPID_PRIVATE_KEY=sua_chave_privada_aqui
VAPID_SUBJECT=mailto:seu@email.com
```

### 3. Deploy

```bash
git add .
git commit -m "Add push notifications"
git push
```

## 📱 Como Usar no Celular

### 1. Instalar o PWA
- Abra o site no celular
- Chrome/Safari: "Adicionar à tela inicial"
- Abra o app instalado

### 2. Ativar Notificações
- Vá em **Configurações** (última opção do menu)
- Clique em **"Ativar Notificações"**
- Permita notificações quando solicitado

### 3. Testar
- Crie uma solicitação urgente
- Atribua uma solicitação a você mesmo
- **Você receberá notificação no celular!** 📲

## 🎯 Quando as Notificações São Enviadas

1. **Nova Solicitação Atribuída**
   ```
   📋 Solicitação Atribuída
   [Título] - Prioridade [URGENTE/ALTA/etc]
   ```

2. **Nova Solicitação Criada (se você for atribuído)**
   ```
   🔔 Nova Solicitação: [Título]
   Prioridade [URGENTE] - [tipo]
   ```

3. **Notificações funcionam mesmo com app fechado!**

## ✨ Recursos

- ✅ Notificações aparecem no celular
- ✅ Funcionam com app fechado
- ✅ Vibração customizada
- ✅ Ícone do Prodexy
- ✅ Clique abre o app direto na página relevante
- ✅ Suporte Android e iOS (Safari 16.4+)

## 🔧 Testar Localmente

1. **HTTPS é obrigatório** (ou localhost)
2. Use `npm run dev`
3. Abra em `https://localhost:3000` ou use ngrok
4. Ative notificações em Configurações
5. Crie uma solicitação atribuída a você

## 📊 Verificar Assinaturas

No Supabase, query:
```sql
SELECT * FROM push_subscriptions;
```

Cada linha = 1 dispositivo registrado

## 🐛 Troubleshooting

### "Notificações não funcionam"
- ✅ Verificar se VAPID keys estão configuradas
- ✅ Verificar se SW está registrado (DevTools > Application > Service Workers)
- ✅ Verificar se permissão foi concedida
- ✅ Usar HTTPS (ou localhost)

### "Erro ao registrar"
- Limpar cache do navegador
- Desregistrar SW antigo
- Recarregar página

### "Push não chega"
- Verificar se `push_subscriptions` tem registro
- Verificar console do servidor para erros
- Testar com `web-push` CLI

## 💡 Dicas

- Instale o app no celular para melhor experiência
- Mantenha o app em background para receber notificações
- Android: notificações funcionam 100%
- iOS: funciona no Safari 16.4+ (iOS 16.4+)

## 🎉 Pronto!

Agora você tem um sistema completo de push notifications no seu PWA Prodexy!

Quando alguém criar uma solicitação urgente, TODOS os membros com notificações ativadas receberão alerta no celular! 📲
