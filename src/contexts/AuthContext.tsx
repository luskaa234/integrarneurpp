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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('neuro-integrar-user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
      localStorage.removeItem('neuro-integrar-user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // Buscar usuário diretamente na tabela users (SEM usar Supabase Auth)
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !userData) {
        toast.error('Email não encontrado');
        return false;
      }

      if (!userData.is_active) {
        toast.error('Usuário inativo');
        return false;
      }

      // Verificação simples de senha (contém "neuro")
      if (!password.toLowerCase().includes('neuro')) {
        toast.error('Senha incorreta');
        return false;
      }

      // Criar sessão local
      const userSession: User = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar_url: userData.avatar_url,
        created_at: userData.created_at,
        is_active: userData.is_active,
        phone: userData.phone,
        cpf: userData.cpf,
        birth_date: userData.birth_date,
        address: userData.address,
        crm: userData.crm,
        specialty: userData.specialty
      };

      localStorage.setItem('neuro-integrar-user', JSON.stringify(userSession));
      setUser(userSession);
      
      toast.success(`Bem-vindo, ${userData.name}!`);
      return true;

    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro interno');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('neuro-integrar-user');
    setUser(null);
    toast.success('Logout realizado!');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}