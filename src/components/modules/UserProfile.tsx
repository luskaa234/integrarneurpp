"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Edit, Save, X, Phone, Mail, Calendar, MapPin, Shield, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
  address: z.string().optional(),
  crm: z.string().optional(),
  specialty: z.string().optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function UserProfile() {
  const { user } = useAuth();
  const { updateUser } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  });

  React.useEffect(() => {
    if (user) {
      setValue('name', user.name);
      setValue('email', user.email);
      setValue('phone', user.phone || '');
      setValue('cpf', user.cpf || '');
      setValue('birth_date', user.birth_date || '');
      setValue('address', user.address || '');
      setValue('crm', user.crm || '');
      setValue('specialty', user.specialty || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    const success = await updateUser(user.id, data);
    
    if (success) {
      setIsEditing(false);
      toast.success('Perfil atualizado com sucesso!');
      
      // Atualizar dados do usuário no localStorage
      const updatedUser = { ...user, ...data };
      localStorage.setItem('neuro-integrar-user', JSON.stringify(updatedUser));
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      financeiro: 'Financeiro',
      agendamento: 'Agendamento',
      medico: 'Médico',
      paciente: 'Paciente'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'financeiro': return 'default';
      case 'agendamento': return 'secondary';
      case 'medico': return 'outline';
      case 'paciente': return 'secondary';
      default: return 'outline';
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Usuário não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais e configurações
          </p>
        </div>

        <div className="flex space-x-2">
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="mr-2 h-4 w-4" />
                Alterar Senha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
                <DialogDescription>
                  Para alterar sua senha, entre em contato com o administrador do sistema
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Informação:</strong> Por questões de segurança, a alteração de senha deve ser solicitada ao administrador do sistema.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsPasswordDialogOpen(false)}>
                  Entendi
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Perfil
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Dados pessoais e de identificação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    {...register('name')}
                  />
                ) : (
                  <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">{user.name}</p>
                )}
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                  />
                ) : (
                  <div className="flex items-center text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    <Mail className="mr-2 h-4 w-4" />
                    {user.email}
                  </div>
                )}
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    {...register('phone')}
                  />
                ) : (
                  <div className="flex items-center text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    <Phone className="mr-2 h-4 w-4" />
                    {user.phone || 'Não informado'}
                  </div>
                )}
              </div>

              {(user.role === 'paciente' || user.role === 'medico') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    {isEditing ? (
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        {...register('cpf')}
                      />
                    ) : (
                      <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                        {user.cpf || 'Não informado'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Data de Nascimento</Label>
                    {isEditing ? (
                      <Input
                        id="birth_date"
                        type="date"
                        {...register('birth_date')}
                      />
                    ) : (
                      <div className="flex items-center text-sm text-gray-700 p-2 bg-gray-50 rounded">
                        <Calendar className="mr-2 h-4 w-4" />
                        {user.birth_date 
                          ? `${new Date(user.birth_date).toLocaleDateString('pt-BR')} (${calculateAge(user.birth_date)} anos)`
                          : 'Não informado'
                        }
                      </div>
                    )}
                  </div>
                </>
              )}

              {user.role === 'paciente' && (
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  {isEditing ? (
                    <Input
                      id="address"
                      placeholder="Rua, número, bairro, cidade - UF"
                      {...register('address')}
                    />
                  ) : (
                    <div className="flex items-center text-sm text-gray-700 p-2 bg-gray-50 rounded">
                      <MapPin className="mr-2 h-4 w-4" />
                      {user.address || 'Não informado'}
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Informações Profissionais (apenas para médicos) */}
        {user.role === 'medico' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Informações Profissionais
              </CardTitle>
              <CardDescription>
                Dados profissionais e especialização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="crm">CRM</Label>
                {isEditing ? (
                  <Input
                    id="crm"
                    placeholder="12345-SP"
                    {...register('crm')}
                  />
                ) : (
                  <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    {user.crm || 'Não informado'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade</Label>
                {isEditing ? (
                  <Input
                    id="specialty"
                    placeholder="Ex: Neurologia, Neuropsicologia"
                    {...register('specialty')}
                  />
                ) : (
                  <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                    {user.specialty || 'Não informado'}
                  </p>
                )}
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Horários de Atendimento</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Segunda a Sexta:</span>
                    <span>08:00 - 17:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sábado:</span>
                    <span>08:00 - 12:00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações da Conta */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Dados de acesso e configurações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Status da Conta</Label>
              <div className="flex items-center space-x-2">
                <Badge variant={user.is_active ? 'default' : 'destructive'}>
                  {user.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
                {user.is_active && (
                  <span className="text-sm text-green-600">✓ Pode fazer login</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Data de Criação</Label>
              <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Último Login</Label>
              <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded">
                {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">Segurança</h4>
              <div className="text-sm text-green-700 space-y-1">
                <p>✓ Senha protegida</p>
                <p>✓ Dados criptografados</p>
                <p>✓ Acesso controlado por perfil</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas do Usuário */}
        {(user.role === 'medico' || user.role === 'paciente') && (
          <Card>
            <CardHeader>
              <CardTitle>Minhas Estatísticas</CardTitle>
              <CardDescription>
                Resumo das suas atividades no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.role === 'medico' && (
                <>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Consultas Realizadas</span>
                    <span className="text-lg font-bold text-blue-600">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Pacientes Atendidos</span>
                    <span className="text-lg font-bold text-green-600">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Avaliações Realizadas</span>
                    <span className="text-lg font-bold text-purple-600">0</span>
                  </div>
                </>
              )}

              {user.role === 'paciente' && (
                <>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium">Consultas Realizadas</span>
                    <span className="text-lg font-bold text-blue-600">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium">Próximas Consultas</span>
                    <span className="text-lg font-bold text-green-600">0</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="text-sm font-medium">Avaliações Feitas</span>
                    <span className="text-lg font-bold text-purple-600">0</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}