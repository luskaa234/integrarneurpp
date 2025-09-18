import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis de ambiente estão definidas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL não está definida')
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não está definida')
}

// Cliente Supabase APENAS para banco de dados (SEM Auth)
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

// Log de inicialização
console.log('🔧 Supabase configurado:', {
  url: supabaseUrl ? 'OK' : 'ERRO',
  key: supabaseAnonKey ? 'OK' : 'ERRO'
})

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'financeiro' | 'agendamento' | 'medico' | 'paciente'
          avatar_url?: string
          created_at: string
          is_active: boolean
          phone?: string
          cpf?: string
          birth_date?: string
          address?: string
          crm?: string
          specialty?: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'admin' | 'financeiro' | 'agendamento' | 'medico' | 'paciente'
          avatar_url?: string
          created_at?: string
          is_active?: boolean
          phone?: string
          cpf?: string
          birth_date?: string
          address?: string
          crm?: string
          specialty?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'financeiro' | 'agendamento' | 'medico' | 'paciente'
          avatar_url?: string
          created_at?: string
          is_active?: boolean
          phone?: string
          cpf?: string
          birth_date?: string
          address?: string
          crm?: string
          specialty?: string
        }
      }
      appointments: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          date: string
          time: string
          status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
          type: string
          notes?: string
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          date: string
          time: string
          status?: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
          type: string
          notes?: string
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          date?: string
          time?: string
          status?: 'agendado' | 'confirmado' | 'cancelado' | 'realizado'
          type?: string
          notes?: string
          price?: number
          created_at?: string
        }
      }
      financial_records: {
        Row: {
          id: string
          type: 'receita' | 'despesa'
          amount: number
          description: string
          category: string
          date: string
          appointment_id?: string
          status: 'pendente' | 'pago' | 'cancelado'
          created_at: string
        }
        Insert: {
          id?: string
          type: 'receita' | 'despesa'
          amount: number
          description: string
          category: string
          date: string
          appointment_id?: string
          status?: 'pendente' | 'pago' | 'cancelado'
          created_at?: string
        }
        Update: {
          id?: string
          type?: 'receita' | 'despesa'
          amount?: number
          description?: string
          category?: string
          date?: string
          appointment_id?: string
          status?: 'pendente' | 'pago' | 'cancelado'
          created_at?: string
        }
      }
      medical_records: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          date: string
          diagnosis: string
          treatment: string
          notes: string
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          date: string
          diagnosis: string
          treatment: string
          notes: string
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          date?: string
          diagnosis?: string
          treatment?: string
          notes?: string
          created_at?: string
        }
      }
      evaluations: {
        Row: {
          id: string
          medical_record_id: string
          type: string
          score: number
          observations: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          medical_record_id: string
          type: string
          score: number
          observations: string
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          medical_record_id?: string
          type?: string
          score?: number
          observations?: string
          date?: string
          created_at?: string
        }
      }
      doctor_schedules: {
        Row: {
          id: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean
          created_at?: string
        }
      }
    }
  }
}