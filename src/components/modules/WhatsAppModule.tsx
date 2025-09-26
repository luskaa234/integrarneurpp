"use client";

import React, { useState, useEffect } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  MessageSquare, Send, Trash2, Users, Calendar, Clock, Settings, Plus
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WhatsAppMessage {
  id: string;
  from_clinic: string;
  to_patient: string;
  patient_name: string;
  message: string;
  sent_at: string;
  status: "sent" | "delivered" | "read";
  appointment_id?: string;
}

export function WhatsAppModule() {
  const { user } = useAuth();
  const { appointments, patients, doctors, updateAppointment } = useApp();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<"withAppointment" | "free">("withAppointment");
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [clinicPhone, setClinicPhone] = useState("98974003414");

  // Filtros
  const [filterDate, setFilterDate] = useState("");
  const [filterPatient, setFilterPatient] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");

  const [messageTemplates] = useState([
    "✅ Olá {nome}, sua consulta com {medico} está confirmada para {data} às {horario}. Clínica: {telefone_clinica}",
    "⏰ Olá {nome}, lembramos que você tem consulta amanhã com {medico} às {horario}. Clínica: {telefone_clinica}",
    "🔄 Olá {nome}, sua consulta foi reagendada para {data} às {horario}. Clínica: {telefone_clinica}",
    "⚠️ Olá {nome}, sua consulta de {data} foi cancelada. Entraremos em contato para reagendar. Clínica: {telefone_clinica}",
    "📞 Oi {nome}, somos da clínica! Estamos à disposição para dúvidas ou marcações. Clínica: {telefone_clinica}",
  ]);

  useEffect(() => {
    loadMessages();
    loadSettings();
  }, []);

  const loadMessages = () => {
    const savedMessages = localStorage.getItem("whatsapp-messages");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
      }
    }
  };

  const loadSettings = () => {
    const settings = localStorage.getItem("app-settings");
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.whatsapp_number) {
          setClinicPhone(parsedSettings.whatsapp_number);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }
  };

  const saveSettings = () => {
    const settings = JSON.parse(localStorage.getItem("app-settings") || "{}");
    settings.whatsapp_number = clinicPhone;
    localStorage.setItem("app-settings", JSON.stringify(settings));
    toast.success("✅ Configurações salvas!");
  };

  const sendWhatsAppMessage = async (
    patientPhone: string,
    patientName: string,
    message: string,
    appointmentId?: string
  ) => {
    try {
      if (!patientPhone) {
        toast.error(`❌ ${patientName} não tem telefone cadastrado`);
        return false;
      }

      const cleanPhone = patientPhone.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        toast.error(`❌ Telefone inválido para ${patientName}: ${patientPhone}`);
        return false;
      }

      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(
        message
      )}`;
      window.open(whatsappUrl, "_blank");

      const newMessage: WhatsAppMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        from_clinic: clinicPhone,
        to_patient: cleanPhone,
        patient_name: patientName,
        message,
        sent_at: new Date().toISOString(),
        status: "sent",
        appointment_id: appointmentId,
      };

      const updatedMessages = [newMessage, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem("whatsapp-messages", JSON.stringify(updatedMessages));

      toast.success(`✅ WhatsApp enviado para ${patientName}!`);
      return true;
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error);
      toast.error(`❌ Erro ao enviar WhatsApp para ${patientName}`);
      return false;
    }
  };

  const handleSend = async () => {
    let targetPatient: any = null;
    let appointment: any = null;

    if (mode === "withAppointment" && selectedAppointmentId) {
      appointment = appointments.find((a) => a.id === selectedAppointmentId);
      if (!appointment) return toast.error("❌ Nenhum agendamento selecionado");
      targetPatient = patients.find((p) => p.id === appointment.patient_id);
    } else if (mode === "free" && selectedPatientId) {
      targetPatient = patients.find((p) => p.id === selectedPatientId);
    }

    if (!targetPatient) return toast.error("❌ Nenhum paciente selecionado");
    if (!customMessage.trim()) return toast.error("❌ Digite ou selecione uma mensagem");

    const doctor = appointment ? doctors.find((d) => d.id === appointment.doctor_id) : null;

    const personalizedMessage = customMessage
      .replace("{nome}", targetPatient.name)
      .replace("{telefone_clinica}", clinicPhone)
      .replace("{medico}", doctor ? doctor.name : "Médico não informado")
      .replace(
        "{data}",
        appointment
          ? new Date(appointment.date).toLocaleDateString("pt-BR")
          : "Data não definida"
      )
      .replace("{horario}", appointment ? appointment.time : "Horário não definido");

    await sendWhatsAppMessage(
      targetPatient.phone || "",
      targetPatient.name,
      personalizedMessage,
      appointment?.id
    );
  };

  const deleteMessage = (messageId: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta mensagem do histórico?")) {
      const updatedMessages = messages.filter((m) => m.id !== messageId);
      setMessages(updatedMessages);
      localStorage.setItem("whatsapp-messages", JSON.stringify(updatedMessages));
      toast.success("✅ Mensagem excluída do histórico!");
    }
  };

  // Filtro aplicado
  const filteredAppointments = appointments.filter((apt) => {
    const patient = patients.find((p) => p.id === apt.patient_id);
    const doctor = doctors.find((d) => d.id === apt.doctor_id);

    const matchDate = filterDate ? apt.date.startsWith(filterDate) : true;
    const matchPatient = filterPatient ? apt.patient_id === filterPatient : true;
    const matchDoctor = filterDoctor ? apt.doctor_id === filterDoctor : true;

    return matchDate && matchPatient && matchDoctor && apt.status !== "cancelado";
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📱 WhatsApp Profissional</h1>
          <p className="text-gray-600 mt-2">
            Envio profissional de mensagens automáticas e personalizadas
          </p>
        </div>

        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" /> Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">📱 Enviar WhatsApp</DialogTitle>
                <DialogDescription>
                  Escolha um agendamento ou paciente e selecione a mensagem
                </DialogDescription>
              </DialogHeader>

              {/* Tabs do envio */}
              <Tabs defaultValue="withAppointment" onValueChange={(v) => setMode(v as any)} className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="withAppointment">📅 Com Agendamento</TabsTrigger>
                  <TabsTrigger value="free">👤 Sem Agendamento</TabsTrigger>
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Coluna Esquerda */}
                  <div className="space-y-4">
                    {mode === "withAppointment" ? (
                      <>
                        <div className="flex gap-2">
                          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
                          <select
                            className="border p-2 rounded flex-1"
                            value={filterPatient}
                            onChange={(e) => setFilterPatient(e.target.value)}
                          >
                            <option value="">Todos Pacientes</option>
                            {patients.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <select
                            className="border p-2 rounded flex-1"
                            value={filterDoctor}
                            onChange={(e) => setFilterDoctor(e.target.value)}
                          >
                            <option value="">Todos Médicos</option>
                            {doctors.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                          {filteredAppointments.map((apt) => {
                            const patient = patients.find((p) => p.id === apt.patient_id);
                            const doctor = doctors.find((d) => d.id === apt.doctor_id);
                            return (
                              <div
                                key={apt.id}
                                onClick={() => setSelectedAppointmentId(apt.id)}
                                className={`p-3 cursor-pointer transition ${
                                  selectedAppointmentId === apt.id ? "bg-blue-100 border-l-4 border-blue-600" : "hover:bg-gray-50"
                                }`}
                              >
                                <div className="font-semibold">{patient?.name}</div>
                                <div className="text-sm text-gray-600">
                                  🩺 {doctor?.name} — 📅 {new Date(apt.date).toLocaleDateString("pt-BR")} ⏰ {apt.time}
                                </div>
                              </div>
                            );
                          })}
                          {filteredAppointments.length === 0 && (
                            <p className="p-3 text-gray-500 text-center">Nenhum agendamento encontrado</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label>👥 Paciente</Label>
                        <select
                          className="border p-2 w-full rounded"
                          value={selectedPatientId || ""}
                          onChange={(e) => setSelectedPatientId(e.target.value)}
                        >
                          <option value="">Selecione</option>
                          {patients.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} — {p.phone || "Sem telefone"}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Coluna Direita */}
                  <div className="space-y-4">
                    <Label>📝 Templates</Label>
                    <div className="grid gap-2">
                      {messageTemplates.map((t, i) => (
                        <Card
                          key={i}
                          className={`p-3 cursor-pointer transition ${
                            customMessage === t ? "border-blue-600 bg-blue-50" : "hover:bg-gray-50"
                          }`}
                          onClick={() => setCustomMessage(t)}
                        >
                          <p className="text-sm">{t}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Caixa de mensagem + preview */}
                <div className="mt-6 space-y-3">
                  <Label>✍️ Mensagem Personalizada</Label>
                  <Textarea
                    rows={4}
                    placeholder="Digite ou selecione um template..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />

                  {customMessage && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">📲 Preview da mensagem:</p>
                      <p>{customMessage}</p>
                    </div>
                  )}
                </div>

                {/* Botões */}
                <div className="flex justify-end mt-6 gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleSend}>
                    <Send className="mr-2 h-4 w-4" /> Enviar
                  </Button>
                </div>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setMessages([])}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Histórico
          </Button>
        </div>
      </div>

      {/* HISTÓRICO */}
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>📜 Histórico de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{new Date(m.sent_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell>{m.patient_name}</TableCell>
                      <TableCell>{m.to_patient}</TableCell>
                      <TableCell>{m.message.substring(0, 60)}...</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMessage(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {messages.length === 0 && (
                <p className="text-center py-4 text-gray-500">📭 Nenhuma mensagem</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
