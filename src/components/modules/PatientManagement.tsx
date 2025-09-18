"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Edit, Phone, Calendar, FileText, Eye, Loader2, Trash2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const patientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  cpf: z.string().min(11, 'CPF é obrigatório'),
  birth_date: z.string().min(1, 'Data de nascimento é obrigatória'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório')
});

type PatientFormData = z.infer<typeof patientSchema>;

export function PatientManagement() {
  const { patients, addUser, updateUser, deleteUser, appointments, loading } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [editingPatient, setEditingPatient] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema)
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit }
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema)
  });

  const onSubmit = async (data: PatientFormData) => {
    const success = await addUser({
      ...data,
      role: 'paciente',
      is_active: true
    });

    if (success) {
      toast.success('Paciente cadastrado com sucesso!');
      reset();
      setIsDialogOpen(false);
    } else {
      toast.error('Erro ao cadastrar paciente');
    }
  };

  const onSubmitEdit = async (data: PatientFormData) => {
    if (!editingPatient) return;

    const success = await updateUser(editingPatient.id, data);

    if (success) {
      resetEdit();
      setIsEditDialogOpen(false);
      setEditingPatient(null);
    }
  };

  const handleEdit = (patient: any) => {
    setEditingPatient(patient);
    setValueEdit('name', patient.name);
    setValueEdit('email', patient.email);
    setValueEdit('cpf', patient.cpf || '');
    setValueEdit('birth_date', patient.birth_date || '');
    setValueEdit('phone', patient.phone || '');
    setValueEdit('address', patient.address || '');
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (patient: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o paciente ${patient.name}?`)) {
      const success = await deleteUser(patient.id);
      if (success) {
        toast.success('Paciente excluído com sucesso!');
      }
    }
  };

  const getPatientAppointments = (patientId: string) => {
    if (!appointments || !Array.isArray(appointments)) return [];
    return appointments.filter(apt => apt.patient_id === patientId);
  };

  const getLastAppointment = (patientId: string) => {
    const patientAppointments = getPatientAppointments(patientId);
    return patientAppointments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Carregando pacientes...</p>
        </div>
      </div>
    );
  }

  // Verificar se patients existe e é um array
  const patientsList = patients || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pacientes</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os pacientes e seus históricos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Paciente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
              <DialogDescription>
                Adicione um novo paciente ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo do paciente"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    {...register('cpf')}
                  />
                  {errors.cpf && (
                    <p className="text-sm text-red-600">{errors.cpf.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    {...register('birth_date')}
                  />
                  {errors.birth_date && (
                    <p className="text-sm text-red-600">{errors.birth_date.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade - UF"
                  {...register('address')}
                />
                {errors.address && (
                  <p className="text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar Paciente'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Pacientes</TabsTrigger>
          <TabsTrigger value="cards">Visualização em Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Pacientes Cadastrados</CardTitle>
              <CardDescription>
                Lista completa de todos os pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {patientsList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Nenhum paciente cadastrado</p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Paciente
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Última Consulta</TableHead>
                      <TableHead>Total Consultas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsList.map((patient) => {
                      const lastAppointment = getLastAppointment(patient.id);
                      const totalAppointments = getPatientAppointments(patient.id).length;
                      
                      return (
                        <TableRow key={patient.id}>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>
                            {patient.birth_date ? calculateAge(patient.birth_date) : '-'} anos
                          </TableCell>
                          <TableCell>{patient.phone || '-'}</TableCell>
                          <TableCell>
                            {lastAppointment 
                              ? new Date(lastAppointment.date).toLocaleDateString('pt-BR')
                              : 'Nunca'
                            }
                          </TableCell>
                          <TableCell>{totalAppointments}</TableCell>
                          <TableCell>
                            <Badge variant={patient.is_active ? 'default' : 'secondary'}>
                              {patient.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedPatient(patient)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleEdit(patient)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDelete(patient)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards">
          {patientsList.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Nenhum paciente encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    Comece adicionando o primeiro paciente ao sistema
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Paciente
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {patientsList.map((patient) => {
                const lastAppointment = getLastAppointment(patient.id);
                const totalAppointments = getPatientAppointments(patient.id).length;
                
                return (
                  <Card key={patient.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{patient.name}</CardTitle>
                          <CardDescription>
                            {patient.birth_date ? calculateAge(patient.birth_date) : '-'} anos
                          </CardDescription>
                        </div>
                        <Badge variant={patient.is_active ? 'default' : 'secondary'}>
                          {patient.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="mr-2 h-4 w-4" />
                          {patient.phone || 'Não informado'}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="mr-2 h-4 w-4" />
                          {lastAppointment 
                            ? `Última consulta: ${new Date(lastAppointment.date).toLocaleDateString('pt-BR')}`
                            : 'Nenhuma consulta'
                          }
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <FileText className="mr-2 h-4 w-4" />
                          {totalAppointments} consulta{totalAppointments !== 1 ? 's' : ''}
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedPatient(patient)}
                          >
                            Ver Detalhes
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(patient)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes do paciente */}
      <Dialog open={!!selectedPatient} onOpenChange={() => setSelectedPatient(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Paciente</DialogTitle>
            <DialogDescription>
              Informações completas e histórico
            </DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                  <div className="space-y-2">
                    <p><strong>Nome:</strong> {selectedPatient.name}</p>
                    <p><strong>Email:</strong> {selectedPatient.email}</p>
                    <p><strong>CPF:</strong> {selectedPatient.cpf || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> {selectedPatient.phone || 'Não informado'}</p>
                    <p><strong>Data de Nascimento:</strong> {
                      selectedPatient.birth_date 
                        ? new Date(selectedPatient.birth_date).toLocaleDateString('pt-BR')
                        : 'Não informado'
                    }</p>
                    <p><strong>Idade:</strong> {
                      selectedPatient.birth_date 
                        ? calculateAge(selectedPatient.birth_date) + ' anos'
                        : 'Não informado'
                    }</p>
                    <p><strong>Endereço:</strong> {selectedPatient.address || 'Não informado'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Histórico de Consultas</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {getPatientAppointments(selectedPatient.id).map((appointment) => (
                      <div key={appointment.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{appointment.type}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                            </p>
                            {appointment.notes && (
                              <p className="text-sm text-gray-500 mt-1">{appointment.notes}</p>
                            )}
                          </div>
                          <Badge variant={
                            appointment.status === 'realizado' ? 'default' :
                            appointment.status === 'confirmado' ? 'secondary' :
                            appointment.status === 'cancelado' ? 'destructive' : 'outline'
                          }>
                            {appointment.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {getPatientAppointments(selectedPatient.id).length === 0 && (
                      <p className="text-gray-500 text-center py-4">
                        Nenhuma consulta registrada
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  handleEdit(selectedPatient);
                  setSelectedPatient(null);
                }}>
                  Editar Paciente
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações do paciente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome Completo</Label>
                <Input
                  id="edit-name"
                  placeholder="Nome completo do paciente"
                  {...registerEdit('name')}
                />
                {errorsEdit.name && (
                  <p className="text-sm text-red-600">{errorsEdit.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  {...registerEdit('email')}
                />
                {errorsEdit.email && (
                  <p className="text-sm text-red-600">{errorsEdit.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-cpf">CPF</Label>
                <Input
                  id="edit-cpf"
                  placeholder="000.000.000-00"
                  {...registerEdit('cpf')}
                />
                {errorsEdit.cpf && (
                  <p className="text-sm text-red-600">{errorsEdit.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-birth_date">Data de Nascimento</Label>
                <Input
                  id="edit-birth_date"
                  type="date"
                  {...registerEdit('birth_date')}
                />
                {errorsEdit.birth_date && (
                  <p className="text-sm text-red-600">{errorsEdit.birth_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  placeholder="(11) 99999-9999"
                  {...registerEdit('phone')}
                />
                {errorsEdit.phone && (
                  <p className="text-sm text-red-600">{errorsEdit.phone.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Endereço Completo</Label>
              <Input
                id="edit-address"
                placeholder="Rua, número, bairro, cidade - UF"
                {...registerEdit('address')}
              />
              {errorsEdit.address && (
                <p className="text-sm text-red-600">{errorsEdit.address.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingEdit}>
                {isSubmittingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}