import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

// Configurar VAPID keys (você precisará gerar suas próprias keys)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:contato@prodexy.com',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, title, body, url } = await request.json()

    // Buscar subscriptions do usuário alvo
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)

    if (error) {
      console.error('[v0] Error fetching subscriptions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No subscriptions found' })
    }

    // Enviar notificação para todos os dispositivos do usuário
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: url || '/dashboard' }
    })

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, payload)
      } catch (error: any) {
        console.error('[v0] Error sending push notification:', error)
        // Se subscription expirou, remover do banco
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('subscription', sub.subscription)
        }
      }
    })

    await Promise.all(sendPromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Push send error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
