# Changelog

## v1.0.0 (2026-06-17)

### 🚀 Features

#### Autenticação e Segurança
- Login/registro com JWT
- Autenticação de dois fatores (2FA) com TOTP
- Login via GitHub OAuth
- Perfil de usuário (nome, avatar, senha)
- Upload de avatar via arquivo
- Preferências de notificação por email
- Exclusão de conta (GDPR)
- Exportação de dados do usuário
- Tokens de API para acesso programático
- Rate limiting (3 camadas)

#### Projetos
- CRUD completo de projetos
- Membros com papéis (OWNER/MANAGER/MEMBER)
- Convite por email com token

#### Tarefas
- Quadro Kanban e visualização em lista
- Filtros combinados (status, prioridade, data, responsável)
- Paginação
- Dependências entre tarefas (com detecção de ciclos)
- Time tracking (cronômetro + entrada manual)
- Campos personalizados (texto, número, seleção, data, booleano)
- Comentários com respostas em linha
- Observadores/seguidores
- Operações em lote (status, prioridade, excluir)
- Modelos de tarefas (criar e aplicar)
- Subtarefas/checklist
- Tarefas recorrentes (diário, dias úteis, semanal, mensal)
- Exclusão suave (lixeira com restaurar)
- Busca global (Ctrl+K)

#### Arquivos
- Upload múltiplo com arrastar e soltar
- Versionamento de arquivos
- Preview de imagens em tela cheia
- Download por versão

#### Comunicação
- Chat em tempo real (Socket.IO)
- Mensagens diretas (DM)
- Busca de mensagens
- Menções

#### Entregas
- Pipeline completo: Em produção → Em revisão → Aprovado/Solicita alterações → Finalizado
- Notificações por email

#### Calendário e Cronograma
- Visão em calendário mensal
- Gráfico de Gantt (dia/semana/mês)

#### Integrações
- Webhooks com assinatura HMAC-SHA256
- Importar/Exportar (JSON e CSV)
- Documentação Swagger em `/api/docs`

#### Notificações
- Email (SMTP ou console)
- Push notifications (service worker)
- Notificações in-app com sino
- Preferências por tipo de notificação
- Notificações para observadores de tarefas

#### Infraestrutura
- PWA (manifest, service worker, instalável)
- Docker Compose (PostgreSQL, Redis, MinIO, nginx)
- CI/CD (GitHub Actions)
- Limpeza agendada de dados expirados
- Logging de requisições HTTP
- Monitoramento de performance no frontend
- Tratamento global de erros (Sentry wrapper)
- Health check

#### UI/UX
- Onboarding interativo (7 passos)
- Tema claro/escuro/sistema
- Atalhos de teclado (atalho `?`)
- Esqueletos de carregamento
- Limite de erros (componente + rota)
- Internacionalização (pt-BR, en-US)
- Widgets de dashboard personalizáveis
- Página inicial (landing page)
- Política de privacidade e Termos de serviço
- SEO (sitemap, robots.txt, metadados)
- Página 404 personalizada

### 🧪 Testes
- 31 testes unitários no backend (5 suites)
- 63 testes unitários no frontend (3 suites)
- 12 testes E2E com Playwright (4 arquivos)
