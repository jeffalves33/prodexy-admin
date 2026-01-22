import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getRequest, updateRequestStatus, addComment, assignRequest } from '@/app/actions/requests'
import { createClient } from '@/lib/supabase/server'
import DashboardLayout from '@/components/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, User, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  
  try {
    const request = await getRequest(id)
    const supabase = await createClient()
    const { data: users } = await supabase.from('profiles').select('id, name')

    const statusColors = {
      open: 'bg-blue-500/10 text-blue-500',
      in_progress: 'bg-yellow-500/10 text-yellow-500',
      resolved: 'bg-green-500/10 text-green-500',
      closed: 'bg-gray-500/10 text-gray-500',
    }

    const priorityColors = {
      low: 'bg-gray-500/10 text-gray-400',
      medium: 'bg-blue-500/10 text-blue-400',
      high: 'bg-orange-500/10 text-orange-400',
      urgent: 'bg-red-500/10 text-red-400',
    }

    async function handleStatusChange(formData: FormData) {
      'use server'
      const status = formData.get('status') as string
      await updateRequestStatus(id, status)
    }

    async function handleAddComment(formData: FormData) {
      'use server'
      const comment = formData.get('comment') as string
      if (comment.trim()) {
        await addComment(id, comment)
      }
    }

    async function handleAssign(formData: FormData) {
      'use server'
      const userId = formData.get('user_id') as string
      await assignRequest(id, userId)
    }

    return (
      <DashboardLayout>
        <div className="flex flex-col gap-6 pb-20">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/requests">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{request.title}</h1>
              <p className="text-sm text-muted-foreground">
                Cliente: {request.client?.name || 'N/A'}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>Detalhes</CardTitle>
                <div className="flex gap-2">
                  <Badge className={priorityColors[request.priority as keyof typeof priorityColors]}>
                    {request.priority}
                  </Badge>
                  <Badge className={statusColors[request.status as keyof typeof statusColors]}>
                    {request.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{request.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Atribuído a
                  </p>
                  <p className="font-medium">{request.assigned_to_user?.name || 'Não atribuído'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Criado em
                  </p>
                  <p className="font-medium">
                    {new Date(request.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <form action={handleStatusChange} className="flex-1">
                  <Select name="status" defaultValue={request.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Aberto</SelectItem>
                      <SelectItem value="in_progress">Em Progresso</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="closed">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" className="w-full mt-2" size="sm">
                    Atualizar Status
                  </Button>
                </form>

                <form action={handleAssign} className="flex-1">
                  <Select name="user_id" defaultValue={request.assigned_to || ''}>
                    <SelectTrigger>
                      <SelectValue placeholder="Atribuir a..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="submit" variant="outline" className="w-full mt-2 bg-transparent" size="sm">
                    Atribuir
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comentários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.comments && request.comments.length > 0 ? (
                request.comments.map((comment: any) => (
                  <div key={comment.id} className="border-l-2 border-primary/20 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.user?.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm">{comment.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
              )}

              <form action={handleAddComment} className="pt-4 border-t space-y-2">
                <Textarea
                  name="comment"
                  placeholder="Adicionar comentário..."
                  className="min-h-[100px]"
                  required
                />
                <Button type="submit" className="w-full">
                  Adicionar Comentário
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  } catch (error) {
    notFound()
  }
}
