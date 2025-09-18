# Neuro Integrar - Sistema de Gestão Neurológica

Sistema completo para gestão de clínicas neurológicas com agendamento, WhatsApp integrado, controle financeiro e prontuários eletrônicos.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta no GitHub
- Conta na Vercel
- Projeto Supabase configurado

### Instruções de Deploy

1. **Conectar GitHub à Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub
   - Clique em "New Project"
   - Selecione este repositório: `luquinhasss42/saas-3`

2. **Configurar Variáveis de Ambiente:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://nidpfgpztgnglurnxmvx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycXFqc3R5b2RjYW9sdHp2Y3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTQ5NzAsImV4cCI6MjA3MDU5MDk3MH0.k7T45zXpzBTHHXt3fjGgxVF4QTNJ6iDtG4Vic6f7ENk
   ```

3. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Acesse sua aplicação no link fornecido

### Solução de Problemas

Se encontrar erro "GitHub-Vercel configuration error":

1. **Desconectar e Reconectar:**
   - Vá para Vercel Dashboard
   - Settings → Git Integration
   - Disconnect GitHub
   - Reconnect GitHub com todas as permissões

2. **Verificar Permissões:**
   - GitHub → Settings → Applications
   - Vercel deve ter acesso ao repositório
   - Conceder permissões completas se necessário

3. **Recriar Projeto:**
   - Delete o projeto na Vercel
   - Crie um novo projeto
   - Selecione o repositório novamente

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

## 📋 Funcionalidades

- ✅ **Agendamento Inteligente** - Interface tipo Excel com validação de horários
- ✅ **WhatsApp Integrado** - Envio automático de confirmações
- ✅ **Controle Financeiro** - Gestão completa de receitas e despesas
- ✅ **Prontuários Eletrônicos** - Histórico médico completo
- ✅ **Avaliações Neurológicas** - Sistema de pontuação e acompanhamento
- ✅ **Gestão de Usuários** - Controle de acesso por perfil
- ✅ **Dashboard Personalizado** - Visão específica por tipo de usuário

## 🔐 Login de Teste

Use qualquer email dos usuários cadastrados + senha contendo "neuro":
- admin@neurointegrar.com + neuro123
- medico@neurointegrar.com + neuro123
- agendamento@neurointegrar.com + neuro123

## 🏗️ Arquitetura

- **Frontend**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

## 📱 Responsivo

Interface totalmente responsiva que funciona perfeitamente em:
- 💻 Desktop
- 📱 Mobile
- 📟 Tablet

---

**Desenvolvido com Lasy AI** - Sistema completo para gestão de clínicas neurológicas.