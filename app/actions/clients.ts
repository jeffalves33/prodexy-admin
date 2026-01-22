'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getClients() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data
}

export async function addClient(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const clientData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    company: formData.get('company') as string,
    status: (formData.get('status') as string) || 'active',
    created_by: user.id,
  }

  const { error } = await supabase.from('clients').insert(clientData)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

export async function updateClient(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const clientData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    company: formData.get('company') as string,
    status: formData.get('status') as string,
  }

  const { error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/clients')
}
