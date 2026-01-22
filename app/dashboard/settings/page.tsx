import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard-layout'
import { PushNotificationSetup } from '@/components/push-notification-setup'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Configure notificações e preferências do app
          </p>
        </div>

        <PushNotificationSetup />
      </div>
    </DashboardLayout>
  )
}
