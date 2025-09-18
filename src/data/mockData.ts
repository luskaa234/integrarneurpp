import { Doctor, Patient, Appointment, FinancialRecord, User } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Dr. João Silva',
    email: 'joao@neurointegrar.com',
    role: 'medico',
    createdAt: new Date('2024-01-15'),
    isActive: true
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: 'maria@neurointegrar.com',
    role: 'medico',
    createdAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana@neurointegrar.com',
    role: 'agendamento',
    createdAt: new Date('2024-02-01'),
    isActive: true
  }
];

export const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. João Silva',
    email: 'joao@neurointegrar.com',
    role: 'medico',
    crm: '12345-SP',
    specialty: 'Neurologia',
    phone: '(11) 99999-1111',
    createdAt: new Date('2024-01-15'),
    isActive: true,
    schedule: [
      { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isAvailable: true },
      { dayOfWeek: 5, startTime: '08:00', endTime: '12:00', isAvailable: true }
    ]
  },
  {
    id: '2',
    name: 'Dra. Maria Santos',
    email: 'maria@neurointegrar.com',
    role: 'medico',
    crm: '67890-SP',
    specialty: 'Neuropsicologia',
    phone: '(11) 99999-2222',
    createdAt: new Date('2024-01-20'),
    isActive: true,
    schedule: [
      { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isAvailable: true },
      { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isAvailable: true }
    ]
  }
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Carlos Oliveira',
    email: 'carlos@email.com',
    role: 'paciente',
    cpf: '123.456.789-00',
    birthDate: new Date('1985-03-15'),
    phone: '(11) 98888-1111',
    address: 'Rua das Flores, 123 - São Paulo/SP',
    createdAt: new Date('2024-02-10'),
    isActive: true,
    medicalRecord: [],
    appointments: []
  },
  {
    id: '2',
    name: 'Fernanda Lima',
    email: 'fernanda@email.com',
    role: 'paciente',
    cpf: '987.654.321-00',
    birthDate: new Date('1990-07-22'),
    phone: '(11) 98888-2222',
    address: 'Av. Paulista, 456 - São Paulo/SP',
    createdAt: new Date('2024-02-15'),
    isActive: true,
    medicalRecord: [],
    appointments: []
  },
  {
    id: '3',
    name: 'Roberto Silva',
    email: 'roberto@email.com',
    role: 'paciente',
    cpf: '456.789.123-00',
    birthDate: new Date('1978-11-08'),
    phone: '(11) 98888-3333',
    address: 'Rua Augusta, 789 - São Paulo/SP',
    createdAt: new Date('2024-02-20'),
    isActive: true,
    medicalRecord: [],
    appointments: []
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientId: '1',
    doctorId: '1',
    date: new Date('2024-12-20'),
    time: '09:00',
    status: 'confirmado',
    type: 'Consulta Inicial',
    notes: 'Primeira consulta neurológica',
    price: 300
  },
  {
    id: '2',
    patientId: '2',
    doctorId: '2',
    date: new Date('2024-12-20'),
    time: '10:30',
    status: 'agendado',
    type: 'Avaliação Neuropsicológica',
    notes: 'Avaliação completa',
    price: 450
  },
  {
    id: '3',
    patientId: '3',
    doctorId: '1',
    date: new Date('2024-12-21'),
    time: '14:00',
    status: 'confirmado',
    type: 'Retorno',
    notes: 'Acompanhamento do tratamento',
    price: 250
  },
  {
    id: '4',
    patientId: '1',
    doctorId: '2',
    date: new Date('2024-12-22'),
    time: '11:00',
    status: 'agendado',
    type: 'Terapia',
    notes: 'Sessão de reabilitação',
    price: 200
  }
];

export const mockFinancialRecords: FinancialRecord[] = [
  {
    id: '1',
    type: 'receita',
    amount: 300,
    description: 'Consulta - Carlos Oliveira',
    category: 'Consulta',
    date: new Date('2024-12-15'),
    appointmentId: '1',
    status: 'pago'
  },
  {
    id: '2',
    type: 'receita',
    amount: 450,
    description: 'Avaliação - Fernanda Lima',
    category: 'Avaliação',
    date: new Date('2024-12-16'),
    appointmentId: '2',
    status: 'pendente'
  },
  {
    id: '3',
    type: 'despesa',
    amount: 1200,
    description: 'Aluguel do consultório',
    category: 'Infraestrutura',
    date: new Date('2024-12-01'),
    status: 'pago'
  },
  {
    id: '4',
    type: 'receita',
    amount: 250,
    description: 'Retorno - Roberto Silva',
    category: 'Consulta',
    date: new Date('2024-12-18'),
    appointmentId: '3',
    status: 'pago'
  },
  {
    id: '5',
    type: 'despesa',
    amount: 350,
    description: 'Material de escritório',
    category: 'Suprimentos',
    date: new Date('2024-12-10'),
    status: 'pago'
  }
];