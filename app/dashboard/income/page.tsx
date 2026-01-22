'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Client } from '@/lib/types'

export default function IncomePage() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [entries, setEntries] = useState<any[]>([])
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const supabase = createClient()

    const [formData, setFormData] = useState({
        client_id: 'none',
        description: '',
        amount: '',
        income_date: new Date().toISOString().split('T')[0],
        notes: '',
    })

    useEffect(() => {
        loadAll()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMonth, selectedYear])

    const loadAll = async () => {
        const [clientsRes, entriesRes] = await Promise.all([
            supabase
                .from('clients')
                .select('*')
                .is('deleted_at', null)
                .eq('status', 'active')
                .order('name'),
            supabase
                .from('income_entries')
                .select('*, clients(*)')
                .eq('month', selectedMonth)
                .eq('year', selectedYear)
                .order('income_date', { ascending: false }),
        ])

        if (clientsRes.data) setClients(clientsRes.data)
        if (entriesRes.data) setEntries(entriesRes.data)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { data: { user } } = await supabase.auth.getUser()
        const date = new Date(formData.income_date)

        const { error } = await supabase.from('income_entries').insert({
            client_id: formData.client_id === 'none' ? null : formData.client_id,
            description: formData.description,
            amount: Number(formData.amount),
            income_date: formData.income_date,
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            notes: formData.notes || null,
            created_by: user?.id,
        })

        if (!error) {
            setOpen(false)
            setFormData({
                client_id: 'none',
                description: '',
                amount: '',
                income_date: new Date().toISOString().split('T')[0],
                notes: '',
            })
            loadAll()
        }

        setLoading(false)
    }

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

    const totalIncome = entries.reduce((sum, e) => sum + Number(e.amount), 0)

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Entradas</h1>
                        <p className="text-muted-foreground">Registre entradas avulsas do mês</p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Plus className="h-4 w-4 mr-2" />
                                Nova Entrada
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="bg-card max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Nova Entrada</DialogTitle>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Cliente (opcional)</Label>
                                    <Select
                                        value={formData.client_id}
                                        onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                                    >
                                        <SelectTrigger className="bg-secondary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sem cliente</SelectItem>
                                            {clients.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Descrição *</Label>
                                    <Input
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        required
                                        className="bg-secondary"
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Valor (R$) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            required
                                            className="bg-secondary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="income_date">Data *</Label>
                                        <Input
                                            id="income_date"
                                            type="date"
                                            value={formData.income_date}
                                            onChange={(e) => setFormData({ ...formData, income_date: e.target.value })}
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
                                    {loading ? 'Salvando...' : 'Salvar Entrada'}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="flex gap-4">
                    <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(Number(v))}>
                        <SelectTrigger className="w-40 bg-secondary">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {months.map((m, i) => (
                                <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
                        <SelectTrigger className="w-32 bg-secondary">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map((y) => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-primary" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total do Período</p>
                                <p className="text-2xl font-bold text-primary">{formatCurrency(totalIncome)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-3">
                    {entries.map((e) => (
                        <Card key={e.id} className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{e.description}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {e.clients?.name ? `${e.clients.name} • ` : ''}
                                            {new Date(e.income_date).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(Number(e.amount))}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {entries.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhuma entrada neste período</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
