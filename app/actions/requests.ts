'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPushNotification } from '@/lib/send-push-notification'

export async function getRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      client:clients(name),
      assigned_to_user:profiles!requests_assigned_to_fkey(name)
    `)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function getRequest(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      client:clients(name, email),
      assigned_to_user:profiles!requests_assigned_to_fkey(name),
      created_by_user:profiles!requests_created_by_fkey(name),
      comments:request_comments(*, user:profiles(name))
    `)
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createRequest(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const requestData = {
    client_id: formData.get('client_id') as string,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as string,
    priority: formData.get('priority') as string,
    status: 'open',
    assigned_to: formData.get('assigned_to') as string || null,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('requests')
    .insert(requestData)
    .select()
    .single()
  
  if (error) throw error

  // Create notification for assigned user if exists
  if (requestData.assigned_to) {
    await supabase.from('notifications').insert({
      user_id: requestData.assigned_to,
      title: `Nova Solicitação: ${requestData.title}`,
      message: `Você foi atribuído a uma solicitação de prioridade ${requestData.priority}`,
      type: 'request_assigned',
      related_id: data.id,
      related_type: 'request',
    })

    // Enviar push notification
    await sendPushNotification({
      userId: requestData.assigned_to,
      title: `🔔 Nova Solicitação: ${requestData.title}`,
      body: `Prioridade ${requestData.priority.toUpperCase()} - ${requestData.type}`,
      url: `/dashboard/requests/${data.id}`
    })
  }
  
  revalidatePath('/dashboard/requests')
}

export async function updateRequestStatus(id: string, status: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', id)
  
  if (error) throw error
  
  revalidatePath('/dashboard/requests')
  revalidatePath(`/dashboard/requests/${id}`)
}

export async function addComment(requestId: string, comment: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase.from('request_comments').insert({
    request_id: requestId,
    comment,
    user_id: user.id,
  })
  
  if (error) throw error
  
  revalidatePath(`/dashboard/requests/${requestId}`)
}

export async function assignRequest(requestId: string, userId: string) {
  const supabase = await createClient()
  
  const { data: request, error: updateError } = await supabase
    .from('requests')
    .update({ assigned_to: userId })
    .eq('id', requestId)
    .select('title, priority')
    .single()
  
  if (updateError) throw updateError

  // Create notification
  await supabase.from('notifications').insert({
    user_id: userId,
    title: `Solicitação Atribuída: ${request.title}`,
    message: `Você foi atribuído a uma solicitação de prioridade ${request.priority}`,
    type: 'request_assigned',
    related_id: requestId,
    related_type: 'request',
  })

  // Enviar push notification
  await sendPushNotification({
    userId,
    title: `📋 Solicitação Atribuída`,
    body: `${request.title} - Prioridade ${request.priority.toUpperCase()}`,
    url: `/dashboard/requests/${requestId}`
  })
  
  revalidatePath('/dashboard/requests')
  revalidatePath(`/dashboard/requests/${requestId}`)
}
