"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Undo,
  Redo,
  AlertTriangle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

interface ScheduleRow {
  id: string;
  patient_name: string;
  date: string;
  time: string;
  doctor: string;
  status: 'agendado' | 'confirmado' | 'realizado' | 'cancelado';
  price: number;
  notes?: string;
  created_at: string;
}

interface HistoryAction {
  type: 'add' | 'edit' | 'delete';
  data: ScheduleRow[];
  timestamp: number;
}

export function ExcelScheduleGrid() {
  const {
    appointments,
    doctors,
    patients,
    deleteAppointment,
    addAppointment,
    updateAppointment,
    addPatient,
    addDoctor
  } = useApp() as any; // 👈 garante que o TS não quebre caso faltarem métodos

  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [doctorFilter, setDoctorFilter] = useState('all');
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [conflicts, setConflicts] = useState<string[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadScheduleData();
  }, [appointments, patients, doctors]);

  const loadScheduleData = () => {
    try {
      const convertedData: ScheduleRow[] = appointments.map(apt => {
        const patient = patients.find(p => p.id === apt.patient_id);
        const doctor = doctors.find(d => d.id === apt.doctor_id);

        return {
          id: apt.id,
          patient_name: patient?.name || 'Paciente não encontrado',
          date: apt.date,
          time: apt.time,
          doctor: doctor?.name || 'Médico não encontrado',
          status: apt.status,
          price: apt.price,
          notes: apt.notes,
          created_at: apt.created_at
        };
      });

      setScheduleData(
        convertedData.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      );
      detectConflicts(convertedData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const detectConflicts = (data: ScheduleRow[]) => {
    const conflictIds: string[] = [];
    const seen = new Map<string, string>();

    data.forEach(row => {
      if (row.status === 'cancelado') return;
      const key = `${row.doctor}-${row.date}-${row.time}`;
      if (seen.has(key)) {
        conflictIds.push(row.id, seen.get(key)!);
      } else {
        seen.set(key, row.id);
      }
    });

    setConflicts([...new Set(conflictIds)]);
  };

  const addNewRow = () => {
    const newRow: ScheduleRow = {
      id: `temp-${Date.now()}`,
      patient_name: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      doctor: '',
      status: 'agendado',
      price: 300,
      created_at: new Date().toISOString()
    };
    setScheduleData([...scheduleData, newRow]);
    setTimeout(() => setEditingCell({ rowId: newRow.id, field: 'patient_name' }), 100);
  };

  const deleteRow = async (rowId: string) => {
    const row = scheduleData.find(r => r.id === rowId);
    if (!row) return;
    if (window.confirm(`Excluir consulta de ${row.patient_name}?`)) {
      if (!rowId.startsWith('temp-')) {
        const success = await deleteAppointment(rowId);
        if (success) setScheduleData(scheduleData.filter(r => r.id !== rowId));
      } else {
        setScheduleData(scheduleData.filter(r => r.id !== rowId));
      }
    }
  };

  const handleSaveSchedule = async () => {
    setAutoSaveStatus('saving');
    let hasError = false;
    for (const row of scheduleData) {
      try {
        const appointmentData = {
          patient_id:
            patients.find(p => p.name === row.patient_name)?.id ||
            (await addPatient?.({ name: row.patient_name }))?.id ||
            '',
          doctor_id:
            doctors.find(d => d.name === row.doctor)?.id ||
            (await addDoctor?.({ name: row.doctor, specialty: 'Geral' }))?.id ||
            '',
          date: row.date,
          time: row.time,
          status: row.status,
          type: 'consulta', // 👈 obrigatório, ajuste conforme seu modelo
          price: row.price,
          notes: row.notes || ''
        };

        if (row.id.startsWith('temp-')) {
          await addAppointment(appointmentData);
        } else {
          await updateAppointment(row.id, appointmentData);
        }
      } catch (error) {
        console.error('Erro ao salvar agendamento:', row, error);
        toast.error(`❌ Erro ao salvar ${row.patient_name}`);
        hasError = true;
      }
    }
    setAutoSaveStatus(hasError ? 'error' : 'saved');
    if (!hasError) toast.success('✅ Agendamentos salvos!');
    else toast.error('⚠️ Alguns não foram salvos.');
    loadScheduleData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">📊 Agenda Excel</h1>
        <div className="flex items-center space-x-2">
          <Badge>{autoSaveStatus}</Badge>
          <Button onClick={handleSaveSchedule} disabled={autoSaveStatus === 'saving'}>
            <Download className="h-4 w-4 mr-1" /> Salvar
          </Button>
          <Button onClick={addNewRow}>
            <Plus className="h-4 w-4 mr-1" /> Nova Linha
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📅 Agenda</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Médico</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduleData.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.patient_name}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell>{row.doctor}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell>R$ {row.price}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRow(row.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
