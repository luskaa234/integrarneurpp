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
import { MessageSquare, Send, Phone, Trash2, Users, Calendar, Clock, CheckCircle, AlertCircle, Settings, History, Plus } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface WhatsAppMessage {
  id: string;
  from_clinic: string;
  to_patient: string;
  patient_name: string;
  message: string;
  sent_at: string;
  status: 'sent' | 'delivered' | 'read';
  appointment_id?: string;
}

export function WhatsAppModule() {
  const { user } = useAuth();
  const { appointments, patients, doctors } = useApp();
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [clinicPhone, setClinicPhone] = useState('98974003414');
  const [messageTemplates, setMessageTemplates] = useState([
    'Olá {nome}! Sua consulta com {medico} está confirmada para {data} às {horario}. Clínica: {telefone_clinica}',
    'Olá {nome}! Lembramos que você tem consulta amanhã com {medico} às {horario}. Clínica: {telefone_clinica}',
    'Olá {nome}! Sua consulta foi reagendada para {data} às {horario}. Clínica: {telefone_clinica}',
    'Olá {nome}! Infelizmente precisamos cancelar sua consulta de {data}. Entraremos em contato para reagendar. Clínica: {telefone_clinica}'
  ]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    loadMessages();
    loadSettings();
  }, []);

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('whatsapp-messages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    }
  };

  const loadSettings = () => {
    const settings = localStorage.getItem('app-settings');
    if (settings) {
      try {
        const parsedSettings = JSON.parse(settings);
        if (parsedSettings.whatsapp_number) {
          setClinicPhone(parsedSettings.whatsapp_number);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  };

  const saveSettings = () => {
    const settings = JSON.parse(localStorage.getItem('app-settings') || '{}');
    settings.whatsapp_number = clinicPhone;
    localStorage.setItem('app-settings', JSON.stringify(settings));
    toast.success('✅ Configurações salvas!');
  };

  const sendWhatsAppMessage = async (patientPhone: string, patientName: string, message: string, appointmentId?: string) => {
    try {
      if (!patientPhone) {
        toast.error(`❌ ${patientName} não tem telefone cadastrado`);
        return false;
      }

      // Limpar telefone (remover caracteres especiais)
      const cleanPhone = patientPhone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        toast.error(`❌ Telefone inválido para ${patientName}: ${patientPhone}`);
        return false;
      }

      // Abrir WhatsApp Web
      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(message)}`;
      
      console.log(`📱 Enviando WhatsApp da clínica (${clinicPhone}) para ${patientName} (${cleanPhone})`);
      
      window.open(whatsappUrl, '_blank');
      
      // Salvar no histórico
      const newMessage: WhatsAppMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        from_clinic: clinicPhone,
        to_patient: cleanPhone,
        patient_name: patientName,
        message,
        sent_at: new Date().toISOString(),
        status: 'sent',
        appointment_id: appointmentId
      };
      
      const updatedMessages = [newMessage, ...messages];
      setMessages(updatedMessages);
      localStorage.setItem('whatsapp-messages', JSON.stringify(updatedMessages));
      
      toast.success(`✅ WhatsApp enviado para ${patientName}!`);
      return true;
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      toast.error(`❌ Erro ao enviar WhatsApp para ${patientName}`);
      return false;
    }
  };

  const sendBulkMessages = async () => {
    if (selectedPatients.length === 0) {
      toast.error('❌ Selecione pelo menos um paciente');
      return;
    }

    if (!customMessage.trim()) {
      toast.error('❌ Digite uma mensagem');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const patientId of selectedPatients) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        const personalizedMessage = customMessage
          .replace('{nome}', patient.name)
          .replace('{telefone_clinica}', clinicPhone);

        const success = await sendWhatsAppMessage(patient.phone || '', patient.name, personalizedMessage);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // Delay entre mensagens para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    toast.success(`✅ ${successCount} mensagens enviadas com sucesso! ${errorCount > 0 ? `❌ ${errorCount} falharam.` : ''}`);
    setSelectedPatients([]);
    setCustomMessage('');
    setIsDialogOpen(false);
  };

  const sendAppointmentConfirmation = async (appointmentId: string) => {
    const appointment = appointments.find(apt => apt.id === appointmentId);
    if (!appointment) {
      toast.error('❌ Consulta não encontrada');
      return;
    }

    const patient = patients.find(p => p.id === appointment.patient_id);
    const doctor = doctors.find(d => d.id === appointment.doctor_id);

    if (!patient || !doctor) {
      toast.error('❌ Dados do paciente ou médico não encontrados');
      return;
    }

    const message = `Olá ${patient.name}! Sua consulta com ${doctor.name} está confirmada para ${new Date(appointment.date).toLocaleDateString('pt-BR')} às ${appointment.time}. Clínica: ${clinicPhone}`;

    const success = await sendWhatsAppMessage(patient.phone || '', patient.name, message, appointmentId);
    
    if (success) {
      // Atualizar status da consulta para confirmado
      const { updateAppointment } = useApp();
      await updateAppointment(appointmentId, { status: 'confirmado' });
    }
  };

  const deleteMessage = (messageId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta mensagem do histórico?')) {
      const updatedMessages = messages.filter(m => m.id !== messageId);
      setMessages(updatedMessages);
      localStorage.setItem('whatsapp-messages', JSON.stringify(updatedMessages));
      toast.success('✅ Mensagem excluída do histórico!');
    }
  };

  const clearAllMessages = () => {
    if (window.confirm('Tem certeza que deseja LIMPAR TODO O HISTÓRICO de mensagens? Esta ação não pode ser desfeita.')) {
      setMessages([]);
      localStorage.removeItem('whatsapp-messages');
      toast.success('✅ Histórico de mensagens limpo!');
    }
  };

  const applyTemplate = (template: string) => {
    setCustomMessage(template);
  };

  const todayAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === today.toDateString() && apt.status !== 'cancelado';
  });

  const tomorrowAppointments = appointments.filter(apt => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const aptDate = new Date(apt.date);
    return aptDate.toDateString() === tomorrow.toDateString() && apt.status !== 'cancelado';
  });

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Paciente não encontrado';
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Médico não encontrado';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📱 WhatsApp Profissional</h1>
          <p className="text-gray-600 mt-2">
            Sistema universal de mensagens para todos os perfis com dados reais
          </p>
        </div>

        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Mensagem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>📱 Enviar Mensagem WhatsApp</DialogTitle>
                <DialogDescription>
                  Selecione pacientes e envie mensagens personalizadas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold">📞 Configurações da Clínica</Label>
                      <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor="clinic-phone">Telefone da Clínica:</Label>
                          <Input
                            id="clinic-phone"
                            value={clinicPhone}
                            onChange={(e) => setClinicPhone(e.target.value)}
                            placeholder="98974003414"
                            className="w-40"
                          />
                          <Button size="sm" onClick={saveSettings}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-bold">👥 Selecionar Pacientes</Label>
                      <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                        {patients.map((patient) => (
                          <div key={patient.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                            <input
                              type="checkbox"
                              id={`patient-${patient.id}`}
                              checked={selectedPatients.includes(patient.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedPatients([...selectedPatients, patient.id]);
                                } else {
                                  setSelectedPatients(selectedPatients.filter(id => id !== patient.id));
                                }
                              }}
                            />
                            <label htmlFor={`patient-${patient.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{patient.name}</div>
                              <div className="text-sm text-gray-500">
                                📞 {patient.phone || 'Sem telefone'}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {selectedPatients.length} paciente(s) selecionado(s)
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-bold">📝 Templates de Mensagem</Label>
                      <div className="mt-2 space-y-2">
                        {messageTemplates.map((template, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => applyTemplate(template)}
                            className="w-full text-left justify-start h-auto p-2"
                          >
                            <div className="text-xs text-gray-600 truncate">
                              {template.substring(0, 60)}...
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-bold">📋 Variáveis Disponíveis</Label>
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div><code>{'{nome}'}</code> - Nome do paciente</div>
                          <div><code>{'{medico}'}</code> - Nome do médico</div>
                          <div><code>{'{data}'}</code> - Data da consulta</div>
                          <div><code>{'{horario}'}</code> - Horário da consulta</div>
                          <div><code>{'{telefone_clinica}'}</code> - Telefone da clínica</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-message" className="text-base font-bold">✍️ Mensagem Personalizada</Label>
                  <Textarea
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={4}
                    placeholder="Digite sua mensagem personalizada aqui..."
                    className="font-medium"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={sendBulkMessages} className="bg-green-600 hover:bg-green-700">
                    <Send className="mr-2 h-4 w-4" />
                    📱 Enviar para {selectedPatients.length} paciente(s)
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={clearAllMessages}>
            <Trash2 className="mr-2 h-4 w-4" />
            Limpar Histórico
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{messages.length}</div>
            <p className="text-xs text-muted-foreground">Total de mensagens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Para confirmar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Amanhã</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{tomorrowAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Para lembrar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Cadastrados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quick-actions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quick-actions">Ações Rápidas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="today">Consultas Hoje</TabsTrigger>
          <TabsTrigger value="tomorrow">Consultas Amanhã</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-actions">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>🚀 Ações Rápidas</CardTitle>
                <CardDescription>
                  Envie mensagens rapidamente para grupos específicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const patientsWithPhone = patients.filter(p => p.phone);
                    setSelectedPatients(patientsWithPhone.map(p => p.id));
                    setCustomMessage('Olá {nome}! Esperamos você em nossa clínica. Qualquer dúvida, entre em contato: {telefone_clinica}');
                    setIsDialogOpen(true);
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Mensagem para Todos os Pacientes
                </Button>

                <Button 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    const todayPatients = todayAppointments.map(apt => apt.patient_id);
                    setSelectedPatients(todayPatients);
                    setCustomMessage('Olá {nome}! Lembramos que você tem consulta hoje com {medico} às {horario}. Clínica: {telefone_clinica}');
                    setIsDialogOpen(true);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Confirmar Consultas de Hoje
                </Button>

                <Button 
                  className="w-full justify-start bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => {
                    const tomorrowPatients = tomorrowAppointments.map(apt => apt.patient_id);
                    setSelectedPatients(tomorrowPatients);
                    setCustomMessage('Olá {nome}! Lembramos que você tem consulta amanhã com {medico} às {horario}. Clínica: {telefone_clinica}');
                    setIsDialogOpen(true);
                  }}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Lembrar Consultas de Amanhã
                </Button>

                <Button 
                  className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setSelectedPatients([]);
                    setCustomMessage('');
                    setIsDialogOpen(true);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Mensagem Personalizada
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>⚙️ Configurações</CardTitle>
                <CardDescription>
                  Configure o sistema de WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clinic-phone-config">📞 Telefone da Clínica</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="clinic-phone-config"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      placeholder="98974003414"
                    />
                    <Button onClick={saveSettings}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Número que aparecerá nas mensagens enviadas
                  </p>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-2">📋 Como Funciona:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Selecione os pacientes desejados</li>
                    <li>• Personalize a mensagem com variáveis</li>
                    <li>• O sistema abre o WhatsApp Web automaticamente</li>
                    <li>• Todas as mensagens são salvas no histórico</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>📜 Histórico de Mensagens</CardTitle>
              <CardDescription>
                Todas as mensagens enviadas pelo sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Mensagem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        {new Date(message.sent_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {message.patient_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          📞 {message.to_patient}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={message.message}>
                          {message.message.substring(0, 50)}...
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={message.status === 'sent' ? 'default' : 'secondary'}>
                          {message.status === 'sent' ? '📤 Enviado' : '📥 Entregue'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {messages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  📭 Nenhuma mensagem enviada ainda
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>📅 Consultas de Hoje</CardTitle>
              <CardDescription>
                Envie confirmações para as consultas de hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patient_id);
                    const doctor = doctors.find(d => d.id === appointment.doctor_id);
                    
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-bold">{appointment.time}</TableCell>
                        <TableCell>{patient?.name || 'N/A'}</TableCell>
                        <TableCell>{doctor?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            📞 {patient?.phone || 'Sem telefone'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            appointment.status === 'confirmado' ? 'default' :
                            appointment.status === 'agendado' ? 'secondary' : 'outline'
                          }>
                            {appointment.status === 'confirmado' ? '✅ Confirmado' :
                             appointment.status === 'agendado' ? '⏳ Agendado' : appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => sendAppointmentConfirmation(appointment.id)}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!patient?.phone}
                          >
                            <MessageSquare className="mr-1 h-4 w-4" />
                            Confirmar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {todayAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  📅 Nenhuma consulta agendada para hoje
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tomorrow">
          <Card>
            <CardHeader>
              <CardTitle>📅 Consultas de Amanhã</CardTitle>
              <CardDescription>
                Envie lembretes para as consultas de amanhã
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tomorrowAppointments.map((appointment) => {
                    const patient = patients.find(p => p.id === appointment.patient_id);
                    const doctor = doctors.find(d => d.id === appointment.doctor_id);
                    
                    return (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-bold">{appointment.time}</TableCell>
                        <TableCell>{patient?.name || 'N/A'}</TableCell>
                        <TableCell>{doctor?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            📞 {patient?.phone || 'Sem telefone'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            appointment.status === 'confirmado' ? 'default' :
                            appointment.status === 'agendado' ? 'secondary' : 'outline'
                          }>
                            {appointment.status === 'confirmado' ? '✅ Confirmado' :
                             appointment.status === 'agendado' ? '⏳ Agendado' : appointment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => {
                              const message = `Olá ${patient?.name}! Lembramos que você tem consulta amanhã com ${doctor?.name} às ${appointment.time}. Clínica: ${clinicPhone}`;
                              sendWhatsAppMessage(patient?.phone || '', patient?.name || '', message, appointment.id);
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700"
                            disabled={!patient?.phone}
                          >
                            <Clock className="mr-1 h-4 w-4" />
                            Lembrar
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {tomorrowAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  📅 Nenhuma consulta agendada para amanhã
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}