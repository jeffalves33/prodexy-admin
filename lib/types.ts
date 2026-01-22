export interface Profile {
  id: string
  name: string
  email: string
  role: 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  project_service?: string
  status: 'active' | 'inactive'
  trello_link?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface BillingPlan {
  id: string
  client_id: string
  monthly_amount: number
  due_day: number
  status: 'active' | 'inactive'
  setup_fee?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  client_id: string
  billing_plan_id?: string
  month: number
  year: number
  amount: number
  due_date: string
  status: 'open' | 'paid' | 'overdue' | 'canceled'
  paid_at?: string
  payment_method?: string
  notes?: string
  confirmed_by?: string
  created_at: string
  updated_at: string
  clients?: Client
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string
  payment_method?: string
  notes?: string
  confirmed_by: string
  created_at: string
}

export interface Expense {
  id: string
  description: string
  category?: string
  amount: number
  expense_date: string
  is_recurring: boolean
  recurrence_day?: number
  status: 'open' | 'paid' | 'canceled'
  month?: number
  year?: number
  paid_at?: string
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Request {
  id: string
  client_id: string
  title: string
  description: string
  type: 'bug' | 'adjustment' | 'improvement' | 'support'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'triage' | 'in_progress' | 'blocked' | 'done' | 'canceled'
  created_by: string
  assigned_to?: string
  trello_link?: string
  created_at: string
  updated_at: string
  clients?: Client
  profiles?: Profile
  assigned_profiles?: Profile
}

export interface RequestComment {
  id: string
  request_id: string
  message: string
  created_by: string
  created_at: string
  profiles?: Profile
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  reference_id?: string
  reference_type?: string
  is_read: boolean
  read_at?: string
  created_at: string
}
