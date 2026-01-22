'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return data || []
}

export async function markAsRead(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard')
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false)
  
  if (error) throw error
  
  revalidatePath('/dashboard')
}

export async function deleteNotification(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard')
}
