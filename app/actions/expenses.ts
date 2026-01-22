'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExpenses() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createExpense(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const expenseData = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    category: formData.get('category') as string,
    expense_date: formData.get('expense_date') as string,
    payment_method: formData.get('payment_method') as string,
    notes: formData.get('notes') as string,
    created_by: user.id,
  }

  const { error } = await supabase.from('expenses').insert(expenseData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
}

export async function updateExpense(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const expenseData = {
    description: formData.get('description') as string,
    amount: parseFloat(formData.get('amount') as string),
    category: formData.get('category') as string,
    expense_date: formData.get('expense_date') as string,
    payment_method: formData.get('payment_method') as string,
    notes: formData.get('notes') as string,
  }

  const { error } = await supabase
    .from('expenses')
    .update(expenseData)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
}

export async function deleteExpense(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/expenses')
  revalidatePath('/dashboard')
}
