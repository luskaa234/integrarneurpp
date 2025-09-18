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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Plus, TrendingUp, TrendingDown, Calendar, FileText, Clock, Target, AlertCircle, CreditCard, Eye, CheckCircle, BarChart3, Edit, Trash2, Save, X } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const financialSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  date: z.string().min(1, 'Data é obrigatória'),
  status: z.enum(['pendente', 'pago', 'cancelado'])
});

type FinancialFormData = z.infer<typeof financialSchema>;

export function FinancialModule() {
  const { user } = useAuth();
  const { financialRecords, addFinancialRecord, updateFinancialRecord, deleteFinancialRecord, appointments, patients } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema)
  });

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    setValue: setValueEdit,
    watch: watchEdit,
    formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit }
  } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema)
  });

  const watchType = watch('type');
  const watchEditType = watchEdit('type');

  const onSubmit = async (data: FinancialFormData) => {
    try {
      console.log('💰 Criando registro financeiro:', data);
      
      const success = await addFinancialRecord(data);
      
      if (success) {
        reset();
        setIsDialogOpen(false);
        toast.success('✅ Registro financeiro criado com sucesso!');
      } else {
        toast.error('❌ Erro ao criar registro financeiro');
      }
    } catch (error) {
      console.error('❌ Erro ao criar registro:', error);
      toast.error('❌ Erro ao criar registro financeiro');
    }
  };

  const onSubmitEdit = async (data: FinancialFormData) => {
    if (!editingRecord) return;

    try {
      console.log('✏️ Editando registro financeiro:', editingRecord.id, data);
      
      const success = await updateFinancialRecord(editingRecord.id, data);
      
      if (success) {
        resetEdit();
        setIsEditDialogOpen(false);
        setEditingRecord(null);
        toast.success('✅ Registro atualizado com sucesso!');
      } else {
        toast.error('❌ Erro ao atualizar registro');
      }
    } catch (error) {
      console.error('❌ Erro ao editar registro:', error);
      toast.error('❌ Erro ao editar registro');
    }
  };

  const handleEdit = (record: any) => {
    console.log('✏️ Iniciando edição do registro:', record);
    setEditingRecord(record);
    setValueEdit('type', record.type);
    setValueEdit('amount', record.amount);
    setValueEdit('description', record.description);
    setValueEdit('category', record.category);
    setValueEdit('date', record.date);
    setValueEdit('status', record.status);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (record: any) => {
    const confirmMessage = `Tem certeza que deseja EXCLUIR PERMANENTEMENTE este registro?

📋 Detalhes:
• Tipo: ${record.type === 'receita' ? '💰 Receita' : '💸 Despesa'}
• Valor: R$ ${record.amount.toLocaleString('pt-BR')}
• Descrição: ${record.description}
• Data: ${new Date(record.date).toLocaleDateString('pt-BR')}

⚠️ ESTA AÇÃO NÃO PODE SER DESFEITA!`;

    if (window.confirm(confirmMessage)) {
      try {
        console.log('🗑️ EXCLUINDO REGISTRO FINANCEIRO PERMANENTEMENTE:', record.id);
        
        const success = await deleteFinancialRecord(record.id);
        
        if (success) {
          toast.success('🗑️ Registro EXCLUÍDO PERMANENTEMENTE do banco de dados!');
        } else {
          toast.error('❌ Erro ao excluir registro');
        }
      } catch (error) {
        console.error('❌ Erro ao excluir registro:', error);
        toast.error('❌ Erro ao excluir registro');
      }
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthRecords = financialRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
  });

  const totalRevenue = thisMonthRecords
    .filter(r => r.type === 'receita' && r.status === 'pago')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = thisMonthRecords
    .filter(r => r.type === 'despesa' && r.status === 'pago')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingRevenue = thisMonthRecords
    .filter(r => r.type === 'receita' && r.status === 'pendente')
    .reduce((sum, r) => sum + r.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pago': return 'default';
      case 'pendente': return 'secondary';
      case 'cancelado': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    return type === 'receita' ? 'default' : 'destructive';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">💰 Módulo Financeiro Profissional</h1>
          <p className="text-gray-600 mt-2">
            Controle completo das finanças com <strong>EXCLUSÃO PERMANENTE</strong> do banco de dados
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Transação Financeira</DialogTitle>
              <DialogDescription>
                Adicione uma nova receita ou despesa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select onValueChange={(value) => setValue('type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receita">💰 Receita</SelectItem>
                      <SelectItem value="despesa">💸 Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-red-600">{errors.type.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    {...register('amount', { valueAsNumber: true })}
                  />
                  {errors.amount && (
                    <p className="text-sm text-red-600">{errors.amount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  placeholder="Descrição da transação"
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {watchType === 'receita' ? (
                        <>
                          <SelectItem value="Consulta">Consulta</SelectItem>
                          <SelectItem value="Avaliação">Avaliação</SelectItem>
                          <SelectItem value="Terapia">Terapia</SelectItem>
                          <SelectItem value="Convênio">Convênio</SelectItem>
                          <SelectItem value="Particular">Particular</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Aluguel">Aluguel</SelectItem>
                          <SelectItem value="Salários">Salários</SelectItem>
                          <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                          <SelectItem value="Material">Material</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Impostos">Impostos</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600">{errors.category.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    {...register('date')}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-600">{errors.date.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(value) => setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">✅ Pago</SelectItem>
                    <SelectItem value="pendente">⏳ Pendente</SelectItem>
                    <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600">{errors.status.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Valores recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalExpenses.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Valores pagos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {netProfit.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Receita - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">A Receber</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {pendingRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Valores pendentes
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todas as Transações</TabsTrigger>
          <TabsTrigger value="receita">Receitas</TabsTrigger>
          <TabsTrigger value="despesa">Despesas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>🗑️ Todas as Transações (EXCLUSÃO PERMANENTE)</CardTitle>
              <CardDescription>
                Histórico completo - <strong>Botão vermelho EXCLUI PERMANENTEMENTE do banco</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>🗑️ Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialRecords
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(record.type)}>
                          {record.type === 'receita' ? '💰 Receita' : '💸 Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell>{record.category}</TableCell>
                      <TableCell className={record.type === 'receita' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {record.type === 'receita' ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status === 'pago' ? '✅ Pago' : 
                           record.status === 'pendente' ? '⏳ Pendente' : '❌ Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {financialRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  💰 Nenhum registro financeiro encontrado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receita">
          <Card>
            <CardHeader>
              <CardTitle>💰 Receitas</CardTitle>
              <CardDescription>
                Todas as receitas registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>🗑️ Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialRecords
                    .filter(r => r.type === 'receita')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell>{record.category}</TableCell>
                      <TableCell className="text-green-600 font-bold">
                        + R$ {record.amount.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status === 'pago' ? '✅ Pago' : 
                           record.status === 'pendente' ? '⏳ Pendente' : '❌ Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="bg-red-600 hover:bg-red-700"
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

        <TabsContent value="despesa">
          <Card>
            <CardHeader>
              <CardTitle>💸 Despesas</CardTitle>
              <CardDescription>
                Todas as despesas registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>🗑️ Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialRecords
                    .filter(r => r.type === 'despesa')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell>{record.category}</TableCell>
                      <TableCell className="text-red-600 font-bold">
                        - R$ {record.amount.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status === 'pago' ? '✅ Pago' : 
                           record.status === 'pendente' ? '⏳ Pendente' : '❌ Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="bg-red-600 hover:bg-red-700"
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

        <TabsContent value="pendente">
          <Card>
            <CardHeader>
              <CardTitle>⏳ Transações Pendentes</CardTitle>
              <CardDescription>
                Receitas e despesas que ainda não foram pagas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>🗑️ Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialRecords
                    .filter(r => r.status === 'pendente')
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(record.type)}>
                          {record.type === 'receita' ? '💰 Receita' : '💸 Despesa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.description}</TableCell>
                      <TableCell>{record.category}</TableCell>
                      <TableCell className={record.type === 'receita' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                        {record.type === 'receita' ? '+' : '-'} R$ {record.amount.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const success = await updateFinancialRecord(record.id, { status: 'pago' });
                              if (success) {
                                toast.success('✅ Status atualizado para PAGO!');
                              }
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Marcar como Pago
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(record)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(record)}
                            className="bg-red-600 hover:bg-red-700"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>
              Atualize as informações da transação financeira
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select onValueChange={(value) => setValueEdit('type', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">💰 Receita</SelectItem>
                    <SelectItem value="despesa">💸 Despesa</SelectItem>
                  </SelectContent>
                </Select>
                {errorsEdit.type && (
                  <p className="text-sm text-red-600">{errorsEdit.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-amount">Valor (R$)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...registerEdit('amount', { valueAsNumber: true })}
                />
                {errorsEdit.amount && (
                  <p className="text-sm text-red-600">{errorsEdit.amount.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Descrição</Label>
              <Input
                id="edit-description"
                placeholder="Descrição da transação"
                {...registerEdit('description')}
              />
              {errorsEdit.description && (
                <p className="text-sm text-red-600">{errorsEdit.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select onValueChange={(value) => setValueEdit('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {watchEditType === 'receita' ? (
                      <>
                        <SelectItem value="Consulta">Consulta</SelectItem>
                        <SelectItem value="Avaliação">Avaliação</SelectItem>
                        <SelectItem value="Terapia">Terapia</SelectItem>
                        <SelectItem value="Convênio">Convênio</SelectItem>
                        <SelectItem value="Particular">Particular</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="Aluguel">Aluguel</SelectItem>
                        <SelectItem value="Salários">Salários</SelectItem>
                        <SelectItem value="Equipamentos">Equipamentos</SelectItem>
                        <SelectItem value="Material">Material</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Impostos">Impostos</SelectItem>
                        <SelectItem value="Outros">Outros</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {errorsEdit.category && (
                  <p className="text-sm text-red-600">{errorsEdit.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-date">Data</Label>
                <Input
                  id="edit-date"
                  type="date"
                  {...registerEdit('date')}
                />
                {errorsEdit.date && (
                  <p className="text-sm text-red-600">{errorsEdit.date.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(value) => setValueEdit('status', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pago">✅ Pago</SelectItem>
                  <SelectItem value="pendente">⏳ Pendente</SelectItem>
                  <SelectItem value="cancelado">❌ Cancelado</SelectItem>
                </SelectContent>
              </Select>
              {errorsEdit.status && (
                <p className="text-sm text-red-600">{errorsEdit.status.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingEdit}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmittingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alerta de exclusão permanente */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">🗑️ Aviso Importante sobre Exclusões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-700 space-y-2">
            <p><strong>⚠️ ATENÇÃO:</strong> Todos os botões vermelhos de "Excluir" fazem <strong>EXCLUSÃO PERMANENTE</strong> do banco de dados.</p>
            <p><strong>❌ NÃO HÁ RECUPERAÇÃO</strong> após confirmar a exclusão.</p>
            <p><strong>✅ TESTE:</strong> Exclua um registro, recarregue a página - ele não voltará!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}