// Script para gerar VAPID keys para Push Notifications
// Execute: node scripts/generate-vapid-keys.js

const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 VAPID Keys geradas com sucesso!\n');
console.log('Adicione estas variáveis ao seu .env:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('\nIMPORTANTE: Guarde estas keys em segurança e não as compartilhe!\n');
