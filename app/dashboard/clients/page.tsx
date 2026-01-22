'use client'

import React from "react"

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
import { Plus, Phone, Mail, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    project_service: '',
    status: 'active' as const,
    trello_link: '',
    notes: '',
    monthly_amount: '',   // NOVO
    due_day: '10',        // NOVO (default)
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })


    if (data) setClients(data)
  }

  const deleteClient = async (clientId: string) => {

    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('clients')
      .update({
        status: 'inactive',
        deleted_at: new Date().toISOString(),
        deleted_by: user?.id || null,
      })
      .eq('id', clientId)

    loadClients()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    // 1) cria cliente
    const clientInsert = await supabase
      .from('clients')
      .insert({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        project_service: formData.project_service || null,
        status: formData.status,
        trello_link: formData.trello_link || null,
        notes: formData.notes || null,
        created_by: user?.id,
      })
      .select('id')
      .single()

    if (clientInsert.error) {
      setLoading(false)
      return
    }

    const clientId = clientInsert.data.id

    // 2) cria plano de cobrança (mensalidade + vencimento)
    const monthly = Number(formData.monthly_amount)
    const dueDay = Number(formData.due_day)

    await supabase.from('billing_plans').insert({
      client_id: clientId,
      monthly_amount: monthly,
      due_day: dueDay,
      status: 'active',
      created_at: new Date().toISOString(),
    })

    const now = new Date()
    await supabase.rpc('generate_invoice_for_client_month', {
      p_client_id: clientId,
      p_year: now.getFullYear(),
      p_month: now.getMonth() + 1,
    })

    setOpen(false)
    setFormData({
      name: '',
      phone: '',
      email: '',
      project_service: '',
      status: 'active',
      trello_link: '',
      notes: '',
      monthly_amount: '',
      due_day: '10',
    })
    loadClients()

    setLoading(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Cliente</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_service">Projeto/Serviço</Label>
                    <Input
                      id="project_service"
                      value={formData.project_service}
                      onChange={(e) => setFormData({ ...formData, project_service: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'active' | 'inactive') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger className="bg-secondary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trello_link">Link do Trello</Label>
                    <Input
                      id="trello_link"
                      value={formData.trello_link}
                      onChange={(e) => setFormData({ ...formData, trello_link: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="monthly_amount">Mensalidade (R$) *</Label>
                    <Input
                      id="monthly_amount"
                      type="number"
                      step="0.01"
                      value={formData.monthly_amount}
                      onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="due_day">Dia do vencimento *</Label>
                    <Input
                      id="due_day"
                      type="number"
                      min={1}
                      max={28}
                      value={formData.due_day}
                      onChange={(e) => setFormData({ ...formData, due_day: e.target.value })}
                      required
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="bg-secondary"
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h3 className="font-semibold text-lg">{client.name}</h3>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${client.status === 'active'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {client.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteClient(client.id)}
                      title="Excluir cliente"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {client.project_service && (
                  <p className="text-sm text-muted-foreground mb-3">{client.project_service}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{client.phone}</span>
                  </div>
                  {client.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum cliente cadastrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
