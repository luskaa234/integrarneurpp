"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  DollarSign, 
  Settings, 
  UserPlus,
  FileText,
  MessageSquare,
  LogOut,
  Brain,
  Stethoscope,
  ClipboardList,
  User,
  CalendarCheck,
  AlertTriangle,
  TestTube
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user, logout } = useAuth();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ];

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { id: 'usuarios', label: 'Usuários', icon: Users },
          { id: 'medicos', label: 'Médicos', icon: Stethoscope },
          { id: 'pacientes', label: 'Pacientes', icon: Users },
          { id: 'agendamento', label: 'Agendamento', icon: Calendar },
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
          { id: 'prontuarios', label: 'Prontuários', icon: FileText },
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
          { id: 'configuracoes', label: 'Configurações', icon: Settings },
          { id: 'teste-exclusoes', label: '🧪 Teste Exclusões', icon: TestTube }
        ];
      
      case 'financeiro':
        return [
          ...baseItems,
          { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
          { id: 'teste-exclusoes', label: '🧪 Teste Exclusões', icon: TestTube }
        ];
      
      case 'agendamento':
        return [
          ...baseItems,
          { id: 'agendamento', label: 'Agendamento', icon: Calendar },
          { id: 'pacientes', label: 'Pacientes', icon: Users },
          { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
          { id: 'teste-exclusoes', label: '🧪 Teste Exclusões', icon: TestTube }
        ];
      
      case 'medico':
        return [
          ...baseItems,
          { id: 'minhas-consultas', label: 'Minhas Consultas', icon: CalendarCheck },
          { id: 'justificar-falta', label: 'Justificar Falta', icon: AlertTriangle },
          { id: 'prontuarios', label: 'Prontuários', icon: FileText },
          { id: 'perfil', label: 'Meu Perfil', icon: User }
        ];
      
      case 'paciente':
        return [
          ...baseItems,
          { id: 'perfil', label: 'Meu Perfil', icon: User },
          { id: 'meus-agendamentos', label: 'Meus Agendamentos', icon: Calendar },
          { id: 'minha-ficha', label: 'Minha Ficha', icon: FileText },
          { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardList }
        ];
      
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r shadow-lg">
      <div className="flex h-16 items-center border-b px-6 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center gap-2">
          <Brain className="h-8 w-8 text-white" />
          <span className="text-xl font-bold text-white">Neuro Integrar</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeSection === item.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start transition-all duration-200",
                activeSection === item.id 
                  ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-l-4 border-l-blue-600 shadow-md" 
                  : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50"
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t p-4 bg-gray-50">
        <div className="mb-3 text-sm">
          <p className="font-medium text-gray-800">{user?.name}</p>
          <p className="text-gray-500 capitalize flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            {user?.role}
          </p>
        </div>
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair do Sistema
        </Button>
      </div>
    </div>
  );
}