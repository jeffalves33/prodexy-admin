'use client'

import React from "react"
import { Suspense } from 'react'
import Loading from './loading' // Import the Loading component

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, AlertCircle, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Request, Client, RequestComment, Profile } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'
import { useSearchParams } from 'next/navigation'

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [comments, setComments] = useState<RequestComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    description: '',
    type: 'bug' as const,
    priority: 'medium' as const,
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const requestId = searchParams.get('id')
    if (requestId && requests.length > 0) {
      openRequestDetail(requestId)
    }
  }, [requests])

  const loadData = async () => {
    const [requestsRes, clientsRes, profilesRes] = await Promise.all([
      supabase
        .from('requests')
        .select(`
          *,
          clients(*),
          created_by_user:profiles!requests_created_by_fkey(*),
          assigned_profiles:profiles!requests_assigned_to_fkey(*)
        `)
        .order('created_at', { ascending: false }),

      supabase.from('clients').select('*').eq('status', 'active').is('deleted_at', null).order('name'),
      supabase.from('profiles').select('*').order('name'),
    ])

    if (requestsRes.data) setRequests(requestsRes.data)
    if (clientsRes.data) setClients(clientsRes.data)
    if (profilesRes.data) setProfiles(profilesRes.data)
  }

  const openRequestDetail = async (requestId: string) => {
    const request = requests.find(r => r.id === requestId)
    if (request) {
      setSelectedRequest(request)
      setDetailOpen(true)

      // Load comments
      const { data } = await supabase
        .from('request_comments')
        .select('*, profiles(*)')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true })

      if (data) setComments(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('requests').insert({
      client_id: formData.client_id,
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      trello_link: null,
      created_by: user?.id,
    })


    if (!error) {
      setOpen(false)
      setFormData({
        client_id: '',
        title: '',
        description: '',
        type: 'bug',
        priority: 'medium',
      })
      loadData()
    }

    setLoading(false)
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedRequest) return

    await supabase
      .from('requests')
      .update({ status })
      .eq('id', selectedRequest.id)

    loadData()
    setDetailOpen(false)
  }

  const handleAssign = async (assignedTo: string | null) => {
    if (!selectedRequest) return

    await supabase
      .from('requests')
      .update({ assigned_to: assignedTo })
      .eq('id', selectedRequest.id)

    loadData()
    const updated = requests.find(r => r.id === selectedRequest.id)
    if (updated) setSelectedRequest(updated)
  }

  const handleAddComment = async () => {
    if (!selectedRequest || !newComment.trim()) return

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('request_comments').insert({
      request_id: selectedRequest.id,
      message: newComment,
      created_by: user?.id,
    })

    setNewComment('')

    // Reload comments
    const { data } = await supabase
      .from('request_comments')
      .select('*, profiles(*)')
      .eq('request_id', selectedRequest.id)
      .order('created_at', { ascending: true })

    if (data) setComments(data)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-destructive text-destructive-foreground'
      case 'high':
        return 'bg-destructive/60 text-destructive-foreground'
      case 'medium':
        return 'bg-primary/40 text-foreground'
      case 'low':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-primary/20 text-primary'
      case 'in_progress':
        return 'bg-primary/40 text-foreground'
      case 'blocked':
        return 'bg-destructive/20 text-destructive'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const priorityLabels = {
    urgent: 'Urgente',
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa',
  }

  const statusLabels = {
    open: 'Aberta',
    triage: 'Triagem',
    in_progress: 'Em Andamento',
    blocked: 'Bloqueada',
    done: 'Concluída',
    canceled: 'Cancelada',
  }

  const typeLabels = {
    bug: 'Bug',
    adjustment: 'Ajuste',
    improvement: 'Melhoria',
    support: 'Suporte',
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<Loading />}> {/* Wrap the main content in a Suspense boundary */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Solicitações</h1>
              <p className="text-muted-foreground">Gerencie incidentes e demandas</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Solicitação
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Solicitação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="client_id">Cliente *</Label>
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                      required
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="bg-secondary"
                      placeholder="Resumo curto do problema"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      className="bg-secondary"
                      rows={4}
                      placeholder="Descreva o problema em detalhes"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger className="bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bug">Bug</SelectItem>
                          <SelectItem value="adjustment">Ajuste</SelectItem>
                          <SelectItem value="improvement">Melhoria</SelectItem>
                          <SelectItem value="support">Suporte</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Prioridade *</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger className="bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="urgent">Urgente</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="low">Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? 'Criando...' : 'Criar Solicitação'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Urgentes em destaque */}
          {requests.filter(r => r.priority === 'urgent' && r.status !== 'done' && r.status !== 'canceled').length > 0 && (
            <Card className="bg-destructive/10 border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">Solicitações Urgentes</h3>
                </div>
                <div className="space-y-2">
                  {requests
                    .filter(r => r.priority === 'urgent' && r.status !== 'done' && r.status !== 'canceled')
                    .map((request) => (
                      <div
                        key={request.id}
                        className="p-3 rounded-lg bg-card cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => openRequestDetail(request.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{request.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {request.clients?.name} • {typeLabels[request.type]}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                            {statusLabels[request.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de todas as solicitações */}
          <div className="space-y-3">
            {requests
              .filter(r => r.priority !== 'urgent' || r.status === 'done' || r.status === 'canceled')
              .map((request) => (
                <Card
                  key={request.id}
                  className="bg-card border-border cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => openRequestDetail(request.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(request.priority)}`}>
                            {priorityLabels[request.priority]}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                            {typeLabels[request.type]}
                          </span>
                        </div>
                        <h3 className="font-semibold">{request.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.clients?.name}
                        </p>
                        {request.assigned_profiles && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.assigned_profiles.name}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                        {statusLabels[request.status]}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {requests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma solicitação registrada</p>
            </div>
          )}
        </div>
      </Suspense>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="bg-card max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedRequest.title}</DialogTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedRequest.clients?.name}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(selectedRequest.priority)}`}>
                      {priorityLabels[selectedRequest.priority]}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      {typeLabels[selectedRequest.type]}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <p className="mt-1 whitespace-pre-wrap">{selectedRequest.description}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedRequest.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberta</SelectItem>
                        <SelectItem value="triage">Triagem</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="blocked">Bloqueada</SelectItem>
                        <SelectItem value="done">Concluída</SelectItem>
                        <SelectItem value="canceled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Atribuído para</Label>
                    <Select
                      value={selectedRequest.assigned_to || 'none'}
                      onValueChange={(value) => handleAssign(value === 'none' ? null : value)}
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguém</SelectItem>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={profile.id}>
                            {profile.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <Label className="text-sm font-semibold">Comentários</Label>
                  <div className="space-y-3 mt-3 max-h-60 overflow-y-auto">
                    {comments.map((comment) => (
                      <div key={comment.id} className="p-3 rounded-lg bg-secondary">
                        <p className="text-xs text-muted-foreground mb-1">
                          {comment.profiles?.name} • {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{comment.message}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum comentário ainda
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Textarea
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="bg-secondary"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
