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
import { Plus, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Expense } from '@/lib/types'
import { Textarea } from '@/components/ui/textarea'

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const supabase = createClient()

  const [formData, setFormData] = useState({
    description: '',
    category: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    loadExpenses()
  }, [selectedMonth, selectedYear])

  const loadExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .order('expense_date', { ascending: false })

    if (data) setExpenses(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const date = new Date(formData.expense_date)

    const { error } = await supabase.from('expenses').insert({
      description: formData.description,
      category: formData.category || null,
      amount: Number(formData.amount),
      expense_date: formData.expense_date,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      is_recurring: false,
      status: 'paid',
      notes: formData.notes || null,
      created_by: user?.id,
    })

    if (!error) {
      setOpen(false)
      setFormData({
        description: '',
        category: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: '',
      })
      loadExpenses()
    }

    setLoading(false)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i)

  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
            <p className="text-muted-foreground">Gerencie suas despesas</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nova Despesa
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card">
              <DialogHeader>
                <DialogTitle>Nova Despesa</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-secondary"
                      placeholder="Ex: Servidor, Software, etc"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor *</Label>
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense_date">Data *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    required
                    className="bg-secondary"
                  />
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
                  {loading ? 'Salvando...' : 'Salvar Despesa'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(Number(value))}
          >
            <SelectTrigger className="w-40 bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={(index + 1).toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(Number(value))}
          >
            <SelectTrigger className="w-32 bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Total do Período</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {expenses.map((expense) => (
            <Card key={expense.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{expense.description}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {expense.category && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {expense.category}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-destructive">
                    {formatCurrency(Number(expense.amount))}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {expenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma despesa neste período</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
