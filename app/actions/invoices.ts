'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getInvoices() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('invoices')
    .select('*, client:clients(name)')
    .order('due_date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const invoiceData = {
    client_id: formData.get('client_id') as string,
    invoice_number: formData.get('invoice_number') as string,
    amount: parseFloat(formData.get('amount') as string),
    due_date: formData.get('due_date') as string,
    status: 'pending',
    description: formData.get('description') as string,
    created_by: user.id,
  }

  const { error } = await supabase.from('invoices').insert(invoiceData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/invoices')
}

export async function markInvoiceAsPaid(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('amount, client_id')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // Update invoice status
  const { error: updateError } = await supabase
    .from('invoices')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) throw updateError

  // Create payment record
  const { error: paymentError } = await supabase.from('payments').insert({
    invoice_id: id,
    amount: invoice.amount,
    payment_date: new Date().toISOString(),
    payment_method: 'manual',
    created_by: user.id,
  })

  if (paymentError) throw paymentError

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
}
