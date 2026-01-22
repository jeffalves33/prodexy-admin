'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    // Poll every 10 seconds
    const interval = setInterval(loadNotifications, 10000)

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [])

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }

  const markAsRead = async (id: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)

    loadNotifications()
  }

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    
    if (notification.reference_type === 'request' && notification.reference_id) {
      router.push(`/dashboard/requests?id=${notification.reference_id}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            Nenhuma notificação
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start p-3 cursor-pointer ${
                !notification.is_read ? 'bg-accent' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {notification.message}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(notification.created_at).toLocaleString('pt-BR')}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
