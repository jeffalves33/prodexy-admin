'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check, AlertCircle, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Invoice } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const supabase = createClient()

  useEffect(() => {
    loadInvoices()
  }, [selectedMonth, selectedYear])

  const loadInvoices = async () => {
    const { data } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .order('due_date', { ascending: true })

    if (data) setInvoices(data)
  }

  const markAsPaid = async (invoiceId: string) => {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        confirmed_by: user?.id,
      })
      .eq('id', invoiceId)

    // Criar registro de pagamento
    const invoice = invoices.find(inv => inv.id === invoiceId)
    if (invoice && user) {
      await supabase.from('payments').insert({
        invoice_id: invoiceId,
        amount: invoice.amount,
        payment_date: new Date().toISOString().split('T')[0],
        confirmed_by: user.id,
      })
    }

    loadInvoices()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const totalExpected = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)
  const totalReceived = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0)

  const openWhatsApp = (invoice: any) => {
    const phoneRaw = invoice?.clients?.phone || ''
    const phone = phoneRaw.replace(/\D/g, '') // só números

    if (!phone) return

    const due = new Date(invoice.due_date).toLocaleDateString('pt-BR')
    const amount = formatCurrency(Number(invoice.amount))
    const clientName = invoice?.clients?.name || 'Cliente'

    const text = `Olá, ${clientName}! Passando para lembrar do pagamento (${amount}) com vencimento em ${due}.`
    const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cobranças</h1>
          <p className="text-muted-foreground">Gerencie as faturas mensais</p>
        </div>

        <div className="flex gap-4">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(Number(value))}
          >
            <SelectTrigger className="w-40 bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="w-32 bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Esperado</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalExpected)}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(totalReceived)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Card
              key={invoice.id}
              className={`bg-card border-border ${invoice.status === 'overdue' ? 'border-destructive' : ''
                }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold">{invoice.clients?.name || 'Cliente'}</h3>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{formatCurrency(Number(invoice.amount))}</p>
                    <span
                      className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${invoice.status === 'paid'
                        ? 'bg-primary/20 text-primary'
                        : invoice.status === 'overdue'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {invoice.status === 'paid' && 'Pago'}
                      {invoice.status === 'open' && 'Em aberto'}
                      {invoice.status === 'overdue' && 'Atrasado'}
                      {invoice.status === 'canceled' && 'Cancelado'}
                    </span>
                  </div>
                  {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
                    <Button
                      size="sm"
                      onClick={() => markAsPaid(invoice.id)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Marcar Pago
                    </Button>
                  )}
                  {invoice.status !== 'paid' && invoice.status !== 'canceled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openWhatsApp(invoice)}
                      className="bg-transparent"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}

                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma fatura neste período</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
