# 📦 Deployment - Prodexy

## ✅ Checklist pré-deploy

- [x] Banco de dados migrado ✅ (executado automaticamente)
- [x] Variáveis de ambiente configuradas ✅ (via integração Supabase)
- [x] PWA manifest criado ✅
- [x] Ícones gerados ✅
- [x] Autenticação configurada ✅
- [x] RLS policies habilitadas ✅

## 🚀 Deploy no Vercel

### Via v0.app (Recomendado)

1. No v0, clique em **"Publish"** no canto superior direito
2. Confirme a integração com Supabase
3. Deploy automático será iniciado
4. Aguarde finalização (~2 minutos)
5. Acesse a URL fornecida

### Via GitHub

1. Clique em **"Connect to GitHub"** no v0
2. Escolha um repositório
3. Faça push do código
4. No Vercel:
   - New Project → Import do GitHub
   - Configure as variáveis de ambiente (já devem estar prontas)
   - Deploy

## 🔐 Variáveis de Ambiente

As seguintes variáveis **já estão configuradas** automaticamente:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Se precisar adicionar manualmente:
1. Vercel Dashboard → Seu projeto
2. Settings → Environment Variables
3. Adicione as variáveis acima
4. Redeploy

## 🎯 Pós-Deploy

### 1. Criar primeiro usuário

Opção A - Via interface:
- Acesse `seu-dominio.vercel.app/auth/signup`
- Preencha o formulário
- Confirme o email (Supabase enviará link)

Opção B - Via Supabase Dashboard:
- Authentication → Users → Add user
- Create new user
- Email + Password
- ✅ Confirm email

### 2. Testar funcionalidades

- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar cliente
- [ ] Criar fatura
- [ ] Criar despesa
- [ ] Criar solicitação
- [ ] Notificações aparecem
- [ ] PWA instala no mobile

### 3. Configurar domínio customizado (opcional)

No Vercel:
1. Settings → Domains
2. Add domain
3. Configure DNS (A record ou CNAME)
4. Aguarde propagação

### 4. Atualizar PWA URLs

Se usar domínio customizado, edite `/public/manifest.json`:

```json
{
  "start_url": "https://seu-dominio.com",
  "scope": "https://seu-dominio.com/"
}
```

## 📱 PWA em Produção

Para que o PWA funcione corretamente:

1. **HTTPS obrigatório** (Vercel já fornece)
2. Manifest.json acessível em `/manifest.json` ✅
3. Ícones em `/icon-192.png` e `/icon-512.png` ✅
4. Service Worker em `/sw.js` ✅

Para testar:
1. Abra no Chrome mobile
2. Menu → "Instalar app"
3. Aceite a instalação
4. App aparece na home screen

## 🔍 Troubleshooting

### "Erro 500 no dashboard"
- Verifique se a migração do banco foi executada
- Confirme variáveis de ambiente no Vercel
- Veja logs: Vercel Dashboard → Deployments → [seu deploy] → Runtime Logs

### "Authentication error"
- Confirme NEXT_PUBLIC_SUPABASE_URL no Vercel
- Confirme NEXT_PUBLIC_SUPABASE_ANON_KEY no Vercel
- Verifique no Supabase: Settings → API

### "RLS policy error"
- As policies foram criadas na migration?
- Execute novamente `/scripts/001_init_prodexy_schema.sql` no SQL Editor

### "PWA não instala"
- HTTPS ativo? (deve estar no Vercel)
- Manifest.json acessível em `seu-dominio.com/manifest.json`?
- Service worker registrado? (veja Console → Application → Service Workers)

## 🎛️ Monitoramento

### Supabase Dashboard

Monitore:
- **Table Editor** - Ver dados em tempo real
- **Authentication** - Usuários ativos
- **Database** - Uso de storage
- **Logs** - Queries executadas

### Vercel Dashboard

Monitore:
- **Analytics** - Pageviews, usuários
- **Functions** - Tempo de resposta
- **Logs** - Erros em runtime

## 🔄 Atualizações futuras

Para atualizar o app:

1. **Via v0**:
   - Edite e salve
   - Clique em "Publish" novamente
   - Deploy automático

2. **Via GitHub**:
   - Push para a branch main
   - Vercel rebuilda automaticamente

## 🎉 Pronto!

Seu Prodexy está no ar e pronto para uso em produção!

**URLs importantes:**
- App: `seu-projeto.vercel.app`
- Supabase Dashboard: `supabase.com/dashboard/project/seu-projeto-id`
- Vercel Dashboard: `vercel.com/seu-usuario/seu-projeto`
