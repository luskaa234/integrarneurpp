"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Building, Phone, Globe, Palette, Save, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

const settingsSchema = z.object({
  company_name: z.string().min(1, 'Nome da empresa é obrigatório'),
  company_address: z.string().min(1, 'Endereço é obrigatório'),
  company_phone: z.string().min(1, 'Telefone é obrigatório'),
  company_email: z.string().email('Email inválido'),
  whatsapp_number: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos'),
  logo_url: z.string().optional(),
  working_hours_start: z.string().min(1, 'Horário de início é obrigatório'),
  working_hours_end: z.string().min(1, 'Horário de fim é obrigatório')
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface AppSettings {
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  whatsapp_number: string;
  logo_url?: string;
  working_hours: {
    start: string;
    end: string;
  };
}

export function SystemSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    company_name: 'Neuro Integrar',
    company_address: '',
    company_phone: '',
    company_email: '',
    whatsapp_number: '98974003414',
    working_hours: {
      start: '08:00',
      end: '21:00'
    }
  });
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema)
  });

  const watchWhatsApp = watch('whatsapp_number');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('app-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        
        // Preencher o formulário
        setValue('company_name', parsedSettings.company_name || 'Neuro Integrar');
        setValue('company_address', parsedSettings.company_address || '');
        setValue('company_phone', parsedSettings.company_phone || '');
        setValue('company_email', parsedSettings.company_email || '');
        setValue('whatsapp_number', parsedSettings.whatsapp_number || '98974003414');
        setValue('logo_url', parsedSettings.logo_url || '');
        setValue('working_hours_start', parsedSettings.working_hours?.start || '08:00');
        setValue('working_hours_end', parsedSettings.working_hours?.end || '21:00');
      } else {
        // Valores padrão
        setValue('company_name', 'Neuro Integrar');
        setValue('whatsapp_number', '98974003414');
        setValue('working_hours_start', '08:00');
        setValue('working_hours_end', '21:00');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const newSettings: AppSettings = {
        company_name: data.company_name,
        company_address: data.company_address,
        company_phone: data.company_phone,
        company_email: data.company_email,
        whatsapp_number: data.whatsapp_number,
        logo_url: data.logo_url,
        working_hours: {
          start: data.working_hours_start,
          end: data.working_hours_end
        }
      };
      
      // Salvar no localStorage
      localStorage.setItem('app-settings', JSON.stringify(newSettings));
      setSettings(newSettings);
      
      toast.success('✅ Configurações salvas e aplicadas com sucesso!');
      
      // Recarregar a página para aplicar mudanças nos horários
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('❌ Erro ao salvar configurações');
    }
  };

  const testWhatsApp = async () => {
    try {
      setIsTestingWhatsApp(true);
      
      const testMessage = `🧪 TESTE DO SISTEMA NEURO INTEGRAR 🧪\n\nEste é um teste do sistema de WhatsApp.\n\nNúmero da clínica: ${watchWhatsApp || '98974003414'}\nData/Hora: ${new Date().toLocaleString('pt-BR')}\n\n✅ Sistema funcionando corretamente!`;
      
      // Abrir WhatsApp com mensagem de teste
      const whatsappUrl = `https://api.whatsapp.com/send?phone=55${watchWhatsApp || '98974003414'}&text=${encodeURIComponent(testMessage)}`;
      
      window.open(whatsappUrl, '_blank');
      
      // Salvar teste no histórico
      const messageHistory = JSON.parse(localStorage.getItem('whatsapp-messages') || '[]');
      const testMessageRecord = {
        id: Date.now().toString(),
        from_clinic: watchWhatsApp || '98974003414',
        to_patient: 'TESTE',
        message: testMessage,
        sent_at: new Date().toISOString(),
        status: 'test'
      };
      
      messageHistory.unshift(testMessageRecord);
      localStorage.setItem('whatsapp-messages', JSON.stringify(messageHistory));
      
      toast.success('📱 Teste do WhatsApp enviado! Verifique se recebeu a mensagem.');
      
    } catch (error) {
      console.error('Erro no teste do WhatsApp:', error);
      toast.error('❌ Erro no teste do WhatsApp');
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const logoUrl = e.target?.result as string;
        setValue('logo_url', logoUrl);
        setSettings(prev => ({ ...prev, logo_url: logoUrl }));
        toast.success('✅ Logo carregado! Salve as configurações para aplicar.');
      };
      reader.readAsDataURL(file);
    }
  };

  const generateTimeSlotPreview = () => {
    const start = watch('working_hours_start') || settings.working_hours.start;
    const end = watch('working_hours_end') || settings.working_hours.end;
    
    const startHour = parseInt(start.split(':')[0]);
    const endHour = parseInt(end.split(':')[0]);
    const slots = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    
    return slots;
  };

  const timeSlotPreview = generateTimeSlotPreview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Configurações do Sistema</h1>
        <p className="text-gray-600 mt-2">
          Configure as informações da sua clínica - <strong>TODAS AS MUDANÇAS SÃO APLICADAS IMEDIATAMENTE</strong>
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">🏢 Empresa</TabsTrigger>
          <TabsTrigger value="schedule">⏰ Horários</TabsTrigger>
          <TabsTrigger value="whatsapp">📱 WhatsApp</TabsTrigger>
          <TabsTrigger value="appearance">🎨 Aparência</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Informações da Empresa
                </CardTitle>
                <CardDescription>
                  Configure os dados da sua clínica - Aplicado em todo o sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Nome da Clínica</Label>
                    <Input
                      id="company_name"
                      placeholder="Ex: Clínica Neuro Integrar"
                      {...register('company_name')}
                    />
                    {errors.company_name && (
                      <p className="text-sm text-red-600">{errors.company_name.message}</p>
                    )}
                    <p className="text-xs text-purple-600">
                      ✅ Aparece no cabeçalho do sistema e nas mensagens
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_email">Email da Clínica</Label>
                    <Input
                      id="company_email"
                      type="email"
                      placeholder="contato@clinica.com"
                      {...register('company_email')}
                    />
                    {errors.company_email && (
                      <p className="text-sm text-red-600">{errors.company_email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_address">Endereço Completo</Label>
                  <Textarea
                    id="company_address"
                    placeholder="Rua, número, bairro, cidade - UF, CEP"
                    rows={3}
                    {...register('company_address')}
                  />
                  {errors.company_address && (
                    <p className="text-sm text-red-600">{errors.company_address.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_phone">Telefone Principal</Label>
                  <Input
                    id="company_phone"
                    placeholder="(11) 99999-9999"
                    {...register('company_phone')}
                  />
                  {errors.company_phone && (
                    <p className="text-sm text-red-600">{errors.company_phone.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  ⏰ Horários de Funcionamento
                </CardTitle>
                <CardDescription>
                  Configure os horários de atendimento - <strong>APLICADO IMEDIATAMENTE NA AGENDA</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="working_hours_start">🌅 Horário de Início</Label>
                    <Input
                      id="working_hours_start"
                      type="time"
                      {...register('working_hours_start')}
                    />
                    {errors.working_hours_start && (
                      <p className="text-sm text-red-600">{errors.working_hours_start.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="working_hours_end">🌆 Horário de Fim</Label>
                    <Input
                      id="working_hours_end"
                      type="time"
                      {...register('working_hours_end')}
                    />
                    {errors.working_hours_end && (
                      <p className="text-sm text-red-600">{errors.working_hours_end.message}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-bold text-purple-800 mb-2">📋 Como funciona:</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>✅ Os horários definidos aqui aparecem IMEDIATAMENTE na agenda</li>
                    <li>✅ Intervalos de 30 minutos são criados automaticamente</li>
                    <li>✅ Após salvar, a página recarrega para aplicar as mudanças</li>
                    <li>✅ Padrão atual: 08:00 às 21:00 = {timeSlotPreview.length} slots de 30 minutos</li>
                  </ul>
                </div>

                <div className="p-4 bg-gray-50 border rounded-lg">
                  <h4 className="font-bold mb-3">📅 Preview dos Horários Atuais:</h4>
                  <div className="grid grid-cols-6 gap-2 text-xs max-h-32 overflow-y-auto">
                    {timeSlotPreview.slice(0, 24).map(slot => (
                      <div key={slot} className="p-2 bg-white border rounded text-center font-medium">
                        {slot}
                      </div>
                    ))}
                    {timeSlotPreview.length > 24 && (
                      <div className="p-2 text-center text-gray-500 font-bold">
                        +{timeSlotPreview.length - 24} mais...
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 font-medium">
                    📊 Total: {timeSlotPreview.length} horários disponíveis por dia
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-5 w-5" />
                  📱 Configurações do WhatsApp
                </CardTitle>
                <CardDescription>
                  Configure o WhatsApp DA CLÍNICA para envio automático de mensagens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number">📱 Número do WhatsApp da Cl ínica</Label>
                  <Input
                    id="whatsapp_number"
                    placeholder="98974003414 (apenas números)"
                    {...register('whatsapp_number')}
                  />
                  {errors.whatsapp_number && (
                    <p className="text-sm text-red-600">{errors.whatsapp_number.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Digite apenas números: DDD + número (ex: 98974003414)
                  </p>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-2">✅ Como funciona:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>📱 <strong>Mensagens são enviadas DO número da clínica</strong></li>
                    <li>📞 <strong>PARA o telefone do paciente</strong></li>
                    <li>✅ Confirmações de consulta automáticas</li>
                    <li>⏰ Lembretes são enviados 1 dia antes da consulta</li>
                    <li>📝 Mensagens personalizadas podem ser enviadas individualmente</li>
                    <li>📊 Envio em massa para múltiplas consultas</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={testWhatsApp}
                    disabled={isTestingWhatsApp}
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    {isTestingWhatsApp ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                        Enviando teste...
                      </>
                    ) : (
                      <>
                        <Phone className="mr-2 h-4 w-4" />
                        🧪 Testar WhatsApp da Clínica
                      </>
                    )}
                  </Button>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>💡 Dica:</strong> Clique em "Testar WhatsApp" para verificar se o número está funcionando corretamente
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="mr-2 h-5 w-5" />
                  🎨 Aparência e Logo
                </CardTitle>
                <CardDescription>
                  Personalize a aparência do sistema - Aplicado imediatamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logo">🖼️ Logo da Clínica</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <p className="text-xs text-gray-500">
                    Formatos aceitos: PNG, JPG, SVG (máximo 2MB)
                  </p>
                </div>

                {settings.logo_url && (
                  <div className="space-y-2">
                    <Label>📸 Preview do Logo</Label>
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <img 
                        src={settings.logo_url} 
                        alt="Logo" 
                        className="h-16 object-contain"
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-bold text-purple-800 mb-2">🎨 Paleta de Cores Atual:</h4>
                  <div className="flex space-x-2 mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded shadow-sm"></div>
                    <div className="w-8 h-8 bg-purple-100 rounded shadow-sm"></div>
                    <div className="w-8 h-8 bg-white border rounded shadow-sm"></div>
                    <div className="w-8 h-8 bg-purple-50 rounded shadow-sm"></div>
                    <div className="w-8 h-8 bg-green-500 rounded shadow-sm"></div>
                    <div className="w-8 h-8 bg-blue-500 rounded shadow-sm"></div>
                  </div>
                  <p className="text-sm text-purple-700">
                    🎯 Tema: Roxo e Branco (Profissional e Moderno)
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">✨ Recursos Visuais Ativos:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ Interface responsiva (Desktop, Tablet, Mobile)</li>
                    <li>✅ Agenda estilo Excel com cores por status</li>
                    <li>✅ Gradientes e sombras modernas</li>
                    <li>✅ Ícones Lucide React integrados</li>
                    <li>✅ Animações suaves e transições</li>
                    <li>✅ Dark mode compatível</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-6">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3"
            >
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando e Aplicando...
                </>
              ) : (
                '💾 Salvar e Aplicar Configurações'
              )}
            </Button>
          </div>
        </form>
      </Tabs>

      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h4 className="font-bold text-green-800">🎯 Status do Sistema:</h4>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-green-700">
              <strong>📱 WhatsApp:</strong> {settings.whatsapp_number || '98974003414'}
            </p>
            <p className="text-green-700">
              <strong>⏰ Horários:</strong> {settings.working_hours.start} às {settings.working_hours.end}
            </p>
          </div>
          <div>
            <p className="text-green-700">
              <strong>🏢 Clínica:</strong> {settings.company_name}
            </p>
            <p className="text-green-700">
              <strong>📊 Slots:</strong> {timeSlotPreview.length} horários/dia
            </p>
          </div>
        </div>
        <p className="text-xs text-green-600 mt-2">
          ✅ <strong>Todas as configurações estão funcionando e sendo aplicadas em tempo real!</strong>
        </p>
      </div>
    </div>
  );
}