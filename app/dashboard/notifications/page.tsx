import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '@/app/actions/notifications'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Check, CheckCheck, Trash2, FileText, DollarSign, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function NotificationsPage() {
  const notifications = await getNotifications()
  const unreadCount = notifications.filter(n => !n.read).length

  async function handleMarkAsRead(id: string) {
    'use server'
    await markAsRead(id)
  }

  async function handleMarkAllAsRead() {
    'use server'
    await markAllAsRead()
  }

  async function handleDelete(id: string) {
    'use server'
    await deleteNotification(id)
  }

  const typeIcons = {
    request_assigned: AlertCircle,
    request_updated: FileText,
    payment_received: DollarSign,
    invoice_overdue: AlertCircle,
    system: Bell,
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
            </p>
          </div>
          {unreadCount > 0 && (
            <form action={handleMarkAllAsRead}>
              <Button type="submit" variant="outline" size="sm">
                <CheckCheck className="w-4 h-4 mr-2" />
                Marcar todas como lidas
              </Button>
            </form>
          )}
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell
              
              return (
                <Card key={notification.id} className={!notification.read ? 'border-primary/30 bg-primary/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${!notification.read ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Icon className={`w-5 h-5 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          {!notification.read && (
                            <Badge variant="default" className="shrink-0">Nova</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{new Date(notification.created_at).toLocaleString('pt-BR')}</span>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          {notification.related_type === 'request' && notification.related_id && (
                            <Link href={`/dashboard/requests/${notification.related_id}`}>
                              <Button variant="outline" size="sm">
                                Ver Solicitação
                              </Button>
                            </Link>
                          )}
                          
                          {!notification.read && (
                            <form action={handleMarkAsRead.bind(null, notification.id)}>
                              <Button type="submit" variant="ghost" size="sm">
                                <Check className="w-4 h-4 mr-1" />
                                Marcar como lida
                              </Button>
                            </form>
                          )}
                          
                          <form action={handleDelete.bind(null, notification.id)}>
                            <Button type="submit" variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
