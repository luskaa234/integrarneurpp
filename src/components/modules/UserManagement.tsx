"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Edit, Trash2, Eye, Shield, ShieldOff, Users, UserCheck, UserX, Activity } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { User } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const userSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'financeiro', 'agendamento', 'medico', 'paciente']),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  crm: z.string().optional(),
  specialty: z.string().optional()
});

type UserFormData = z.infer<typeof userSchema>;

export function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  });

  const watchRole = watch('role');
  const watchEditRole = watchEdit('role');

  const onSubmit = async (data: UserFormData) => {
    const newUser = {
      ...data,
      is_active: true
    };

    const success = await addUser(newUser);
    if (success) {
      reset();
      setIsDialogOpen(false);
    }
  };

  const onSubmitEdit = async (data: UserFormData) => {
    if (!editingUser) return;

    const success = await updateUser(editingUser.id, data);
    if (success) {
      resetEdit();
      setIsEditDialogOpen(false);
      setEditingUser(null);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setValueEdit('name', user.name);
    setValueEdit('email', user.email);
    setValueEdit('role', user.role);
    setValueEdit('phone', user.phone || '');
    setValueEdit('cpf', user.cpf || '');
    setValueEdit('crm', user.crm || '');
    setValueEdit('specialty', user.specialty || '');
    setIsEditDialogOpen(true);
  };

  const handleToggleActive = async (user: User) => {
    const newStatus = !user.is_active;
    const success = await updateUser(user.id, { is_active: newStatus });
    
    if (success) {
      toast.success(
        newStatus 
          ? `${user.name} foi ativado e pode fazer login` 
          : `${user.name} foi desativado e não pode mais fazer login`
      );
    }
  };

  const handleDelete = async (user: User) => {
    if (window.confirm(`Tem certeza que deseja excluir ${user.name}? Esta ação não pode ser desfeita.`)) {
      const success = await deleteUser(user.id);
      if (success) {
        toast.success('Usuário excluído com sucesso!');
      }
    }
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

  const getStats = () => {
    const total = users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = total - active;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, inactive, byRole };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-2">
            Controle total de usuários e permissões de acesso
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
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

              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select onValueChange={(value) => setValue('role', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="agendamento">Agendamento</SelectItem>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="paciente">Paciente</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Campos específicos por perfil */}
              {(watchRole === 'medico' || watchRole === 'paciente' || watchRole === 'agendamento') && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      placeholder="(11) 99999-9999"
                      {...register('phone')}
                    />
                  </div>
                  
                  {watchRole === 'paciente' && (
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        placeholder="000.000.000-00"
                        {...register('cpf')}
                      />
                    </div>
                  )}
                </div>
              )}

              {watchRole === 'medico' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="crm">CRM</Label>
                    <Input
                      id="crm"
                      placeholder="12345-SP"
                      {...register('crm')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidade</Label>
                    <Input
                      id="specialty"
                      placeholder="Neurologia"
                      {...register('specialty')}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dashboard de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Usuários cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Podem fazer login
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Inativos</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              Bloqueados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médicos</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byRole.medico || 0}</div>
            <p className="text-xs text-muted-foreground">
              Profissionais
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Controle de Usuários</CardTitle>
          <CardDescription>
            Gerencie permissões de acesso e informações dos usuários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status de Login</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleToggleActive(user)}
                      />
                      <span className={`text-sm ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {user.is_active ? 'Ativo' : 'Bloqueado'}
                      </span>
                      {user.is_active ? (
                        <Shield className="h-4 w-4 text-green-600" />
                      ) : (
                        <ShieldOff className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(user)}
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

      {/* Dialog de visualização */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <p className="text-sm text-gray-600">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Perfil</Label>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </Badge>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedUser.is_active ? 'default' : 'destructive'}>
                    {selectedUser.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
              {selectedUser.phone && (
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm text-gray-600">{selectedUser.phone}</p>
                </div>
              )}
              {selectedUser.crm && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CRM</Label>
                    <p className="text-sm text-gray-600">{selectedUser.crm}</p>
                  </div>
                  <div>
                    <Label>Especialidade</Label>
                    <p className="text-sm text-gray-600">{selectedUser.specialty}</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={() => setSelectedUser(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  placeholder="Nome completo"
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

            <div className="space-y-2">
              <Label>Perfil</Label>
              <Select onValueChange={(value) => setValueEdit('role', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="agendamento">Agendamento</SelectItem>
                  <SelectItem value="medico">Médico</SelectItem>
                  <SelectItem value="paciente">Paciente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos específicos por perfil */}
            {(watchEditRole === 'medico' || watchEditRole === 'paciente' || watchEditRole === 'agendamento') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Telefone</Label>
                  <Input
                    id="edit-phone"
                    placeholder="(11) 99999-9999"
                    {...registerEdit('phone')}
                  />
                </div>
                
                {watchEditRole === 'paciente' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-cpf">CPF</Label>
                    <Input
                      id="edit-cpf"
                      placeholder="000.000.000-00"
                      {...registerEdit('cpf')}
                    />
                  </div>
                )}
              </div>
            )}

            {watchEditRole === 'medico' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-crm">CRM</Label>
                  <Input
                    id="edit-crm"
                    placeholder="12345-SP"
                    {...registerEdit('crm')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-specialty">Especialidade</Label>
                  <Input
                    id="edit-specialty"
                    placeholder="Neurologia"
                    {...registerEdit('specialty')}
                  />
                </div>
              </div>
            )}

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