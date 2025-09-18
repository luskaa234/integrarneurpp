"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Phone,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  Edit,
  X,
  Eye,
  Send
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export function AgendamentoDashboard() {
  const { appointments, patients, doctors, updateAppointment } = useApp();
  const [isAlertsDialogOpen, setIsAlertsDialogOpen] = useState(false);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [customMessage, setCustomMessage] = useState('');

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() + 7);

  // Métricas específicas para agendamento
  const todayAppointments = appointments.filter(apt => 
    new Date(apt.date).toDateString() === today.toDateString()
  );

  const tomorrowAppointments = appointments.filter(apt => 
    new Date(apt.date).toDateString() === tomorrow.toDateString()
  );

  const thisWeekAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= today && aptDate <= thisWeek;
  });

  const pendingConfirmations = appointments.filter(apt => apt.status === 'agendado');
  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmado');
  const canceledToday = appointments.filter(apt => 
    apt.status === 'cancelado' && 
    new Date(apt.date).toDateString() === today.toDateString()
  );

  // Próximos agendamentos que precisam de atenção
  const upcomingAppointments = appointments
    .filter(apt => new Date(apt.date) >= today && apt.status !== 'cancelado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Paciente não encontrado';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Médico não encontrado';
  };

  const getPatientPhone = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient?.phone || 'Não informado';
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    const success = await updateAppointment(appointmentId, { status: 'confirmado' });
    if (success) {
      toast.success('Consulta confirmada!');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      const success = await updateAppointment(appointmentId, { status: 'cancelado' });
      if (success) {
        toast.success('Consulta cancelada!');
      }
    }
  };

  const handleConfirmAll = async () => {
    if (window.confirm(`Confirmar todas as ${pendingConfirmations.length} consultas pendentes?`)) {
      let successCount = 0;
      
      for (const appointment of pendingConfirmations) {
        const success = await updateAppointment(appointment.id, { status: 'confirmado' });
        if (success) successCount++;
      }
      
      toast.success(`${successCount} consultas confirmadas!`);
    }
  };

  const handleSendWhatsApp = async (appointment: any, message?: string) => {
    const patient = patients.find(p => p.id === appointment.patient_id);
    const doctor = doctors.find(d => d.id === appointment.doctor_id);
    
    if (!patient || !doctor) {
      toast.error('Erro ao encontrar dados do paciente ou médico');
      return;
    }

    const finalMessage = message || `Olá ${patient.name}! Sua consulta com ${doctor.name} está confirmada para ${new Date(appointment.date).toLocaleDateString('pt-BR')} às ${appointment.time}. Neuro Integrar.`;
    const whatsappUrl = `https://contate.me/5598984692267?text=${encodeURIComponent(finalMessage)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto para envio!');
  };

  const handleCustomMessage = (appointment: any) => {
    setSelectedAppointment(appointment);
    const patient = patients.find(p => p.id === appointment.patient_id);
    const doctor = doctors.find(d => d.id === appointment.doctor_id);
    
    const defaultMessage = `Olá ${patient?.name}! Sua consulta com ${doctor?.name} está confirmada para ${new Date(appointment.date).toLocaleDateString('pt-BR')} às ${appointment.time}. Neuro Integrar.`;
    setCustomMessage(defaultMessage);
    setIsMessageDialogOpen(true);
  };

  const sendBulkReminders = async () => {
    const tomorrowPending = tomorrowAppointments.filter(apt => apt.status === 'agendado');
    
    if (tomorrowPending.length === 0) {
      toast.error('Nenhuma consulta pendente para amanhã');
      return;
    }

    if (window.confirm(`Enviar lembretes para ${tomorrowPending.length} consultas de amanhã?`)) {
      let successCount = 0;
      
      for (const appointment of tomorrowPending) {
        const patient = patients.find(p => p.id === appointment.patient_id);
        const doctor = doctors.find(d => d.id === appointment.doctor_id);
        
        if (patient && doctor) {
          const message = `Olá ${patient.name}! Lembramos que você tem consulta amanhã com ${doctor.name} às ${appointment.time}. Neuro Integrar.`;
          const whatsappUrl = `https://contate.me/5598984692267?text=${encodeURIComponent(message)}`;
          
          window.open(whatsappUrl, '_blank');
          successCount++;
          
          // Delay entre aberturas
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      toast.success(`${successCount} lembretes enviados!`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard - Agendamento</h1>
        <p className="text-gray-600 mt-2">
          Visão completa da agenda e controle de consultas
        </p>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedAppointments.filter(apt => 
                new Date(apt.date).toDateString() === today.toDateString()
              ).length} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amanhã</CardTitle>
            <CalendarDays className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tomorrowAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Consultas agendadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingConfirmations.length}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisWeekAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de consultas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximas consultas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Próximas Consultas
            </CardTitle>
            <CardDescription>
              Consultas que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">{getPatientName(appointment.patient_id)}</p>
                      <Badge variant={
                        appointment.status === 'confirmado' ? 'default' :
                        appointment.status === 'agendado' ? 'secondary' : 'outline'
                      }>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getDoctorName(appointment.doctor_id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCustomMessage(appointment)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleConfirmAppointment(appointment.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {upcomingAppointments.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Nenhuma consulta próxima
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alertas e ações rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Alertas e Ações
            </CardTitle>
            <CardDescription>
              Itens que precisam de atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingConfirmations.length > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <div>
                        <p className="font-medium text-yellow-800">
                          {pendingConfirmations.length} consulta{pendingConfirmations.length !== 1 ? 's' : ''} pendente{pendingConfirmations.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-yellow-700">
                          Confirme as consultas para evitar faltas
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" onClick={handleConfirmAll}>
                      Confirmar Todas
                    </Button>
                    <Dialog open={isAlertsDialogOpen} onOpenChange={setIsAlertsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Eye className="mr-1 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-5xl">
                        <DialogHeader>
                          <DialogTitle>Consultas Pendentes de Confirmação</DialogTitle>
                          <DialogDescription>
                            Gerencie todas as consultas que aguardam confirmação
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data/Hora</TableHead>
                                <TableHead>Paciente</TableHead>
                                <TableHead>Médico</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Telefone</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pendingConfirmations.map((appointment) => (
                                <TableRow key={appointment.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">
                                        {new Date(appointment.date).toLocaleDateString('pt-BR')}
                                      </p>
                                      <p className="text-sm text-gray-500">{appointment.time}</p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {getPatientName(appointment.patient_id)}
                                  </TableCell>
                                  <TableCell>
                                    {getDoctorName(appointment.doctor_id)}
                                  </TableCell>
                                  <TableCell>{appointment.type}</TableCell>
                                  <TableCell>
                                    {getPatientPhone(appointment.patient_id)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleConfirmAppointment(appointment.id)}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Confirmar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCustomMessage(appointment)}
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleCancelAppointment(appointment.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}

              {canceledToday.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="font-medium text-red-800">
                        {canceledToday.length} cancelamento{canceledToday.length !== 1 ? 's' : ''} hoje
                      </p>
                      <p className="text-sm text-red-700">
                        Verifique se há horários disponíveis para reagendar
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {tomorrowAppointments.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="font-medium text-blue-800">
                          Lembrete para amanhã
                        </p>
                        <p className="text-sm text-blue-700">
                          {tomorrowAppointments.length} consulta{tomorrowAppointments.length !== 1 ? 's' : ''} agendada{tomorrowAppointments.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={sendBulkReminders}>
                    Enviar Lembretes
                  </Button>
                </div>
              )}

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium text-green-800">
                      Sistema funcionando
                    </p>
                    <p className="text-sm text-green-700">
                      Todos os módulos operacionais
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultas de hoje detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Hoje</CardTitle>
          <CardDescription>
            Todas as consultas programadas para hoje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todayAppointments
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((appointment) => (
              <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="font-bold text-lg">{appointment.time}</p>
                    <p className="text-xs text-gray-500">
                      {appointment.type}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">{getPatientName(appointment.patient_id)}</p>
                    <p className="text-sm text-gray-600">{getDoctorName(appointment.doctor_id)}</p>
                    <p className="text-xs text-gray-500">
                      Tel: {getPatientPhone(appointment.patient_id)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={
                    appointment.status === 'confirmado' ? 'default' :
                    appointment.status === 'agendado' ? 'secondary' :
                    appointment.status === 'realizado' ? 'outline' : 'destructive'
                  }>
                    {appointment.status}
                  </Badge>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCustomMessage(appointment)}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleConfirmAppointment(appointment.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {todayAppointments.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                Nenhuma consulta agendada para hoje
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar mensagem personalizada */}
      <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Mensagem do WhatsApp</DialogTitle>
            <DialogDescription>
              Personalize a mensagem que será enviada para o paciente
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Detalhes da Consulta:</h4>
                <p><strong>Paciente:</strong> {getPatientName(selectedAppointment.patient_id)}</p>
                <p><strong>Médico:</strong> {getDoctorName(selectedAppointment.doctor_id)}</p>
                <p><strong>Data:</strong> {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')} às {selectedAppointment.time}</p>
                <p><strong>Tipo:</strong> {selectedAppointment.type}</p>
                <p><strong>Telefone:</strong> {getPatientPhone(selectedAppointment.patient_id)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-message">Mensagem Personalizada:</Label>
                <Textarea
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  placeholder="Digite sua mensagem personalizada..."
                />
                <p className="text-xs text-gray-500">
                  Dica: Personalize a mensagem conforme necessário para cada paciente
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    handleSendWhatsApp(selectedAppointment, customMessage);
                    setIsMessageDialogOpen(false);
                  }}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}