"use client";

import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBr from "@fullcalendar/core/locales/pt-br";

// UI usa "agendado", BD usa "pendente"
type UIStatus = "agendado" | "confirmado" | "realizado" | "cancelado";
type DBStatus = "pendente" | "confirmado" | "realizado" | "cancelado";

const toDbStatus = (s: UIStatus): DBStatus => (s === "agendado" ? "pendente" : s);
const toUiStatus = (s: DBStatus | UIStatus | string): UIStatus =>
  s === "pendente" ? "agendado" : (s as UIStatus);

export default function AgendaCalendario() {
  const {
    appointments,
    patients,
    doctors,
    services,
    addAppointment,
    updateAppointment,
    deleteAppointment,
  } = useApp();

  // ----------------- estado UI -----------------
  const [busca, setBusca] = useState("");
  const [filtroMedico, setFiltroMedico] = useState<string>("all");
  const [filtroStatus, setFiltroStatus] = useState<UIStatus | "all">("all");
  const [filtroData, setFiltroData] = useState("");
  const [eventoSelecionado, setEventoSelecionado] = useState<any>(null);
  const [adicionando, setAdicionando] = useState(false);
  const [editando, setEditando] = useState(false);

  // ----------------- novo agendamento -----------------
  const [novoAgendamento, setNovoAgendamento] = useState<{
    date: string;
    time: string;
    patient_id: string;
    doctor_id: string;
    type: string;
    price: string;
    status: UIStatus;
    notes?: string;
    service_id?: string;
  }>({
    date: "",
    time: "",
    patient_id: "",
    doctor_id: "",
    type: "",
    price: "",
    status: "agendado",
    notes: "",
    service_id: undefined,
  });

  // ----------------- edição rápida -----------------
  const [editForm, setEditForm] = useState<{
    date: string;
    time: string;
    patient_id: string;
    doctor_id: string;
    type: string;
    price: string;
    status: UIStatus;
    notes?: string;
    service_id?: string;
  }>({
    date: "",
    time: "",
    patient_id: "",
    doctor_id: "",
    type: "",
    price: "",
    status: "agendado",
    notes: "",
    service_id: undefined,
  });

  // helpers de nomes
  const getNomePaciente = (id: string) =>
    patients.find((p) => p.id === id)?.name || "Paciente";
  const getNomeMedico = (id: string) =>
    doctors.find((d) => d.id === id)?.name || "Médico";

  // ----------------- helpers de data/tempo -----------------
  const pad = (n: number) => String(n).padStart(2, "0");

  const hhmmToHHmmss = (t: string) =>
    t && t.length === 5 ? `${t}:00` : t || "00:00:00";

  const toLocalDate = (dateStr: string, timeStr: string) => {
    const [H, M, S] = hhmmToHHmmss(timeStr)
      .split(":")
      .map((x) => parseInt(x || "0", 10));
    return new Date(`${dateStr}T${pad(H)}:${pad(M)}:${pad(S)}`);
  };

  const addMinutesLocal = (dateStr: string, timeStr: string, minutes = 60) => {
    const d = toLocalDate(dateStr, timeStr);
    d.setMinutes(d.getMinutes() + minutes);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const formatStartISO = (dateStr: string, timeStr: string) =>
    `${dateStr}T${hhmmToHHmmss(timeStr)}`;

  const serviceDurationByName = (name: string) =>
    services.find((s) => s.name === name)?.duration ?? 60;

  const serviceDurationById = (id?: string) =>
    id ? services.find((s) => s.id === id)?.duration ?? 60 : 60;

  // ----------------- filtros -----------------
  const baseFiltrada = useMemo(() => {
    return appointments.filter((apt) => {
      const paciente = getNomePaciente(apt.patient_id).toLowerCase();
      const medico = getNomeMedico(apt.doctor_id).toLowerCase();

      // normaliza status que veio do BD para o da UI
      const statusUI = toUiStatus(apt.status);

      const buscaOk =
        !busca ||
        paciente.includes(busca.toLowerCase()) ||
        medico.includes(busca.toLowerCase()) ||
        apt.type.toLowerCase().includes(busca.toLowerCase());
      const medicoOk =
        filtroMedico === "all" ? true : apt.doctor_id === filtroMedico;
      const statusOk =
        filtroStatus === "all" ? true : statusUI === filtroStatus;
      const dataOk = !filtroData || apt.date === filtroData;
      return buscaOk && medicoOk && statusOk && dataOk;
    });
  }, [appointments, busca, filtroMedico, filtroStatus, filtroData]);

  const contagem = useMemo(() => {
    const init: Record<UIStatus, number> = {
      agendado: 0,
      confirmado: 0,
      realizado: 0,
      cancelado: 0,
    };
    return baseFiltrada.reduce((acc, a) => {
      const statusUI = toUiStatus(a.status);
      acc[statusUI] += 1;
      return acc;
    }, init);
  }, [baseFiltrada]);

  // ----------------- eventos p/ FullCalendar -----------------
  const eventos = useMemo(() => {
    return baseFiltrada.map((apt) => {
      const start = formatStartISO(apt.date, apt.time);
      const durMin = serviceDurationByName(apt.type);
      const end = addMinutesLocal(apt.date, apt.time, durMin);
      const statusUI = toUiStatus(apt.status);

      return {
        id: apt.id,
        title: `${getNomePaciente(apt.patient_id)} • ${apt.type}`,
        start,
        end,
        allDay: false,
        extendedProps: { ...apt, status: statusUI }, // carrega já normalizado para UI
        backgroundColor:
          statusUI === "confirmado"
            ? "#A78BFA"
            : statusUI === "realizado"
            ? "#34D399"
            : statusUI === "cancelado"
            ? "#F87171"
            : "#FBBF24",
        borderColor: "transparent",
        textColor: "#1F2937",
        classNames: ["font-medium", "text-sm"],
      };
    });
  }, [baseFiltrada, patients, services]);

  // ----------------- conflito médico/horário -----------------
  const temConflito = (
    doctor_id: string,
    date: string,
    time: string,
    durationMin: number,
    ignoreId?: string
  ) => {
    const novoStart = toLocalDate(date, time);
    const novoEnd = toLocalDate(date, time);
    novoEnd.setMinutes(novoEnd.getMinutes() + durationMin);

    const overlap = (a1: Date, a2: Date, b1: Date, b2: Date) =>
      a1 < b2 && a2 > b1;

    return appointments.some((apt) => {
      if (ignoreId && apt.id === ignoreId) return false;
      if (apt.doctor_id !== doctor_id || apt.date !== date) return false;
      const dur = serviceDurationByName(apt.type);
      const exStart = toLocalDate(apt.date, apt.time);
      const exEnd = toLocalDate(apt.date, apt.time);
      exEnd.setMinutes(exEnd.getMinutes() + dur);
      return overlap(novoStart, novoEnd, exStart, exEnd);
    });
  };

  // ----------------- salvar novo agendamento -----------------
  const salvarNovo = async () => {
    const {
      date,
      time,
      patient_id,
      doctor_id,
      type,
      price,
      status,
      notes,
      service_id,
    } = novoAgendamento;

    if (!date || !time || !patient_id || !doctor_id || !type) {
      toast.error("❌ Preencha todos os campos obrigatórios.");
      return;
    }

    const duration = service_id
      ? serviceDurationById(service_id)
      : serviceDurationByName(type);

    if (temConflito(doctor_id, date, time, duration)) {
      toast.error(
        "⚠️ Conflito: já existe um agendamento para este médico neste horário."
      );
      return;
    }

    const sucesso = await addAppointment({
      date,
      time,
      patient_id,
      doctor_id,
      type,
      price: parseFloat(price) || 0,
      status: toDbStatus(status), // <-- envia no formato do BD
      notes,
    } as any);

    if (sucesso) {
      toast.success("✅ Novo agendamento criado!");
      setNovoAgendamento({
        date: "",
        time: "",
        patient_id: "",
        doctor_id: "",
        type: "",
        price: "",
        status: "agendado",
        notes: "",
        service_id: undefined,
      });
      setAdicionando(false);
    } else {
      toast.error("❌ Erro ao criar agendamento.");
    }
  };

  // ----------------- salvar edição rápida -----------------
  const salvarEdicao = async () => {
    if (!eventoSelecionado) return;

    const {
      date,
      time,
      patient_id,
      doctor_id,
      type,
      price,
      status,
      notes,
      service_id,
    } = editForm;

    if (!date || !time || !patient_id || !doctor_id || !type) {
      toast.error("❌ Preencha todos os campos obrigatórios.");
      return;
    }

    const duration = service_id
      ? serviceDurationById(service_id)
      : serviceDurationByName(type);

    if (temConflito(doctor_id, date, time, duration, eventoSelecionado.id)) {
      toast.error(
        "⚠️ Conflito: já existe um agendamento para este médico neste horário."
      );
      return;
    }

    // aqui tipamos para o formato do BD (DBStatus) e evitamos TS2322
    const statusDb: DBStatus = toDbStatus(status);

    const success = await updateAppointment(String(eventoSelecionado.id), {
      date,
      time,
      patient_id,
      doctor_id,
      type,
      price: parseFloat(price) || 0,
      status: statusDb, // <-- compatível com o contexto/BD
      notes,
    });

    if (success) {
      toast.success("✅ Agendamento atualizado!");
      setEditando(false);
      // reflete no painel usando o status da UI
      const statusUi = toUiStatus(statusDb);
      setEventoSelecionado((old: any) => ({
        ...(old ?? {}),
        date,
        time,
        patient_id,
        doctor_id,
        type,
        price: parseFloat(price) || 0,
        status: statusUi,
        notes,
      }));
    } else {
      toast.error("❌ Erro ao atualizar agendamento.");
    }
  };

  // ----------------- UI -----------------
  const statusChips: { key: UIStatus; label: string; dot: string }[] = [
    { key: "agendado", label: "Agendado", dot: "🟡" },
    { key: "confirmado", label: "Confirmado", dot: "💜" },
    { key: "realizado", label: "Realizado", dot: "💚" },
    { key: "cancelado", label: "Cancelado", dot: "❤️" },
  ];

  return (
    <div className="flex h-[85vh] bg-gradient-to-r from-purple-50 to-purple-100 border rounded-xl overflow-hidden shadow-md">
      {/* Coluna esquerda - Filtros */}
      <aside className="w-80 bg-white border-r border-gray-200 p-5 space-y-5">
        <h2 className="text-lg font-semibold text-purple-700">🔎 Filtros</h2>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar paciente, médico ou tipo..."
            className="pl-9 border-purple-300 focus:ring-purple-500"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Médico */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Médico</label>
          <Select
            value={filtroMedico}
            onValueChange={(val) => setFiltroMedico(val)}
          >
            <SelectTrigger className="border-purple-300 focus:ring-purple-500">
              <SelectValue placeholder="Selecione o médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {doctors.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {statusChips.map(({ key, label, dot }) => (
              <button
                key={key}
                onClick={() =>
                  setFiltroStatus((prev) => (prev === key ? "all" : key))
                }
                className={[
                  "rounded-lg border px-3 py-2 text-left transition",
                  filtroStatus === key
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-200 hover:bg-gray-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {dot} {label}
                  </span>
                  <span className="text-xs font-semibold text-gray-500">
                    {key === "agendado"
                      ? contagem.agendado
                      : key === "confirmado"
                      ? contagem.confirmado
                      : key === "realizado"
                      ? contagem.realizado
                      : contagem.cancelado}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500">Data</label>
          <Input
            type="date"
            value={filtroData}
            onChange={(e) => setFiltroData(e.target.value)}
            className="border-purple-300 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setAdicionando(true)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-md"
          >
            <Plus className="h-4 w-4 mr-1" /> Novo Agendamento
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setBusca("");
              setFiltroMedico("all");
              setFiltroStatus("all");
              setFiltroData("");
            }}
          >
            Limpar
          </Button>
        </div>
      </aside>

      {/* Coluna central - Calendário */}
      <main className="flex-1 p-4 bg-white">
        <FullCalendar
          key={`${appointments.length}-${filtroMedico}-${filtroStatus}-${filtroData}-${busca}`}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth" // sempre começa no mês
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locales={[ptBr]}
          locale="pt-br"
          events={eventos}
          height="100%"
          nowIndicator={true}
          dayMaxEventRows={3}
          firstDay={1}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          eventClick={(info) => setEventoSelecionado(info.event.extendedProps)}
          eventClassNames={() => ["rounded-md", "shadow-sm"]}
        />
      </main>

      {/* Coluna direita - Detalhes / Formulário */}
      {(eventoSelecionado || adicionando) && (
        <aside className="w-[380px] bg-white border-l border-gray-200 p-5 flex flex-col shadow-inner overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-purple-700">
              {adicionando
                ? "➕ Novo Agendamento"
                : editando
                ? "✏️ Edição Rápida"
                : "📋 Detalhes"}
            </h2>
            <button
              onClick={() => {
                setEventoSelecionado(null);
                setAdicionando(false);
                setEditando(false);
              }}
            >
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </button>
          </div>

          {adicionando ? (
            // ================== FORM NOVO ==================
            <div className="space-y-3">
              {/* Paciente */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Paciente*</label>
                <Select
                  value={novoAgendamento.patient_id || "none"}
                  onValueChange={(val) =>
                    setNovoAgendamento((s) => ({
                      ...s,
                      patient_id: val === "none" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Médico */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Médico*</label>
                <Select
                  value={novoAgendamento.doctor_id || "none"}
                  onValueChange={(val) =>
                    setNovoAgendamento((s) => ({
                      ...s,
                      doctor_id: val === "none" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Serviço / Tipo */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Serviço</label>
                <Select
                  value={novoAgendamento.service_id || "none"}
                  onValueChange={(val) => {
                    if (val === "none") {
                      setNovoAgendamento((s) => ({
                        ...s,
                        service_id: undefined,
                        type: "",
                        price: "",
                      }));
                      return;
                    }
                    const svc = services.find((s) => s.id === val);
                    setNovoAgendamento((s) => ({
                      ...s,
                      service_id: val,
                      type: svc?.name || "",
                      price:
                        svc?.price !== undefined ? String(svc.price) : s.price,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} • {s.duration}min • R$ {s.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <Input
                type="text"
                placeholder="Tipo de consulta*"
                value={novoAgendamento.type}
                onChange={(e) =>
                  setNovoAgendamento((s) => ({ ...s, type: e.target.value }))
                }
              />

              {/* Data e hora */}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={novoAgendamento.date}
                  onChange={(e) =>
                    setNovoAgendamento((s) => ({ ...s, date: e.target.value }))
                  }
                />
                <Input
                  type="time"
                  value={novoAgendamento.time}
                  onChange={(e) =>
                    setNovoAgendamento((s) => ({ ...s, time: e.target.value }))
                  }
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">
                  Status do agendamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusChips.map(({ key, label, dot }) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() =>
                        setNovoAgendamento((s) => ({ ...s, status: key }))
                      }
                      className={[
                        "rounded-lg border px-3 py-2 text-left transition",
                        novoAgendamento.status === key
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {dot} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor */}
              <Input
                type="number"
                placeholder="Valor (R$)"
                value={novoAgendamento.price}
                onChange={(e) =>
                  setNovoAgendamento((s) => ({ ...s, price: e.target.value }))
                }
              />

              {/* Observações */}
              <Textarea
                placeholder="Observações (opcional)"
                value={novoAgendamento.notes}
                onChange={(e) =>
                  setNovoAgendamento((s) => ({ ...s, notes: e.target.value }))
                }
              />

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={salvarNovo}
              >
                Salvar
              </Button>
            </div>
          ) : editando ? (
            // ================== FORM EDIÇÃO RÁPIDA ==================
            <div className="space-y-3">
              {/* Paciente */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Paciente*</label>
                <Select
                  value={editForm.patient_id || "none"}
                  onValueChange={(val) =>
                    setEditForm((s) => ({
                      ...s,
                      patient_id: val === "none" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Médico */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Médico*</label>
                <Select
                  value={editForm.doctor_id || "none"}
                  onValueChange={(val) =>
                    setEditForm((s) => ({
                      ...s,
                      doctor_id: val === "none" ? "" : val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o médico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Selecione</SelectItem>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Serviço / Tipo */}
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Serviço</label>
                <Select
                  value={editForm.service_id || "none"}
                  onValueChange={(val) => {
                    if (val === "none") {
                      setEditForm((s) => ({
                        ...s,
                        service_id: undefined,
                        type: s.type,
                      }));
                      return;
                    }
                    const svc = services.find((s) => s.id === val);
                    setEditForm((s) => ({
                      ...s,
                      service_id: val,
                      type: svc?.name || s.type,
                      price:
                        svc?.price !== undefined ? String(svc.price) : s.price,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} • {s.duration}min • R$ {s.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo */}
              <Input
                type="text"
                placeholder="Tipo de consulta*"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, type: e.target.value }))
                }
              />

              {/* Data e hora */}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, date: e.target.value }))
                  }
                />
                <Input
                  type="time"
                  value={editForm.time}
                  onChange={(e) =>
                    setEditForm((s) => ({ ...s, time: e.target.value }))
                  }
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs text-gray-500">
                  Status do agendamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {statusChips.map(({ key, label, dot }) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() =>
                        setEditForm((s) => ({ ...s, status: key }))
                      }
                      className={[
                        "rounded-lg border px-3 py-2 text-left transition",
                        editForm.status === key
                          ? "border-purple-600 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:bg-gray-50",
                      ].join(" ")}
                    >
                      {dot} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor */}
              <Input
                type="number"
                placeholder="Valor (R$)"
                value={editForm.price}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, price: e.target.value }))
                }
              />

              {/* Observações */}
              <Textarea
                placeholder="Observações (opcional)"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm((s) => ({ ...s, notes: e.target.value }))
                }
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={salvarEdicao}
                >
                  Salvar alterações
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            // ================== DETALHES ==================
            <>
              <p>
                <strong>Paciente:</strong>{" "}
                {getNomePaciente(eventoSelecionado.patient_id)}
              </p>
              <p>
                <strong>Médico:</strong>{" "}
                {getNomeMedico(eventoSelecionado.doctor_id)}
              </p>
              <p>
                <strong>Data:</strong> {eventoSelecionado.date}
              </p>
              <p>
                <strong>Hora:</strong> {eventoSelecionado.time}
              </p>
              <p>
                <strong>Tipo:</strong> {eventoSelecionado.type}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {toUiStatus(eventoSelecionado.status)}
              </p>
              <p>
                <strong>Valor:</strong> R$ {eventoSelecionado.price}
              </p>
              {eventoSelecionado.notes ? (
                <p className="mt-2">
                  <strong>Obs.:</strong> {eventoSelecionado.notes}
                </p>
              ) : null}

              <div className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-purple-600 text-purple-700 hover:bg-purple-50"
                  onClick={() => {
                    const e = eventoSelecionado;
                    setEditForm({
                      date: e.date || "",
                      time: e.time || "",
                      patient_id: e.patient_id || "",
                      doctor_id: e.doctor_id || "",
                      type: e.type || "",
                      price:
                        e.price !== undefined && e.price !== null
                          ? String(e.price)
                          : "",
                      status: toUiStatus(e.status),
                      notes: e.notes || "",
                      service_id: undefined,
                    });
                    setEditando(true);
                  }}
                >
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={async () => {
                    if (confirm("Excluir este agendamento?")) {
                      const ok = await deleteAppointment(eventoSelecionado.id);
                      if (ok) {
                        toast.success("Agendamento excluído.");
                        setEventoSelecionado(null);
                      } else {
                        toast.error("Erro ao excluir agendamento.");
                      }
                    }
                  }}
                >
                  Excluir
                </Button>
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
}
