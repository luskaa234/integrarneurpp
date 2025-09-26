"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// --- Tipos principais ---
export interface User {
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

// 🔹 Alinhar com o banco: 'pendente' | 'confirmado' | 'cancelado' | 'realizado'
export type AppointmentStatus = "pendente" | "confirmado" | "cancelado" | "realizado";

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  status: AppointmentStatus; // <- corrigido
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
export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  description: string;
  notes?: string;
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
type NewMedicalRecord = Omit<MedicalRecord, "id" | "created_at">;


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

  medicalRecords: MedicalRecord[]; // ✅ lista de prontuários

// Métodos de prontuários
addMedicalRecord: (record: NewMedicalRecord) => Promise<boolean>;
updateMedicalRecord: (id: string, record: Partial<MedicalRecord>) => Promise<boolean>;
deleteMedicalRecord: (id: string) => Promise<boolean>;


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
      const { data, error } = await supabase
        .from("users")
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error("❌ Erro Supabase addUser:", error.message, error.details);
        return false;
      }

      if (!data) {
        console.error("❌ Nenhum dado retornado ao inserir usuário");
        return false;
      }

      setUsers((prev) => [data, ...prev]);
      return true;
    } catch (err) {
      console.error("❌ Erro inesperado addUser:", err);
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

    try {
      // 1) cria em users
      const { data: user, error: userError } = await supabase
        .from("users")
        .insert([
          {
            name: p.name.trim(),
            email: p.email ?? "",
            phone: p.phone ?? "",
            role: "paciente",
            is_active: true,
          },
        ])
        .select()
        .single();

      if (userError || !user) {
        console.error("❌ Erro ao inserir em users:", userError?.message);
        return null;
      }

      // 2) cria também em patients (FK user_id)
      const { error: patientError } = await supabase
        .from("patients")
        .insert([
          {
            user_id: user.id,
            created_at: new Date().toISOString(),
          },
        ]);

      if (patientError) {
        console.error("⚠️ Usuário criado, mas erro ao inserir em patients:", patientError.message);
        // opcional: você pode manter o user criado mesmo assim
        return null;
      }

      setUsers((prev) => [user, ...prev]);
      return { id: user.id };
    } catch (err) {
      console.error("❌ Erro inesperado addPatient:", err);
      return null;
    }
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
    // normaliza status para bater com o CHECK do banco
    const ALLOWED: AppointmentStatus[] = ["pendente", "confirmado", "cancelado", "realizado"];
    const raw = (appointmentData as any).status;
    const cleaned = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    const safeStatus: AppointmentStatus = (ALLOWED as string[]).includes(cleaned)
      ? (cleaned as AppointmentStatus)
      : "pendente";

    const payload: NewAppointment = { ...appointmentData, status: safeStatus };

    // 1) Pré-checagem de conflito (melhor UX)
    const { data: conflicts, error: conflictErr } = await supabase
      .from("appointments")
      .select("id, status")
      .eq("doctor_id", payload.doctor_id)
      .eq("date", payload.date)
      .eq("time", payload.time)
      .neq("status", "cancelado")
      .limit(1);

    if (conflictErr) {
      console.error("⚠️ Erro ao checar conflito:", conflictErr.message, conflictErr.details);
      // segue adiante; o índice único no banco ainda protege corrida
    } else if (conflicts && conflicts.length > 0) {
      toast.error("Conflito: esse médico já tem agendamento nesse horário.");
      return false;
    }

    // 2) Inserção (o índice único garante consistência)
    const { data, error } = await supabase
      .from("appointments")
      .insert([payload])
      .select()
      .single();

    if (error) {
      // 23505 = unique_violation (Postgres)
      if ((error as any).code === "23505") {
        toast.error("Conflito: esse horário já foi reservado para o médico.");
      } else {
        console.error("❌ Erro Supabase addAppointment:", error.message, error.details);
        toast.error("Erro ao criar agendamento.");
      }
      return false;
    }
    if (!data) {
      console.error("❌ Nenhum dado retornado ao criar agendamento");
      toast.error("Erro ao criar agendamento.");
      return false;
    }

    setAppointments((prev) => [data, ...prev]);

    await addFinancialRecord({
      type: "receita",
      amount: payload.price,
      description: `Consulta - ${payload.type}`,
      category: "Consulta",
      date: payload.date,
      status: "pendente",
      appointment_id: data.id,
    });

    toast.success("Agendamento criado!");
    return true;
  } catch (err) {
    console.error("❌ Erro inesperado addAppointment:", err);
    toast.error("Erro ao criar agendamento.");
    return false;
  }
};


  // 🔹 Implementações que estavam faltando
  const updateAppointment = async (id: string, appointmentUpdate: Partial<Appointment>): Promise<boolean> => {
    try {
      const ALLOWED: AppointmentStatus[] = ["pendente", "confirmado", "cancelado", "realizado"];
      let patch: Partial<Appointment> = { ...appointmentUpdate };

      if (typeof patch.status === "string") {
        const cleaned = patch.status.trim().toLowerCase() as AppointmentStatus;
        if (!(ALLOWED as string[]).includes(cleaned)) {
          // Se vier inválido, força 'pendente'
          patch.status = "pendente";
        } else {
          patch.status = cleaned;
        }
      }

      const { data, error } = await supabase
        .from("appointments")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

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

      // também remove financeiro vinculado
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

    // 🔹 Novos para prontuários
    medicalRecords,
    addMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
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
