"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Settings,
  FileText,
  MessageSquare,
  LogOut,
  Brain,
  Stethoscope,
  ClipboardList,
  User,
  CalendarCheck,
  AlertTriangle,
  TestTube,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getMenuItems = () => {
    const baseItems = [{ id: "dashboard", label: "Dashboard", icon: LayoutDashboard }];

    switch (user?.role) {
      case "admin":
        return [
          ...baseItems,
          { id: "usuarios", label: "Usuários", icon: Users },
          { id: "medicos", label: "Médicos", icon: Stethoscope },
          { id: "pacientes", label: "Pacientes", icon: Users },
          { id: "agendamento", label: "Agendamento", icon: Calendar },
          { id: "financeiro", label: "Financeiro", icon: DollarSign },
          { id: "prontuarios", label: "Prontuários", icon: FileText },
          { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
          { id: "configuracoes", label: "Configurações", icon: Settings },
          { id: "teste-exclusoes", label: "🧪 Teste Exclusões", icon: TestTube },
        ];

      case "financeiro":
        return [
          ...baseItems,
          { id: "financeiro", label: "Financeiro", icon: DollarSign },
        ];

      case "agendamento":
        return [
          ...baseItems,
          { id: "agendamento", label: "Agendamento", icon: Calendar },
          { id: "pacientes", label: "Pacientes", icon: Users },
          { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
        ];

      case "medico":
        return [
          ...baseItems,
          { id: "minhas-consultas", label: "Minhas Consultas", icon: CalendarCheck },
          { id: "justificar-falta", label: "Justificar Falta", icon: AlertTriangle },
          { id: "prontuarios", label: "Prontuários", icon: FileText },
          { id: "perfil", label: "Meu Perfil", icon: User },
        ];

      case "paciente":
        return [
          { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
          { id: "meus-agendamentos", label: "Meus Agendamentos", icon: Calendar },
          { id: "financeiro-paciente", label: "Financeiro", icon: DollarSign }, // 🔑 isolado
          { id: "meus-prontuarios", label: "Meus Prontuários", icon: FileText },
        ];

      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Botão Mobile */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white/90 shadow rounded-full h-9 w-9 p-0"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
      </div>

      {/* Sidebar Desktop */}
      <div
        className={cn(
          "hidden md:flex flex-col h-screen bg-white border-r shadow-lg transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <Header collapsed={isCollapsed} />
        <MenuList
          menuItems={menuItems}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          collapsed={isCollapsed}
        />
        <Footer user={user} logout={logout} collapsed={isCollapsed} />

        {/* Colapso */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white border rounded-full p-1 shadow hover:bg-gray-100"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Sidebar Mobile */}
      <div
        className={cn(
          "fixed inset-0 z-40 flex md:hidden transition-transform duration-300",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="w-56 bg-white shadow-xl flex flex-col text-sm">
          <Header collapsed={false} />
          <MenuList
            menuItems={menuItems}
            activeSection={activeSection}
            onSectionChange={(id) => {
              onSectionChange(id);
              setIsOpen(false);
            }}
            collapsed={false}
          />
          <Footer user={user} logout={logout} collapsed={false} />
        </div>
        <div className="flex-1 bg-black/20" onClick={() => setIsOpen(false)} />
      </div>
    </>
  );
}

function Header({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-16 items-center border-b px-4 bg-gradient-to-r from-blue-600 to-purple-600">
      <Brain className="h-7 w-7 text-white mr-2" />
      {!collapsed && <span className="text-lg font-bold text-white">Neuro</span>}
    </div>
  );
}

function MenuList({
  menuItems,
  activeSection,
  onSectionChange,
  collapsed,
}: {
  menuItems: any[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  collapsed: boolean;
}) {
  return (
    <ScrollArea className="flex-1 px-2 py-3">
      <div className="space-y-1">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start h-10 text-sm transition-all duration-200",
              activeSection === item.id
                ? "bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-l-4 border-l-blue-600 shadow"
                : "hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50",
              collapsed ? "px-2 justify-center" : "px-3"
            )}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon className="h-5 w-5" />
            {!collapsed && <span className="ml-2">{item.label}</span>}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}

function Footer({
  user,
  logout,
  collapsed,
}: {
  user: any;
  logout: () => void;
  collapsed: boolean;
}) {
  return (
    <div className="border-t p-3 bg-gray-50">
      {!collapsed && (
        <div className="mb-2 text-xs">
          <p className="font-medium text-gray-800 truncate">{user?.name}</p>
          <p className="text-gray-500 capitalize flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
            {user?.role}
          </p>
        </div>
      )}
      <Separator className="mb-2" />
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors h-9 text-sm",
          collapsed && "justify-center"
        )}
        onClick={logout}
      >
        <LogOut className="h-4 w-4" />
        {!collapsed && <span className="ml-1">Sair</span>}
      </Button>
    </div>
  );
}
