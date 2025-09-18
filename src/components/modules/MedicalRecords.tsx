"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Edit, Eye, Calendar, User, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const medicalRecordSchema = z.object({
  patient_id: z.string().min(1, 'Paciente é obrigatório'),
  doctor_id: z.string().min(1, 'Médico é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  diagnosis: z.string().min(1, 'Diagnóstico é obrigatório'),
  treatment: z.string().min(1, 'Tratamento é obrigatório'),
  notes: z.string().optional()
});

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  created_at: string;
}

export function MedicalRecords() {
  const { patients, doctors } = useApp();
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema)
  });

  useEffect(() => {
    loadMedicalRecords();
  }, []);

  const loadMedicalRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar prontuários:', error);
        return;
      }

      setMedicalRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar prontuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MedicalRecordFormData) => {
    try {
      const { data: newRecord, error } = await supabase
        .from('medical_records')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar prontuário:', error);
        toast.error('Erro ao criar prontuário');
        return;
      }

      if (newRecord) {
        setMedicalRecords(prev => [newRecord, ...prev]);
        toast.success('Prontuário criado com sucesso!');
        reset();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
      toast.error('Erro ao criar prontuário');
    }
  };

  const deleteMedicalRecord = async (record: MedicalRecord) => {
    if (window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o prontuário de ${getPatientName(record.patient_id)}? Esta ação não pode ser desfeita.`)) {
      try {
        console.log('🗑️ EXCLUINDO PRONTUÁRIO PERMANENTEMENTE:', record.id);
        
        // EXCLUSÃO REAL E PERMANENTE do Supabase
        const { error } = await supabase
          .from('medical_records')
          .delete()
          .eq('id', record.id);

        if (error) {
          console.error('❌ Erro ao excluir prontuário do banco:', error);
          toast.error('❌ Erro ao excluir prontuário do banco de dados');
          return;
        }

        // Remover da lista local
        setMedicalRecords(prev => prev.filter(r => r.id !== record.id));
        toast.success('🗑️ Prontuário EXCLUÍDO PERMANENTEMENTE do banco de dados!');
        
        console.log('✅ Prontuário excluído com sucesso do Supabase');
      } catch (error) {
        console.error('❌ Erro ao excluir prontuário:', error);
        toast.error('❌ Erro ao excluir prontuário');
      }
    }
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Paciente não encontrado';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Médico não encontrado';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando prontuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Prontuários Médicos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os prontuários e histórico médico dos pacientes
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Prontuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Prontuário</DialogTitle>
              <DialogDescription>
                Adicione um novo registro médico para o paciente
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Paciente</Label>
                  <Select onValueChange={(value) => setValue('patient_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.patient_id && (
                    <p className="text-sm text-red-600">{errors.patient_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Médico</Label>
                  <Select onValueChange={(value) => setValue('doctor_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o médico" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.doctor_id && (
                    <p className="text-sm text-red-600">{errors.doctor_id.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data da Consulta</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-sm text-red-600">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Descreva o diagn óstico..."
                  rows={3}
                  {...register('diagnosis')}
                />
                {errors.diagnosis && (
                  <p className="text-sm text-red-600">{errors.diagnosis.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Tratamento</Label>
                <Textarea
                  id="treatment"
                  placeholder="Descreva o tratamento prescrito..."
                  rows={3}
                  {...register('treatment')}
                />
                {errors.treatment && (
                  <p className="text-sm text-red-600">{errors.treatment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações Adicionais</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações gerais, recomendações, etc..."
                  rows={2}
                  {...register('notes')}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Prontuário'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos os Prontuários</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
          <TabsTrigger value="by-patient">Por Paciente</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Todos os Prontuários</CardTitle>
              <CardDescription>
                Lista completa de todos os registros médicos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicalRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {getPatientName(record.patient_id)}
                      </TableCell>
                      <TableCell>
                        {getDoctorName(record.doctor_id)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {record.diagnosis}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deleteMedicalRecord(record)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {medicalRecords.slice(0, 6).map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {getPatientName(record.patient_id)}
                      </CardTitle>
                      <CardDescription>
                        {getDoctorName(record.doctor_id)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">
                      {new Date(record.date).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Diagnóstico:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {record.diagnosis}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Tratamento:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {record.treatment}
                      </p>
                    </div>
                    <div className="flex justify-between pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRecord(record)}
                      >
                        Ver Completo
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteMedicalRecord(record)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="by-patient">
          <div className="space-y-4">
            {patients.map((patient) => {
              const patientRecords = medicalRecords.filter(r => r.patient_id === patient.id);
              
              if (patientRecords.length === 0) return null;
              
              return (
                <Card key={patient.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      {patient.name}
                    </CardTitle>
                    <CardDescription>
                      {patientRecords.length} registro{patientRecords.length !== 1 ? 's' : ''} médico{patientRecords.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patientRecords.slice(0, 3).map((record) => (
                        <div key={record.id} className="flex justify-between items-start p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <Calendar className="mr-1 h-4 w-4" />
                              {new Date(record.date).toLocaleDateString('pt-BR')}
                              <span className="mx-2">•</span>
                              {getDoctorName(record.doctor_id)}
                            </div>
                            <p className="font-medium text-sm">{record.diagnosis}</p>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedRecord(record)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => deleteMedicalRecord(record)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {patientRecords.length > 3 && (
                        <p className="text-sm text-gray-500 text-center">
                          E mais {patientRecords.length - 3} registro{patientRecords.length - 3 !== 1 ? 's' : ''}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de visualização do prontuário */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Prontuário Médico</DialogTitle>
            <DialogDescription>
              Detalhes completos do registro médico
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Informações da Consulta</h3>
                  <div className="space-y-2">
                    <p><strong>Paciente:</strong> {getPatientName(selectedRecord.patient_id)}</p>
                    <p><strong>Médico:</strong> {getDoctorName(selectedRecord.doctor_id)}</p>
                    <p><strong>Data:</strong> {new Date(selectedRecord.date).toLocaleDateString('pt-BR')}</p>
                    <p><strong>Criado em:</strong> {new Date(selectedRecord.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Resumo</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Consulta realizada em {new Date(selectedRecord.date).toLocaleDateString('pt-BR')} 
                      com diagnóstico de {selectedRecord.diagnosis.toLowerCase()}.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Diagnóstico</h3>
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-700">{selectedRecord.diagnosis}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Tratamento</h3>
                  <div className="p-4 border rounded-lg">
                    <p className="text-gray-700">{selectedRecord.treatment}</p>
                  </div>
                </div>

                {selectedRecord.notes && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Observações</h3>
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <p className="text-gray-700">{selectedRecord.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between space-x-2">
                <Button 
                  variant="destructive"
                  onClick={() => {
                    deleteMedicalRecord(selectedRecord);
                    setSelectedRecord(null);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                    Fechar
                  </Button>
                  <Button>
                    Editar Prontuário
                  </Button>
                  <Button variant="secondary">
                    Imprimir
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}