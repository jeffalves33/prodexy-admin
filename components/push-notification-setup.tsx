'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bell, BellOff, Check } from 'lucide-react'
import { usePushNotifications } from '@/lib/use-push-notifications'

export function PushNotificationSetup() {
  const { isSupported, isSubscribed, subscribeToPush, unsubscribeFromPush } = usePushNotifications()
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    setLoading(true)
    try {
      if (isSubscribed) {
        await unsubscribeFromPush()
      } else {
        await subscribeToPush()
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Notificações push não são suportadas neste dispositivo/navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba notificações no seu dispositivo sobre solicitações urgentes, atribuições e atualizações importantes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Status: {isSubscribed ? (
                <span className="text-primary flex items-center gap-1 inline-flex">
                  <Check className="h-4 w-4" />
                  Ativado
                </span>
              ) : (
                <span className="text-muted-foreground">Desativado</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {isSubscribed 
                ? 'Você receberá notificações push neste dispositivo'
                : 'Ative para receber notificações no celular'}
            </p>
          </div>
          <Button
            onClick={handleToggle}
            disabled={loading}
            variant={isSubscribed ? 'outline' : 'default'}
          >
            {loading ? 'Processando...' : isSubscribed ? 'Desativar' : 'Ativar Notificações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
