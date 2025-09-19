"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- Tipos principais ---
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "financeiro" | "agendamento" | "medico" | "paciente";
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
  status: "agendado" | "confirmado" | "cancelado" | "realizado";
  type: string;
  notes?: string;
  price: number;
  created_at: string;
}

interface FinancialRecord {
  id: string;
  type: "receita" | "despesa";
  amount: number;
  description: string;
  category: string;
  date: string;
  appointment_id?: string;
  status: "pendente" | "pago" | "cancelado";
  created_at: string;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  is_active: boolean;
}

// Tipos auxiliares para inserções
type NewAppointment = Omit<Appointment, "id" | "created_at">;
type NewFinancialRecord = Omit<FinancialRecord, "id" | "created_at">;

// --- Contexto ---
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
  addUser: (user: Omit<User, "id" | "created_at">) => Promise<boolean>;
  updateUser: (id: string, user: Partial<User>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  addPatient: (p: { name: string; phone?: string; email?: string }) => Promise<{ id: string } | null>;
  addDoctor: (d: { name: string; specialty?: string; phone?: string; email?: string }) => Promise<{ id: string } | null>;

  // Consultas
  addAppointment: (appointment: NewAppointment) => Promise<boolean>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;

  // Financeiro
  addFinancialRecord: (record: NewFinancialRecord) => Promise<boolean>;
  updateFinancialRecord: (id: string, record: Partial<FinancialRecord>) => Promise<boolean>;
  deleteFinancialRecord: (id: string) => Promise<boolean>;

  // Serviços
  addService: (service: Omit<Service, "id">) => Promise<boolean>;
  updateService: (id: string, service: Partial<Service>) => Promise<boolean>;
  deleteService: (id: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [services, setServices] = useState<Service[]>([
    { id: "1", name: "Consulta Neurológica", price: 300, duration: 60, is_active: true },
    { id: "2", name: "Avaliação Neuropsicológica", price: 450, duration: 90, is_active: true },
    { id: "3", name: "Terapia Cognitiva", price: 200, duration: 50, is_active: true },
    { id: "4", name: "Eletroencefalograma", price: 250, duration: 30, is_active: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados derivados
  const doctors = users.filter((u) => u.role === "medico");
  const patients = users.filter((u) => u.role === "paciente");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersData, appointmentsData, financialData] = await Promise.all([
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("appointments").select("*").order("date", { ascending: false }),
        supabase.from("financial_records").select("*").order("date", { ascending: false }),
      ]);

      if (!usersData.error && usersData.data) setUsers(usersData.data);
      if (!appointmentsData.error && appointmentsData.data) setAppointments(appointmentsData.data);
      if (!financialData.error && financialData.data) setFinancialRecords(financialData.data);

      if (typeof window !== "undefined") {
        const savedServices = localStorage.getItem("neuro-services");
        if (savedServices) setServices(JSON.parse(savedServices));
      }
    } catch (err) {
      console.error("❌ Erro ao carregar dados:", err);
      setError("Erro ao carregar dados do sistema");
    } finally {
      setLoading(false);
    }
  };

  // Usuários
  const addUser = async (userData: Omit<User, "id" | "created_at">): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("users").insert([userData]).select().single();
      if (error || !data) return false;
      setUsers((prev) => [data, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  const updateUser = async (id: string, userUpdate: Partial<User>): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("users").update(userUpdate).eq("id", id).select().single();
      if (error || !data) return false;
      setUsers((prev) => prev.map((u) => (u.id === id ? data : u)));
      return true;
    } catch {
      return false;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", id);
      if (error) return false;
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  const addPatient = async (p: { name: string; phone?: string; email?: string }) => {
    if (!p.name?.trim()) return null;
    const { data, error } = await supabase
      .from("users")
      .insert([{ name: p.name.trim(), email: p.email ?? "", phone: p.phone ?? "", role: "paciente", is_active: true }])
      .select()
      .single();
    if (error || !data) return null;
    setUsers((prev) => [data, ...prev]);
    return { id: data.id };
  };

  const addDoctor = async (d: { name: string; specialty?: string; phone?: string; email?: string }) => {
    if (!d.name?.trim()) return null;
    const { data, error } = await supabase
      .from("users")
      .insert([{ name: d.name.trim(), email: d.email ?? "", phone: d.phone ?? "", role: "medico", is_active: true, specialty: d.specialty ?? "Geral" }])
      .select()
      .single();
    if (error || !data) return null;
    setUsers((prev) => [data, ...prev]);
    return { id: data.id };
  };

  // Consultas
  const addAppointment = async (appointmentData: NewAppointment): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("appointments").insert([appointmentData]).select().single();
      if (error || !data) return false;
      setAppointments((prev) => [data, ...prev]);

      const financialRecord: NewFinancialRecord = {
        type: "receita",
        amount: appointmentData.price,
        description: `Consulta - ${appointmentData.type}`,
        category: "Consulta",
        date: appointmentData.date,
        status: "pendente",
        appointment_id: data.id,
      };
      await addFinancialRecord(financialRecord);
      return true;
    } catch {
      return false;
    }
  };

  const updateAppointment = async (id: string, appointmentUpdate: Partial<Appointment>): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("appointments").update(appointmentUpdate).eq("id", id).select().single();
      if (error || !data) return false;
      setAppointments((prev) => prev.map((apt) => (apt.id === id ? data : apt)));
      return true;
    } catch {
      return false;
    }
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) return false;
      setAppointments((prev) => prev.filter((apt) => apt.id !== id));
      await supabase.from("financial_records").delete().eq("appointment_id", id);
      setFinancialRecords((prev) => prev.filter((r) => r.appointment_id !== id));
      return true;
    } catch {
      return false;
    }
  };

  // Financeiro
  const addFinancialRecord = async (recordData: NewFinancialRecord): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("financial_records").insert([recordData]).select().single();
      if (error || !data) return false;
      setFinancialRecords((prev) => [data, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  const updateFinancialRecord = async (id: string, recordUpdate: Partial<FinancialRecord>): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from("financial_records").update(recordUpdate).eq("id", id).select().single();
      if (error || !data) return false;
      setFinancialRecords((prev) => prev.map((r) => (r.id === id ? data : r)));
      return true;
    } catch {
      return false;
    }
  };

  const deleteFinancialRecord = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from("financial_records").delete().eq("id", id);
      if (error) return false;
      setFinancialRecords((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch {
      return false;
    }
  };

  // Serviços
  const addService = async (service: Omit<Service, "id">): Promise<boolean> => {
    try {
      const newService = { ...service, id: Date.now().toString() + Math.random().toString(36).slice(2) };
      const updated = [...services, newService];
      setServices(updated);
      if (typeof window !== "undefined") localStorage.setItem("neuro-services", JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const updateService = async (id: string, serviceUpdate: Partial<Service>): Promise<boolean> => {
    try {
      const updated = services.map((s) => (s.id === id ? { ...s, ...serviceUpdate } : s));
      setServices(updated);
      if (typeof window !== "undefined") localStorage.setItem("neuro-services", JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    try {
      const updated = services.filter((s) => s.id !== id);
      setServices(updated);
      if (typeof window !== "undefined") localStorage.setItem("neuro-services", JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        users,
        doctors,
        patients,
        appointments,
        financialRecords,
        services,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        addPatient,
        addDoctor,
        addAppointment,
        updateAppointment,
        deleteAppointment,
        addFinancialRecord,
        updateFinancialRecord,
        deleteFinancialRecord,
        addService,
        updateService,
        deleteService,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
}
