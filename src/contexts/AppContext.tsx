"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'financeiro' | 'agendamento' | 'medico' | 'paciente';
  avatar_url?: string;
  created_at: string;
  is_active: boolean;
  phone?: string;
  cpf?: string;
  birth_date?: string;
  address?: string;
  crm?: string;
  specialty?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'realizado';
  type: string;
  notes?: string;
  price: number;
  created_at: string;
}


interface FinancialRecord {
  id: string;
  type: 'receita' | 'despesa';
  amount: number;
  description: string;
  category: string;
  date: string;
  appointment_id?: string;
  status: 'pendente' | 'pago' | 'cancelado';
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  is_active: boolean;
}

interface AppContextType {
  // Dados
  users: User[];
  doctors: User[];
  patients: User[];
  appointments: Appointment[];
  financialRecords: FinancialRecord[];
  services: Service[];
  loading: boolean;
  error: string | null;
  
  // Usuários
  addUser: (user: Omit<User, 'id' | 'created_at'>) => Promise<boolean>;
  updateUser: (id: string, user: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  
  // Consultas
  addAppointment: (appointment: Omit<Appointment, 'id' | 'created_at'>) => Promise<boolean>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  
  // Financeiro
  addFinancialRecord: (record: Omit<FinancialRecord, 'id' | 'created_at'>) => Promise<boolean>;
  updateFinancialRecord: (id: string, record: Partial<FinancialRecord>) => Promise<boolean>;
  deleteFinancialRecord: (id: string) => Promise<boolean>;
  
  // Serviços
  addService: (service: Omit<Service, 'id'>) => Promise<boolean>;
  updateService: (id: string, service: Partial<Service>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
  
  // Criação rápida de paciente/médico
  addPatient: (p: { name: string; phone?: string; email?: string }) => Promise<{ id: string } | null>;
  addDoctor: (d: { name: string; specialty?: string; phone?: string; email?: string }) => Promise<{ id: string } | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [services, setServices] = useState<Service[]>([
    // Serviços padrão
    { id: '1', name: 'Consulta Neurológica', price: 300, duration: 60, is_active: true },
    { id: '2', name: 'Avaliação Neuropsicológica', price: 450, duration: 90, is_active: true },
    { id: '3', name: 'Terapia Cognitiva', price: 200, duration: 50, is_active: true },
    { id: '4', name: 'Eletroencefalograma', price: 250, duration: 30, is_active: true }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados derivados
  const doctors = users.filter(user => user.role === 'medico');
  const patients = users.filter(user => user.role === 'paciente');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Carregando dados do Supabase...');

      // Carregar dados do Supabase
      const [usersData, appointmentsData, financialData] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('appointments').select('*').order('date', { ascending: false }),
        supabase.from('financial_records').select('*').order('date', { ascending: false })
      ]);

      if (usersData.error) {
        console.error('❌ Erro ao carregar usuários:', usersData.error);
      } else {
        console.log('✅ Usuários carregados:', usersData.data?.length || 0);
        setUsers(usersData.data || []);
      }

      if (appointmentsData.error) {
        console.error('❌ Erro ao carregar consultas:', appointmentsData.error);
      } else {
        console.log('✅ Consultas carregadas:', appointmentsData.data?.length || 0);
        setAppointments(appointmentsData.data || []);
      }

      if (financialData.error) {
        console.error('❌ Erro ao carregar registros financeiros:', financialData.error);
      } else {
        console.log('✅ Registros financeiros carregados:', financialData.data?.length || 0);
        setFinancialRecords(financialData.data || []);
      }

      // Carregar serviços do localStorage
      const savedServices = localStorage.getItem('neuro-services');
      if (savedServices) {
        setServices(JSON.parse(savedServices));
      }

      console.log('✅ Todos os dados carregados com sucesso!');

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setError('Erro ao carregar dados do sistema');
    } finally {
      setLoading(false);
    }
  };

  // Funções para usuários
  const addUser = async (userData: Omit<User, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      console.log('➕ Adicionando usuário:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar usuário:', error);
        return false;
      }

      if (data) {
        setUsers(prev => [data, ...prev]);
        console.log('✅ Usuário adicionado com sucesso:', data.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao adicionar usuário:', error);
      return false;
    }
  };

  const updateUser = async (id: string, userUpdate: Partial<User>): Promise<boolean> => {
    try {
      console.log('✏️ Atualizando usuário:', id, userUpdate);
      
      const { data, error } = await supabase
        .from('users')
        .update(userUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        return false;
      }

      if (data) {
        setUsers(prev => prev.map(user => user.id === id ? data : user));
        console.log('✅ Usuário atualizado com sucesso:', id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ EXCLUINDO USUÁRIO PERMANENTEMENTE DO SUPABASE:', id);
      
      // EXCLUSÃO REAL E PERMANENTE do Supabase
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir usuário do banco:', error);
        return false;
      }

      // Remover da lista local IMEDIATAMENTE
      setUsers(prev => {
        const updated = prev.filter(user => user.id !== id);
        console.log('✅ Usuário removido da lista local. Restam:', updated.length);
        return updated;
      });
      
      console.log('✅ Usuário EXCLUÍDO PERMANENTEMENTE do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir usuário:', error);
      return false;
    }
  };
  // Criação rápida de paciente/médico a partir da grade Excel
  const addPatient = async (p: { name: string; phone?: string; email?: string }): Promise<{ id: string } | null> => {
    try {
      if (!p.name?.trim()) return null;
      const { data, error } = await supabase
        .from('users')
        .insert([{ name: p.name.trim(), email: p.email ?? '', phone: p.phone ?? '', role: 'paciente', is_active: true }])
        .select('id')
        .single();
      if (error) { console.error('addPatient error', error); return null; }
      // atualiza cache local
      setUsers(prev => [{ id: data.id, name: p.name.trim(), email: p.email ?? '', role: 'paciente', created_at: new Date().toISOString(), is_active: true, phone: p.phone ?? '' }, ...prev]);
      return { id: data.id };
    } catch (e) {
      console.error('addPatient exception', e);
      return null;
    }
  };

  const addDoctor = async (d: { name: string; specialty?: string; phone?: string; email?: string }): Promise<{ id: string } | null> => {
    try {
      if (!d.name?.trim()) return null;
      const { data, error } = await supabase
        .from('users')
        .insert([{ name: d.name.trim(), email: d.email ?? '', phone: d.phone ?? '', role: 'medico', is_active: true, specialty: d.specialty ?? 'Geral' }])
        .select('id')
        .single();
      if (error) { console.error('addDoctor error', error); return null; }
      // atualiza cache local
      setUsers(prev => [{ id: data.id, name: d.name.trim(), email: d.email ?? '', role: 'medico', created_at: new Date().toISOString(), is_active: true, phone: d.phone ?? '', specialty: d.specialty ?? 'Geral' }, ...prev]);
      return { id: data.id };
    } catch (e) {
      console.error('addDoctor exception', e);
      return null;
    }
  };

  // Funções para consultas
  const addAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      console.log('➕ Adicionando consulta:', appointmentData);
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar consulta:', error);
        return false;
      }

      if (data) {
        setAppointments(prev => [data, ...prev]);
        console.log('✅ Consulta adicionada com sucesso:', data.id);
        
        // Adicionar receita automaticamente
        const financialRecord = {
          type: 'receita' as const,
          amount: appointmentData.price,
          description: `Consulta - ${appointmentData.type}`,
          category: 'Consulta',
          date: appointmentData.date,
          status: 'pendente' as const,
          appointment_id: data.id
        };
        
        await addFinancialRecord(financialRecord);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao adicionar consulta:', error);
      return false;
    }
  };

  const updateAppointment = async (id: string, appointmentUpdate: Partial<Appointment>): Promise<boolean> => {
    try {
      console.log('✏️ Atualizando consulta:', id, appointmentUpdate);
      
      const { data, error } = await supabase
        .from('appointments')
        .update(appointmentUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar consulta:', error);
        return false;
      }

      if (data) {
        setAppointments(prev => prev.map(apt => apt.id === id ? data : apt));
        console.log('✅ Consulta atualizada com sucesso:', id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao atualizar consulta:', error);
      return false;
    }
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ EXCLUINDO CONSULTA PERMANENTEMENTE DO SUPABASE:', id);
      
      // EXCLUSÃO REAL E PERMANENTE do Supabase
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir consulta do banco:', error);
        return false;
      }

      // Remover da lista local IMEDIATAMENTE
      setAppointments(prev => {
        const updated = prev.filter(apt => apt.id !== id);
        console.log('✅ Consulta removida da lista local. Restam:', updated.length);
        return updated;
      });
      
      // EXCLUIR registros financeiros relacionados PERMANENTEMENTE
      const { error: finError } = await supabase
        .from('financial_records')
        .delete()
        .eq('appointment_id', id);

      if (!finError) {
        setFinancialRecords(prev => {
          const updated = prev.filter(record => record.appointment_id !== id);
          console.log('✅ Registros financeiros relacionados também excluídos');
          return updated;
        });
      }
      
      console.log('✅ Consulta EXCLUÍDA PERMANENTEMENTE do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir consulta:', error);
      return false;
    }
  };

  // Funções para registros financeiros
  const addFinancialRecord = async (recordData: Omit<FinancialRecord, 'id' | 'created_at'>): Promise<boolean> => {
    try {
      console.log('➕ Adicionando registro financeiro:', recordData);
      
      const { data, error } = await supabase
        .from('financial_records')
        .insert([recordData])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar registro financeiro:', error);
        return false;
      }

      if (data) {
        setFinancialRecords(prev => [data, ...prev]);
        console.log('✅ Registro financeiro adicionado com sucesso:', data.id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao adicionar registro financeiro:', error);
      return false;
    }
  };

  const updateFinancialRecord = async (id: string, recordUpdate: Partial<FinancialRecord>): Promise<boolean> => {
    try {
      console.log('✏️ Atualizando registro financeiro:', id, recordUpdate);
      
      const { data, error } = await supabase
        .from('financial_records')
        .update(recordUpdate)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar registro financeiro:', error);
        return false;
      }

      if (data) {
        setFinancialRecords(prev => prev.map(record => record.id === id ? data : record));
        console.log('✅ Registro financeiro atualizado com sucesso:', id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erro ao atualizar registro financeiro:', error);
      return false;
    }
  };

  const deleteFinancialRecord = async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ EXCLUINDO REGISTRO FINANCEIRO PERMANENTEMENTE DO SUPABASE:', id);
      
      // EXCLUSÃO REAL E PERMANENTE do Supabase
      const { error } = await supabase
        .from('financial_records')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Erro ao excluir registro financeiro do banco:', error);
        return false;
      }

      // Remover da lista local IMEDIATAMENTE
      setFinancialRecords(prev => {
        const updated = prev.filter(record => record.id !== id);
        console.log('✅ Registro financeiro removido da lista local. Restam:', updated.length);
        return updated;
      });
      
      console.log('✅ Registro financeiro EXCLUÍDO PERMANENTEMENTE do Supabase:', id);
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir registro financeiro:', error);
      return false;
    }
  };

  // Funções para serviços (localStorage)
  const addService = async (service: Omit<Service, 'id'>): Promise<boolean> => {
    try {
      const newService = { 
        ...service, 
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      const updatedServices = [...services, newService];
      setServices(updatedServices);
      localStorage.setItem('neuro-services', JSON.stringify(updatedServices));
      return true;
    } catch (error) {
      console.error('❌ Erro ao adicionar serviço:', error);
      return false;
    }
  };

  const updateService = async (id: string, serviceUpdate: Partial<Service>): Promise<boolean> => {
    try {
      const updatedServices = services.map(service => 
        service.id === id ? { ...service, ...serviceUpdate } : service
      );
      setServices(updatedServices);
      localStorage.setItem('neuro-services', JSON.stringify(updatedServices));
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar serviço:', error);
      return false;
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    try {
      console.log('🗑️ EXCLUINDO SERVIÇO PERMANENTEMENTE:', id);
      
      // EXCLUSÃO REAL E PERMANENTE do localStorage
      const updatedServices = services.filter(service => service.id !== id);
      setServices(updatedServices);
      localStorage.setItem('neuro-services', JSON.stringify(updatedServices));
      
      console.log('✅ Serviço excluído com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir serviço:', error);
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      // Dados
      users,
      doctors,
      patients,
      appointments,
      financialRecords,
      services,
      loading,
      error,
      
      // Usuários
      addUser,
      updateUser,
      deleteUser,
      addPatient,
      addDoctor,
      
      // Consultas
      addAppointment,
      updateAppointment,
      deleteAppointment,
      
      // Financeiro
      addFinancialRecord,
      updateFinancialRecord,
      deleteFinancialRecord,
      
      // Serviços
      addService,
      updateService,
      deleteService
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}