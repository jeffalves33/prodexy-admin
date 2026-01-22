'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // Get monthly revenue (paid invoices)
  const { data: revenue } = await supabase
    .from('payments')
    .select('amount')
    .gte('payment_date', startOfMonth)
    .lte('payment_date', endOfMonth)

  const totalRevenue = revenue?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

  // Get monthly income entries (avulsas)
  const { data: incomeEntries } = await supabase
    .from('income_entries')
    .select('amount')
    .gte('income_date', startOfMonth)
    .lte('income_date', endOfMonth)

  const totalIncomeEntries =
    incomeEntries?.reduce((sum, i) => sum + Number(i.amount), 0) || 0

  const totalRevenueWithIncome = totalRevenue + totalIncomeEntries

  // Get monthly expenses
  const { data: expenses } = await supabase
    .from('expenses')
    .select('amount')
    .gte('expense_date', startOfMonth)
    .lte('expense_date', endOfMonth)

  const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0

  // Get pending invoices
  const { data: pendingInvoices } = await supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .eq('status', 'pending')
    .order('due_date')
    .limit(5)

  // Get urgent requests
  const { data: urgentRequests } = await supabase
    .from('requests')
    .select('*, client:clients(name)')
    .in('priority', ['high', 'urgent'])
    .neq('status', 'closed')
    .order('created_at', { ascending: false })
    .limit(5)

  return {
    revenue: totalRevenueWithIncome,
    expenses: totalExpenses,
    profit: totalRevenueWithIncome - totalExpenses,
    pendingInvoices: pendingInvoices || [],
    urgentRequests: urgentRequests || [],
  }
}
