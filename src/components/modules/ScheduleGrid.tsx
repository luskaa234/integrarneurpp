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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, Trash2, Clock, ChevronLeft, ChevronRight, CheckCircle, X, Edit, AlertTriangle, Eye } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import type { Appointment } from '@/contexts/AppContext';


const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Paciente é obrigatório'),
  doctor_id: z.string().min(1, 'Médico é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Horário é obrigatório'),
  type: z.string().min(1, 'Tipo de consulta é obrigatório'),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  notes: z.string().optional()
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export function ScheduleGrid() {
  const { user } = useAuth();
  const { appointments, doctors, patients, services, addAppointment, updateAppointment, deleteAppointment } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [selectedService, setSelectedService] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema)
  });

  const watchDate = watch('date');
  const watchTime = watch('time');

  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.name === selectedService);
      if (service) {
        setValue('price', service.price);
      }
    }
  }, [selectedService, services, setValue]);

  // Horários fixos até 21:00
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    slots.push('21:00'); // Último horário
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const activeServices = services.filter(s => s.is_active);

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedDate);

  const getAppointmentForSlot = (date: Date, time: string) => {
    return appointments.find(apt => {
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === date.toDateString() && 
             apt.time === time && 
             apt.status !== 'cancelado';
    });
  };

  // VALIDAÇÃO RIGOROSA: Apenas 1 consulta por horário
  const isSlotAvailable = (date: string, time: string, excludeId?: string) => {
    const conflict = appointments.find(apt => 
      apt.date === date && 
      apt.time === time && 
      apt.status !== 'cancelado' &&
      apt.id !== excludeId
    );
    
    return !conflict;
  };

  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : 'Médico não encontrado';
  };

  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : 'Paciente não encontrado';
  };

  const onSubmitNewAppointment = async (data: AppointmentFormData) => {
  // VALIDAÇÃO RIGOROSA ANTES DE SALVAR
  if (!isSlotAvailable(data.date, data.time)) {
    const existingAppointment = appointments.find(
      apt =>
        apt.date === data.date &&
        apt.time === data.time &&
        apt.status !== 'cancelado'
    );

    if (existingAppointment) {
      const patientName = getPatientName(existingAppointment.patient_id);
      const doctorName = getDoctorName(existingAppointment.doctor_id);
      toast.error(
        `❌ HORÁRIO OCUPADO! ${patientName} já tem consulta com ${doctorName} agendada para ${new Date(
          data.date
        ).toLocaleDateString('pt-BR')} às ${data.time}`
      );
      return;
    }
  }

  // monta o payload exatamente como o tipo Omit<Appointment, 'id' | 'created_at'>
  const payload: Omit<Appointment, 'id' | 'created_at'> = {
  patient_id: data.patient_id!,   // obrigatório, vem do form
  doctor_id: data.doctor_id!,     // obrigatório, vem do form
  date: data.date!,               // obrigatório, string YYYY-MM-DD
  time: data.time!,               // obrigatório, string HH:mm
  type: data.type ?? 'consulta',  // campo "type" sempre presente (fallback 'consulta')
  price: data.price ?? 0,         // garante número, default 0
  notes: data.notes ?? '',        // opcional, vira string vazia se não houver
  status: 'agendado'              // literal do union, agora válido
};


  const success = await addAppointment(payload);


  if (success) {
    reset();
    setSelectedService('');
    setIsNewAppointmentOpen(false);
    toast.success('✅ Consulta agendada com sucesso!');
  }
};

  const handleDeleteAppointment = async (appointment: any) => {
    if (window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE a consulta de ${getPatientName(appointment.patient_id)}?`)) {
      const success = await deleteAppointment(appointment.id);
      if (success) {
        setIsDialogOpen(false);
        toast.success('✅ Consulta excluída! Horário liberado.');
      }
    }
  };

  const handleCancelAppointment = async (appointment: any) => {
    if (window.confirm(`Tem certeza que deseja CANCELAR a consulta de ${getPatientName(appointment.patient_id)}? O horário ficará disponível novamente.`)) {
      const success = await updateAppointment(appointment.id, { status: 'cancelado' });
      if (success) {
        setIsDialogOpen(false);
        toast.success('✅ Consulta cancelada! Horário liberado para novo agendamento.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-700';
      case 'agendado': return 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-700';
      case 'realizado': return 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700';
      default: return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white border-gray-700';
    }
  };

  const handleSlotClick = (date: Date, time: string) => {
    const appointment = getAppointmentForSlot(date, time);
    if (appointment) {
      setEditingAppointment(appointment);
      setIsDialogOpen(true);
    } else {
      const dateString = date.toISOString().split('T')[0];
      if (!isSlotAvailable(dateString, time)) {
        const existingAppointment = appointments.find(apt => 
          apt.date === dateString && 
          apt.time === time && 
          apt.status !== 'cancelado'
        );
        
        if (existingAppointment) {
          const patientName = getPatientName(existingAppointment.patient_id);
          const doctorName = getDoctorName(existingAppointment.doctor_id);
          toast.error(`❌ HORÁRIO OCUPADO! ${patientName} já tem consulta com ${doctorName} neste horário.`);
        }
        return;
      }
      
      setValue('date', dateString);
      setValue('time', time);
      setIsNewAppointmentOpen(true);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDateRange = () => {
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    return `${firstDay.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${lastDay.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
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

  const pendingAppointments = appointments.filter(apt => apt.status === 'agendado');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📅 Sistema de Agendamento Profissional</h1>
          <p className="text-gray-600 mt-2">
            <strong>🔒 VALIDAÇÃO RIGOROSA:</strong> Apenas 1 consulta por horário | Horários: 08:00 às 21:00
          </p>
        </div>

        <Dialog open={isNewAppointmentOpen} onOpenChange={setIsNewAppointmentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Nova Consulta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agendar Nova Consulta</DialogTitle>
              <DialogDescription>
                🔒 Sistema com validação rigorosa - Apenas 1 consulta por horário
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmitNewAppointment)} className="space-y-4">
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
                          {patient.name} - {patient.phone || 'Sem telefone'}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
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
                  <Label>Horário</Label>
                  <Select onValueChange={(value) => setValue('time', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => {
                        const isAvailable = watchDate ? isSlotAvailable(watchDate, time) : true;
                        
                        return (
                          <SelectItem 
                            key={time} 
                            value={time}
                            disabled={!isAvailable}
                            className={!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={!isAvailable ? 'line-through' : ''}>{time}</span>
                              {!isAvailable && (
                                <span className="text-xs text-red-500 font-bold ml-2">
                                  ❌ OCUPADO
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.time && (
                    <p className="text-sm text-red-600">{errors.time.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select onValueChange={(value) => {
                  setSelectedService(value);
                  setValue('type', value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeServices.map((service) => (
                      <SelectItem key={service.id} value={service.name}>
                        <div className="flex justify-between items-center w-full">
                          <span>{service.name}</span>
                          <span className="text-green-600 font-medium ml-2">
                            R$ {service.price.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-600">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="300.00"
                  {...register('price', { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre a consulta..."
                  {...register('notes')}
                />
              </div>

              {/* Alerta de validação */}
              {watchDate && watchTime && !isSlotAvailable(watchDate, watchTime) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                    <p className="text-red-800 font-medium">
                      ❌ HORÁRIO OCUPADO! Escolha outro horário disponível.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsNewAppointmentOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || (watchDate && watchTime && !isSlotAvailable(watchDate, watchTime))}
                >
                  {isSubmitting ? 'Agendando...' : 'Agendar Consulta'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">📊 Agenda Visual (Excel)</TabsTrigger>
          <TabsTrigger value="today">📅 Hoje ({todayAppointments.length})</TabsTrigger>
          <TabsTrigger value="tomorrow">🌅 Amanhã ({tomorrowAppointments.length})</TabsTrigger>
          <TabsTrigger value="pending">⏳ Pendentes ({pendingAppointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          {/* Agenda Estilo Excel */}
          <Card className="shadow-xl border-2 border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-100 via-blue-50 to-purple-100 border-b-2 border-purple-200">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center text-xl">
                    <Calendar className="mr-2 h-6 w-6 text-purple-600" />
                    Agenda Semanal Profissional (08:00 - 21:00)
                  </CardTitle>
                  <CardDescription className="text-base">
                    {formatDateRange()} - 🔒 Validação rigorosa: 1 consulta por horário
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button variant="outline" size="sm" onClick={goToToday} className="bg-purple-200 hover:bg-purple-300">
                    Hoje
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[1400px]">
                  {/* Cabeçalho dos dias */}
                  <div className="grid grid-cols-8 border-b-3 border-purple-300">
                    <div className="p-4 text-center font-bold text-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 border-r-3 border-purple-300">
                      <Clock className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                      <div className="text-sm font-bold">HORÁRIO</div>
                    </div>
                    {weekDates.map((date, index) => {
                      const isToday = date.toDateString() === new Date().toDateString();
                      const dayAppointments = appointments.filter(apt => 
                        new Date(apt.date).toDateString() === date.toDateString() && apt.status !== 'cancelado'
                      );
                      
                      return (
                        <div key={index} className={`p-4 text-center font-bold border-r-2 border-purple-200  ${
                          isToday ? 'bg-gradient-to-br from-purple-200 to-purple-300 text-purple-900' : 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700'
                        }`}>
                          <div className="text-sm font-bold">
                            {date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                          </div>
                          <div className={`text-3xl font-bold ${isToday ? 'text-purple-700' : 'text-gray-800'}`}>
                            {date.getDate()}
                          </div>
                          <div className="text-xs text-gray-600 font-medium">
                            {date.toLocaleDateString('pt-BR', { month: 'short' })}
                          </div>
                          <div className="mt-2">
                            <Badge variant={isToday ? 'default' : 'outline'} className="text-xs font-bold">
                              {dayAppointments.length} consulta{dayAppointments.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid de horários */}
                  <div className="space-y-0 max-h-[600px] overflow-y-auto">
                    {timeSlots.map((time) => (
                      <div key={time} className="grid grid-cols-8 border-b border-purple-100 hover:bg-purple-25">
                        <div className="p-4 text-center font-bold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-150 border-r-2 border-purple-200 flex items-center justify-center">
                          <div>
                            <Clock className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                            <span className="text-lg font-bold">{time}</span>
                          </div>
                        </div>
                        {weekDates.map((date, dateIndex) => {
                          const appointment = getAppointmentForSlot(date, time);
                          const isToday = date.toDateString() === new Date().toDateString();
                          
                          return (
                            <div
                              key={`${time}-${dateIndex}`}
                              className={`min-h-[100px] border-r border-purple-100 cursor-pointer transition-all duration-300 hover:shadow-lg relative ${
                                appointment 
                                  ? `${getStatusColor(appointment.status)} transform hover:scale-105` 
                                  : `bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-blue-50 ${
                                      isToday ? 'border-l-4 border-l-purple-400 bg-purple-25' : ''
                                    }`
                              }`}
                              onClick={() => handleSlotClick(date, time)}
                            >
                              {appointment ? (
                                <div className="p-2 h-full flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <div className="text-xs font-bold text-center">
                                      {getPatientName(appointment.patient_id)}
                                    </div>
                                    <div className="text-xs text-center opacity-90">
                                      {getDoctorName(appointment.doctor_id)}
                                    </div>
                                    <div className="text-xs text-center opacity-90 font-medium">
                                      R$ {appointment.price.toLocaleString('pt-BR')}
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs bg-white bg-opacity-30 px-1 py-1 rounded text-center font-bold">
                                    {appointment.status.toUpperCase()}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <div className="text-center text-gray-400">
                                    <div className="text-xs font-medium">Disponível</div>
                                    <div className="text-xs">{time}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="today">
          <Card>
            <CardHeader>
              <CardTitle>📅 Consultas de Hoje</CardTitle>
              <CardDescription>
                Todas as consultas agendadas para hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-bold text-purple-600">{appointment.time}</TableCell>
                      <TableCell className="font-medium">{getPatientName(appointment.patient_id)}</TableCell>
                      <TableCell>{getDoctorName(appointment.doctor_id)}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        R$ {appointment.price.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          appointment.status === 'confirmado' ? 'default' :
                          appointment.status === 'agendado' ? 'secondary' :
                          appointment.status === 'realizado' ? 'outline' : 'destructive'
                        }>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAppointment(appointment);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateAppointment(appointment.id, { status: 'confirmado' });
                              toast.success('✅ Consulta confirmada!');
                            }}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
              <CardTitle>🌅 Consultas de Amanhã</CardTitle>
              <CardDescription>
                Consultas agendadas para amanhã
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tomorrowAppointments
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell className="font-bold text-blue-600">{appointment.time}</TableCell>
                      <TableCell className="font-medium">{getPatientName(appointment.patient_id)}</TableCell>
                      <TableCell>{getDoctorName(appointment.doctor_id)}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        R$ {appointment.price.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          appointment.status === 'confirmado' ? 'default' :
                          appointment.status === 'agendado' ? 'secondary' : 'outline'
                        }>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAppointment(appointment);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {tomorrowAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  🌅 Nenhuma consulta agendada para amanhã
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>⏳ Consultas Pendentes</CardTitle>
              <CardDescription>
                Consultas que aguardam confirmação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingAppointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{new Date(appointment.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-bold text-yellow-600">{appointment.time}</TableCell>
                      <TableCell className="font-medium">{getPatientName(appointment.patient_id)}</TableCell>
                      <TableCell>{getDoctorName(appointment.doctor_id)}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        R$ {appointment.price.toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              updateAppointment(appointment.id, { status: 'confirmado' });
                              toast.success('✅ Consulta confirmada!');
                            }}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingAppointment(appointment);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pendingAppointments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  ✅ Nenhuma consulta pendente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de detalhes da consulta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Consulta</DialogTitle>
            <DialogDescription>
              Visualize e gerencie todos os aspectos da consulta
            </DialogDescription>
          </DialogHeader>
          {editingAppointment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-purple-800">Informações da Consulta</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Paciente</label>
                      <p className="text-base font-bold text-gray-800">
                        {getPatientName(editingAppointment.patient_id)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Médico</label>
                      <p className="text-base font-bold text-gray-800">
                        {getDoctorName(editingAppointment.doctor_id)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data</label>
                        <p className="text-base font-bold text-gray-800">
                          {new Date(editingAppointment.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Horário</label>
                        <p className="text-base font-bold text-gray-800">{editingAppointment.time}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Valor</label>
                      <p className="text-lg font-bold text-green-600">
                        R$ {editingAppointment.price.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-blue-800">Controles</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status da Consulta</label>
                      <Select
  value={editingAppointment.status}
  onValueChange={(value) => {
    const typedValue = value as Appointment['status']; // 👈 força para o union correto
    updateAppointment(editingAppointment.id, { status: typedValue });
    setEditingAppointment({ ...editingAppointment, status: typedValue });
    toast.success('✅ Status atualizado!');
  }}
>

                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agendado">🟡 Agendado</SelectItem>
                          <SelectItem value="confirmado">🟢 Confirmado</SelectItem>
                          <SelectItem value="realizado">🔵 Realizado</SelectItem>
                          <SelectItem value="cancelado">🔴 Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-600">Observações</label>
                      <Textarea
                        value={editingAppointment.notes || ''}
                        onChange={(e) => {
                          updateAppointment(editingAppointment.id, { notes: e.target.value });
                          setEditingAppointment({ ...editingAppointment, notes: e.target.value });
                        }}
                        placeholder="Adicione observações sobre a consulta..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateAppointment(editingAppointment.id, { status: 'confirmado' });
                      setEditingAppointment({ ...editingAppointment, status: 'confirmado' });
                      toast.success('✅ Consulta confirmada!');
                    }}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleCancelAppointment(editingAppointment)}
                    className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Cancelar Consulta
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteAppointment(editingAppointment)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir Permanentemente
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Fechar
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