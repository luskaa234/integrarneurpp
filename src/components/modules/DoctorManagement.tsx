"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Edit, Phone, Calendar, Loader2, Trash2, Plus, Brain } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const doctorSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  crm: z.string().min(1, 'CRM é obrigatório'),
  specialty: z.string().min(1, 'Especialidade é obrigatória'),
  phone: z.string().min(1, 'Telefone é obrigatório')
});

const evaluationTypeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duração deve ser maior que zero'),
  is_active: z.boolean().default(true)
});

type DoctorFormData = z.infer<typeof doctorSchema>;
type EvaluationTypeFormData = z.infer<typeof evaluationTypeSchema>;

interface EvaluationType {
  id: string;
  name: string;
  description?: string;
  duration: number;
  is_active: boolean;
  created_at: string;
}

export function DoctorManagement() {
  const { doctors, addUser, updateUser, deleteUser, loading } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<any>(null);
  const [evaluationTypes, setEvaluationTypes] = useState<EvaluationType[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema)
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit }
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema)
  });

  const {
    register: registerEvaluation,
    handleSubmit: handleSubmitEvaluation,
    reset: resetEvaluation,
    formState: { errors: errorsEvaluation, isSubmitting: isSubmittingEvaluation }
  } = useForm<EvaluationTypeFormData>({
    resolver: zodResolver(evaluationTypeSchema)
  });

  React.useEffect(() => {
    // Carregar tipos de avaliação do localStorage
    const savedTypes = localStorage.getItem('evaluation-types');
    if (savedTypes) {
      try {
        setEvaluationTypes(JSON.parse(savedTypes));
      } catch (error) {
        console.error('Erro ao carregar tipos de avaliação:', error);
      }
    } else {
      // Tipos padrão
      const defaultTypes: EvaluationType[] = [
        {
          id: '1',
          name: 'Avaliação Cognitiva Geral',
          description: 'Avaliação completa das funções cognitivas',
          duration: 90,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Memória de Trabalho',
          description: 'Avaliação específica da memória de trabalho',
          duration: 60,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Atenção e Concentração',
          description: 'Teste de atenção sustentada e seletiva',
          duration: 45,
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Função Executiva',
          description: 'Avaliação das funções executivas',
          duration: 75,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      setEvaluationTypes(defaultTypes);
      localStorage.setItem('evaluation-types', JSON.stringify(defaultTypes));
    }
  }, []);

  const saveEvaluationTypes = (types: EvaluationType[]) => {
    setEvaluationTypes(types);
    localStorage.setItem('evaluation-types', JSON.stringify(types));
  };

  const onSubmit = async (data: DoctorFormData) => {
    const success = await addUser({
      ...data,
      role: 'medico',
      is_active: true
    });

    if (success) {
      reset();
      setIsDialogOpen(false);
    }
  };

  const onSubmitEdit = async (data: DoctorFormData) => {
    if (!editingDoctor) return;

    const success = await updateUser(editingDoctor.id, data);

    if (success) {
      resetEdit();
      setIsEditDialogOpen(false);
      setEditingDoctor(null);
    }
  };

  const onSubmitEvaluation = async (data: EvaluationTypeFormData) => {
    const newType: EvaluationType = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    };

    const updatedTypes = [newType, ...evaluationTypes];
    saveEvaluationTypes(updatedTypes);
    
    toast.success('Tipo de avaliação adicionado com sucesso!');
    resetEvaluation();
    setIsEvaluationDialogOpen(false);
  };

  const handleEdit = (doctor: any) => {
    setEditingDoctor(doctor);
    setValueEdit('name', doctor.name);
    setValueEdit('email', doctor.email);
    setValueEdit('crm', doctor.crm || '');
    setValueEdit('specialty', doctor.specialty || '');
    setValueEdit('phone', doctor.phone || '');
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (doctor: any) => {
    if (window.confirm(`Tem certeza que deseja excluir o médico ${doctor.name}?`)) {
      const success = await deleteUser(doctor.id);
      if (success) {
        toast.success('Médico excluído com sucesso!');
      }
    }
  };

  const toggleEvaluationType = (id: string) => {
    const updatedTypes = evaluationTypes.map(type => 
      type.id === id ? { ...type, is_active: !type.is_active } : type
    );
    saveEvaluationTypes(updatedTypes);
    toast.success('Status atualizado!');
  };

  const deleteEvaluationType = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este tipo de avaliação?')) {
      const updatedTypes = evaluationTypes.filter(type => type.id !== id);
      saveEvaluationTypes(updatedTypes);
      toast.success('Tipo de avaliação excluído!');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Carregando médicos...</p>
        </div>
      </div>
    );
  }

  // Verificar se doctors existe e é um array
  const doctorsList = doctors || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Médicos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os médicos, especialidades e tipos de avaliação
          </p>
        </div>

        <div className="flex space-x-2">
          <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Brain className="mr-2 h-4 w-4" />
                Novo Tipo de Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Tipo de Avaliação</DialogTitle>
                <DialogDescription>
                  Adicione um novo tipo de avaliação neurológica
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitEvaluation(onSubmitEvaluation)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eval-name">Nome da Avaliação</Label>
                  <Input
                    id="eval-name"
                    placeholder="Ex: Avaliação de Linguagem"
                    {...registerEvaluation('name')}
                  />
                  {errorsEvaluation.name && (
                    <p className="text-sm text-red-600">{errorsEvaluation.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eval-description">Descrição</Label>
                  <Input
                    id="eval-description"
                    placeholder="Descrição da avaliação..."
                    {...registerEvaluation('description')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eval-duration">Duração (minutos)</Label>
                  <Input
                    id="eval-duration"
                    type="number"
                    placeholder="60"
                    {...registerEvaluation('duration', { valueAsNumber: true })}
                  />
                  {errorsEvaluation.duration && (
                    <p className="text-sm text-red-600">{errorsEvaluation.duration.message}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="eval-active"
                    defaultChecked={true}
                    {...registerEvaluation('is_active')}
                    className="rounded"
                  />
                  <Label htmlFor="eval-active">Ativo</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEvaluationDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmittingEvaluation}>
                    {isSubmittingEvaluation ? 'Criando...' : 'Criar Tipo'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Médico
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Médico</DialogTitle>
                <DialogDescription>
                  Adicione um novo médico ao sistema
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo do médico"
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      placeholder="12345-SP"
                      {...register('crm')}
                    />
                    {errors.crm && (
                      <p className="text-sm text-red-600">{errors.crm.message}</p>
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
                  <Label htmlFor="specialty">Especialidade</Label>
                  <Input
                    id="specialty"
                    placeholder="Ex: Neurologia, Neuropsicologia"
                    {...register('specialty')}
                  />
                  {errors.specialty && (
                    <p className="text-sm text-red-600">{errors.specialty.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Cadastrando...' : 'Cadastrar Médico'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="doctors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="doctors">Médicos</TabsTrigger>
          <TabsTrigger value="evaluations">Tipos de Avaliação</TabsTrigger>
        </TabsList>

        <TabsContent value="doctors">
          {doctorsList.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Nenhum médico encontrado</h3>
                  <p className="text-gray-600 mb-4">
                    Comece a adicionar o primeiro médico ao sistema
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Adicionar Médico
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {doctorsList.map((doctor) => (
                <Card key={doctor.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{doctor.name}</CardTitle>
                        <CardDescription>{doctor.specialty || 'Especialidade não informada'}</CardDescription>
                      </div>
                      <Badge variant="outline">{doctor.crm || 'CRM não informado'}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="mr-2 h-4 w-4" />
                        {doctor.phone || 'Telefone não informado'}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm font-medium">
                          <Calendar className="mr-2 h-4 w-4" />
                          Horários de Atendimento
                        </div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span>Seg - Sex</span>
                            <span>08:00 - 17:00</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(doctor)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(doctor)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="evaluations">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Avaliação Neurológica</CardTitle>
              <CardDescription>
                Gerencie os tipos de avaliação disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluationTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description || '-'}</TableCell>
                      <TableCell>{type.duration} min</TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleEvaluationType(type.id)}
                          >
                            {type.is_active ? 'Desativar' : 'Ativar'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteEvaluationType(type.id)}
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
      </Tabs>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Médico</DialogTitle>
            <DialogDescription>
              Atualize as informações do médico
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Nome completo do médico"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-crm">CRM</Label>
                <Input
                  id="edit-crm"
                  placeholder="12345-SP"
                  {...registerEdit('crm')}
                />
                {errorsEdit.crm && (
                  <p className="text-sm text-red-600">{errorsEdit.crm.message}</p>
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
              <Label htmlFor="edit-specialty">Especialidade</Label>
              <Input
                id="edit-specialty"
                placeholder="Ex: Neurologia, Neuropsicologia"
                {...registerEdit('specialty')}
              />
              {errorsEdit.specialty && (
                <p className="text-sm text-red-600">{errorsEdit.specialty.message}</p>
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