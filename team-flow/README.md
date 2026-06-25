# TeamFlow

Plataforma SaaS de gestão de projetos para equipes criativas (estúdios de Blender/3D, design, marketing, TI).

## Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, Prisma ORM
- **Database:** SQLite
- **Cache:** Redis (opcional)
- **Storage:** MinIO / S3
- **Realtime:** Socket.IO
- **Auth:** JWT + 2FA

## Funcionalidades

- Autenticação (JWT + 2FA)
- Projetos CRUD
- Tarefas (Quadro Kanban + Lista)
- Dependências entre tarefas
- Time tracking
- Modelos de tarefas
- Campos personalizados
- Equipes e membros
- Chat em tempo real + DMs
- Busca global (Ctrl+K)
- Upload de arquivos com versionamento
- Pipeline de entregas
- Webhooks + API Tokens
- Feed de atividades
- Planos/assinaturas
- Importar/Exportar (JSON/CSV)
- Perfil e preferências de notificação
- Onboarding interativo
- Autenticação de dois fatores (2FA)
- Internacionalização (pt-BR, en-US)
- PWA (instalável)
- Documentação Swagger
- Testes automatizados
- CI/CD (GitHub Actions)

## Início rápido

### Desenvolvimento

```bash
# Clone e instale
git clone ...
cd team-flow
npm run setup

# Inicie
npm run dev
```

### Produção (Docker)

```bash
docker-compose up --build -d
```

Acesse:
- Frontend: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/api/docs
- MinIO Console: http://localhost:9001 (minioadmin:minioadmin)

### Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste as variáveis.

## Estrutura

```
team-flow/
├── backend/          # API NestJS
│   ├── prisma/       # Schema + migrations
│   └── src/          # Código fonte
├── frontend/         # Next.js
│   └── src/          # Código fonte
├── docs/             # Documentação
└── scripts/          # Scripts de utilidade
```

## Testes

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

## Licença

MIT
