import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDashboardData } from '@/app/actions/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { revenue, expenses, profit, pendingInvoices, urgentRequests, totalExpected, totalReceived, totalExpenses, balance, totalOverdue, invoices } = await getDashboardData()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumo de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{formatCurrency(revenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(expenses)}</div>
              <p className="text-xs text-muted-foreground mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${profit >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(profit)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Receita - Despesas</p>
            </CardContent>
          </Card>
        </div>

        {pendingInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Faturas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvoices.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                    <div>
                      <p className="font-medium">{invoice.client?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(invoice.amount)}</p>
                      <Badge variant="outline" className="mt-1">Pendente</Badge>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/invoices">
                  <p className="text-sm text-primary hover:underline text-center mt-2">Ver todas →</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {urgentRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                Solicitações Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {urgentRequests.map((request: any) => (
                  <Link key={request.id} href={`/dashboard/requests/${request.id}`}>
                    <div className="flex items-start justify-between p-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Cliente: {request.client?.name}
                        </p>
                      </div>
                      <Badge variant="destructive">{request.priority}</Badge>
                    </div>
                  </Link>
                ))}
                <Link href="/dashboard/requests">
                  <p className="text-sm text-primary hover:underline text-center mt-2">Ver todas →</p>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
