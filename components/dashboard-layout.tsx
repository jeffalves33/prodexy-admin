'use client'

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './notification-bell'

interface DashboardLayoutProps {
  children: ReactNode
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Clientes', href: '/dashboard/clients', icon: Users },
    { name: 'Cobranças', href: '/dashboard/invoices', icon: CreditCard },
    { name: 'Despesas', href: '/dashboard/expenses', icon: TrendingDown },
    { name: 'Entradas', href: '/dashboard/income', icon: DollarSign },
    { name: 'Solicitações', href: '/dashboard/requests', icon: AlertCircle },
    { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
  ]

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <h1 className="text-xl font-bold">Prodexy</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border hidden lg:block">
            <h1 className="text-2xl font-bold">Prodexy</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-foreground'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="hidden lg:flex items-center justify-end p-4 border-b border-border bg-card">
          <NotificationBell />
        </div>
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

export { DashboardLayout }
export default DashboardLayout
