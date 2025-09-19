"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";

export function ExcelScheduleGrid() {
  const { appointments, patients, doctors, addAppointment, updateAppointment, deleteAppointment } = useApp();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [newData, setNewData] = useState<any>({
    date: "",
    time: "",
    patient_id: "",
    doctor_id: "",
    type: "",
    price: 0,
    status: "agendado",
  });

  // Helpers
  const getPatientName = (id: string) => patients.find((p) => p.id === id)?.name || "Paciente não encontrado";
  const getDoctorName = (id: string) => doctors.find((d) => d.id === id)?.name || "Médico não encontrado";

  // Validação de conflito de horários
  const hasConflict = (date: string, time: string, doctorId: string, ignoreId?: string) => {
    return appointments.some(
      (apt) =>
        apt.date === date &&
        apt.time === time &&
        apt.doctor_id === doctorId &&
        apt.id !== ignoreId &&
        apt.status !== "cancelado"
    );
  };

  // Novo agendamento
  const handleSaveNew = async () => {
    if (!newData.date || !newData.time || !newData.patient_id || !newData.doctor_id || !newData.type) {
      toast.error("❌ Preencha todos os campos obrigatórios.");
      return;
    }
    if (hasConflict(newData.date, newData.time, newData.doctor_id)) {
      toast.error("⚠️ Conflito: já existe agendamento para esse médico neste horário!");
      return;
    }
    const success = await addAppointment(newData);
    if (success) {
      toast.success("✅ Novo agendamento criado!");
      setNewData({ date: "", time: "", patient_id: "", doctor_id: "", type: "", price: 0, status: "agendado" });
      setIsAdding(false);
    } else {
      toast.error("❌ Erro ao criar agendamento.");
    }
  };

  // Editar agendamento
  const handleEdit = (appointment: any) => {
    setEditingId(appointment.id);
    setEditData(appointment);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (hasConflict(editData.date, editData.time, editData.doctor_id, editingId)) {
      toast.error("⚠️ Conflito: já existe agendamento para esse médico neste horário!");
      return;
    }
    const success = await updateAppointment(editingId, editData);
    if (success) {
      toast.success("✅ Consulta atualizada com sucesso!");
      setEditingId(null);
    } else {
      toast.error("❌ Erro ao salvar alterações.");
    }
  };

  const handleChangeEdit = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  // Filtro avançado
  const filteredAppointments = appointments.filter((apt) => {
    const patientName = getPatientName(apt.patient_id).toLowerCase();
    const doctorName = getDoctorName(apt.doctor_id).toLowerCase();
    return (
      (searchTerm === "" ||
        patientName.includes(searchTerm.toLowerCase()) ||
        doctorName.includes(searchTerm.toLowerCase()) ||
        apt.type.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterDoctor === "" || apt.doctor_id === filterDoctor) &&
      (filterStatus === "" || apt.status === filterStatus) &&
      (filterDate === "" || apt.date === filterDate)
    );
  });

  return (
    <Card className="shadow-2xl border border-gray-200">
      {/* Cabeçalho */}
      <CardHeader className="flex flex-col lg:flex-row justify-between items-center bg-gradient-to-r from-purple-700 to-blue-700 text-white rounded-t-lg p-4 space-y-3 lg:space-y-0">
        <CardTitle className="text-lg font-bold">📊 Agenda Estilo Excel</CardTitle>
        <div className="flex flex-wrap gap-3">
          {/* Pesquisa */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar paciente, médico, tipo..."
              className="pl-8 w-64 rounded-lg text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro Médico */}
          <Select value={filterDoctor || "all"} onValueChange={(val) => setFilterDoctor(val === "all" ? "" : val)}>
            <SelectTrigger className="bg-white text-black">
              <SelectValue placeholder="Médico" />
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

          {/* Filtro Status */}
          <Select value={filterStatus || "all"} onValueChange={(val) => setFilterStatus(val === "all" ? "" : val)}>
            <SelectTrigger className="bg-white text-black">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="agendado">🟡 Agendado</SelectItem>
              <SelectItem value="confirmado">🟢 Confirmado</SelectItem>
              <SelectItem value="realizado">🔵 Realizado</SelectItem>
              <SelectItem value="cancelado">🔴 Cancelado</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Data */}
          <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="bg-white text-black" />

          {/* Novo Agendamento */}
          <Button onClick={() => setIsAdding(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </div>
      </CardHeader>

      {/* Conteúdo */}
      <CardContent>
        <div className="overflow-x-auto rounded-b-lg border border-gray-200">
          <Table>
            <TableHeader className="bg-gray-100 text-gray-700 font-semibold">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Nova linha */}
              {isAdding && (
                <TableRow className="bg-purple-50">
                  <TableCell><Input type="date" value={newData.date} onChange={(e) => setNewData({ ...newData, date: e.target.value })} /></TableCell>
                  <TableCell><Input type="time" value={newData.time} onChange={(e) => setNewData({ ...newData, time: e.target.value })} /></TableCell>
                  <TableCell>
                    <Select value={newData.patient_id || "all"} onValueChange={(value) => setNewData({ ...newData, patient_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Paciente" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" disabled>Selecione</SelectItem>
                        {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select value={newData.doctor_id || "all"} onValueChange={(value) => setNewData({ ...newData, doctor_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Médico" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" disabled>Selecione</SelectItem>
                        {doctors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><Input value={newData.type} onChange={(e) => setNewData({ ...newData, type: e.target.value })} /></TableCell>
                  <TableCell><Input type="number" value={newData.price} onChange={(e) => setNewData({ ...newData, price: Number(e.target.value) })} /></TableCell>
                  <TableCell>
                    <Select value={newData.status} onValueChange={(value) => setNewData({ ...newData, status: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agendado">🟡 Agendado</SelectItem>
                        <SelectItem value="confirmado">🟢 Confirmado</SelectItem>
                        <SelectItem value="realizado">🔵 Realizado</SelectItem>
                        <SelectItem value="cancelado">🔴 Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center space-x-2">
                    <Button size="sm" onClick={handleSaveNew} className="bg-green-600 hover:bg-green-700">Salvar</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
                  </TableCell>
                </TableRow>
              )}

              {/* Agendamentos */}
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((appointment, index) => (
                  <TableRow key={appointment.id} className={`hover:bg-purple-50 transition-all ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <TableCell>
                      {editingId === appointment.id ? (
                        <Input type="date" value={editData.date} onChange={(e) => handleChangeEdit("date", e.target.value)} />
                      ) : new Date(appointment.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      {editingId === appointment.id ? (
                        <Input type="time" value={editData.time} onChange={(e) => handleChangeEdit("time", e.target.value)} />
                      ) : appointment.time}
                    </TableCell>
                    <TableCell>{getPatientName(appointment.patient_id)}</TableCell>
                    <TableCell>{getDoctorName(appointment.doctor_id)}</TableCell>
                    <TableCell>
                      {editingId === appointment.id ? (
                        <Input value={editData.type} onChange={(e) => handleChangeEdit("type", e.target.value)} />
                      ) : appointment.type}
                    </TableCell>
                    <TableCell>
                      {editingId === appointment.id ? (
                        <Input type="number" value={editData.price} onChange={(e) => handleChangeEdit("price", Number(e.target.value))} />
                      ) : `R$ ${appointment.price?.toLocaleString("pt-BR")}`}
                    </TableCell>
                    <TableCell>
                      {editingId === appointment.id ? (
                        <Select value={editData.status} onValueChange={(value) => handleChangeEdit("status", value)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agendado">🟡 Agendado</SelectItem>
                            <SelectItem value="confirmado">🟢 Confirmado</SelectItem>
                            <SelectItem value="realizado">🔵 Realizado</SelectItem>
                            <SelectItem value="cancelado">🔴 Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : appointment.status}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                      {editingId === appointment.id ? (
                        <Button size="sm" onClick={handleSaveEdit} className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => handleEdit(appointment)}>Editar</Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este agendamento?")) {
                            deleteAppointment(appointment.id);
                          }
                        }}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                    Nenhum agendamento encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
