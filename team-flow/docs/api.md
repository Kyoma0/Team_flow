# Documentação da API

> Prefixo base: `/api`
> 
> Rotas marcadas com 🔒 exigem `Authorization: Bearer <token>`
> 
> Rotas marcadas com ⭐ exigem role `ADMIN`

---

## Auth (`/api/auth`)

### `POST /api/auth/register` — Cadastro

**Auth**: Não

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | sim | Nome completo |
| `email` | string | sim | Email válido |
| `password` | string | sim | Mínimo 6 caracteres |
| `username` | string | não | 3-30 caracteres (letras, números, _) |
| `roleType` | string | não | `ADMIN`, `LEADER`, `EMPLOYEE` (default) |

**Resposta** `201`:
```json
{
  "user": { "id", "username", "name", "email", "roleType", "avatar", "createdAt" },
  "accessToken": "string",
  "refreshToken": "string"
}
```

### `POST /api/auth/login` — Login

**Auth**: Não

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `email` | string | sim |
| `password` | string | sim |

**Resposta** `200`:
```json
{
  "user": { "id", "username", "name", "email", "roleType", "avatar", ... },
  "accessToken": "string",
  "refreshToken": "string"
}
```

### `POST /api/auth/refresh` — Renovar Token

**Auth**: Não

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `refreshToken` | string | sim |

**Resposta** `200`:
```json
{
  "user": { ... },
  "accessToken": "string",
  "refreshToken": "string"
}
```

### `POST /api/auth/logout` — Logout (encerra todas sessões)

**Auth**: 🔒

**Resposta** `200`:
```json
{ "message": "Sessão encerrada" }
```

### `POST /api/auth/confirm-email` — Confirmar Email

**Auth**: Não

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `token` | string | sim |

**Resposta** `200`:
```json
{ "message": "Email confirmado com sucesso" }
```

### `POST /api/auth/forgot-password` — Esqueci Senha

**Auth**: Não

| Campo | Tipo |
|-------|------|
| `email` | string |

**Resposta** `200` (sempre, mesmo se email não existir):
```json
{ "message": "Se o email existir, você receberá instruções" }
```

### `POST /api/auth/reset-password` — Redefinir Senha

**Auth**: Não

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `token` | string | sim |
| `password` | string | sim |

**Resposta** `200`:
```json
{ "message": "Senha alterada com sucesso" }
```

### `POST /api/auth/change-password` — Alterar Senha

**Auth**: 🔒

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `currentPassword` | string | sim |
| `newPassword` | string | sim |

**Resposta** `200`:
```json
{ "message": "Senha alterada com sucesso" }
```

### `GET /api/auth/profile` — Perfil

**Auth**: 🔒

**Resposta** `200`:
```json
{
  "id", "username", "name", "email", "roleType", "avatar",
  "role": { "id", "name", "permissions" } | null,
  "isActive": true, "createdAt", "updatedAt"
}
```

### `PATCH /api/auth/profile` — Atualizar Perfil

**Auth**: 🔒

| Campo | Tipo |
|-------|------|
| `name` | string |
| `username` | string |
| `avatar` | string |

**Resposta** `200`: Objeto do usuário atualizado.

### `POST /api/auth/avatar` — Upload Avatar

**Auth**: 🔒

**Body**: Multipart form-data com campo `avatar` (imagem, máx 2MB).

**Resposta** `200`: Objeto do usuário com novo avatar.

---

## Users (`/api/users`)

> 🔒 Todas rotas exigem autenticação. ⭐ Rotas de exclusão exigem ADMIN.

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/api/users` | 🔒 | Lista todos usuários |
| `GET` | `/api/users/search?q=` | 🔒 | Busca usuários por nome/username/email |
| `GET` | `/api/users/:id` | 🔒 | Detalhe do usuário |
| `PATCH` | `/api/users/:id` | 🔒 | Atualizar nome/roleType/isActive |
| `DELETE` | `/api/users/:id` | ⭐ | Desativar/excluir usuário |

---

## Roles (`/api/roles`)

> ⭐ Todas rotas exigem ADMIN.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/roles` | Criar cargo |
| `GET` | `/api/roles` | Listar cargos |
| `GET` | `/api/roles/:id` | Detalhe do cargo |
| `PATCH` | `/api/roles/:id` | Atualizar cargo |
| `DELETE` | `/api/roles/:id` | Excluir cargo |

**Body (POST/PATCH)**:
```json
{
  "name": "string",
  "description": "string",
  "permissions": ["permission1", "permission2"]
}
```

---

## Projects (`/api/projects`)

> 🔒 Todas rotas exigem autenticação.

### `POST /api/projects` — Criar

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| `name` | string | sim |
| `description` | string | não |
| `startDate` | string (ISO) | não |
| `endDate` | string (ISO) | não |
| `clientId` | string | não |

### `GET /api/projects` — Listar

**Query params**: `page`, `limit`

### `GET /api/projects/:id` — Detalhe

### `PATCH /api/projects/:id` — Atualizar (owner)

### `DELETE /api/projects/:id` — Excluir (owner)

### `POST /api/projects/:id/archive` — Arquivar

### `POST /api/projects/:id/members` — Adicionar Membro

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | string | ID do usuário |
| `username` | string | Alternativa ao userId |

### `DELETE /api/projects/:id/members/:memberId` — Remover Membro

---

## Tasks (`/api/tasks`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/tasks` | Criar tarefa |
| `GET` | `/api/tasks/project/:projectId` | Listar por projeto |
| `GET` | `/api/tasks/:id` | Detalhe |
| `PATCH` | `/api/tasks/:id` | Atualizar |
| `DELETE` | `/api/tasks/:id` | Excluir |

**Query params** (GET /tasks/project/:projectId):
- `status` — Filtrar por status
- `priority` — Filtrar por prioridade
- `assignedToId` — Filtrar por responsável
- `dueDateFrom` / `dueDateTo` — Filtrar por data
- `page`, `limit` — Paginação

**Body (POST/PATCH)**:
```json
{
  "title": "string",
  "description": "string",
  "status": "NOT_STARTED | IN_PROGRESS | PAUSED | IN_REVIEW | COMPLETED",
  "priority": "LOW | MEDIUM | HIGH | URGENT",
  "dueDate": "ISO string",
  "position": 0,
  "projectId": "string",
  "assignedToId": "string | null"
}
```

---

## Comments (`/api/comments`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/comments` | Criar comentário |
| `POST` | `/api/comments/reply` | Responder comentário |
| `GET` | `/api/comments/task/:taskId` | Listar por tarefa |
| `DELETE` | `/api/comments/:id` | Excluir |

**Body (POST /api/comments)**:
```json
{ "content": "string", "taskId": "string" }
```

**Body (POST /api/comments/reply)**:
```json
{ "content": "string", "commentId": "string" }
```

---

## Folders (`/api/folders`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/folders/project/:projectId` | Listar pastas do projeto |
| `POST` | `/api/folders` | Criar pasta |
| `PATCH` | `/api/folders/:id` | Renomear |
| `DELETE` | `/api/folders/:id` | Excluir |

**Body (POST)**:
```json
{ "name": "string", "projectId": "string", "parentId": "string | null" }
```

---

## Files (`/api/files`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/files/upload` | Upload de arquivo |
| `POST` | `/api/files/:id/version` | Nova versão |
| `GET` | `/api/files/project/:projectId` | Listar por projeto |
| `GET` | `/api/files/task/:taskId` | Listar por tarefa |
| `GET` | `/api/files/group/:groupId` | Listar por grupo |
| `GET` | `/api/files/:id` | Detalhe do arquivo |
| `GET` | `/api/files/:id/download` | Download |
| `DELETE` | `/api/files/:id` | Excluir |

**Upload (POST /api/files/upload)**: Multipart form-data com campo `file`.
- **Query**: `projectId` (obrigatório), `taskId`, `groupId`

**Upload Version (POST /api/files/:id/version)**: Multipart form-data com campo `file`.

**Download**: Retorna o arquivo com headers `Content-Type` e `Content-Disposition`.

---

## Groups (`/api/groups`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/groups` | Criar grupo |
| `GET` | `/api/groups/project/:projectId` | Listar por projeto |
| `GET` | `/api/groups/dm` | Listar DMs do usuário |
| `POST` | `/api/groups/dm/:targetUserId` | Criar/obter DM |
| `GET` | `/api/groups/:id` | Detalhe |
| `POST` | `/api/groups/:id/join` | Entrar no grupo |
| `POST` | `/api/groups/:id/leave` | Sair do grupo |
| `DELETE` | `/api/groups/:id` | Excluir grupo |

**Body (POST)**:
```json
{ "name": "string", "projectId": "string" }
```

---

## Chat (`/api/chat` + WebSocket)

### REST

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/chat/messages/:groupId` | Histórico de mensagens |
| `GET` | `/api/chat/search/:groupId?q=` | Buscar mensagens |

### WebSocket (`Socket.IO`)

**Conexão**:
```javascript
const socket = io(URL, {
  auth: { token: 'jwt_token' },
  transports: ['websocket', 'polling']
});
```

**Eventos**:

| Evento | Direção | Dados |
|--------|---------|-------|
| `join:group` | client → server | `groupId: string` |
| `leave:group` | client → server | `groupId: string` |
| `message:send` | client → server | `{ content, groupId, fileId? }` |
| `message:new` | server → client | `Message` object |
| `message:typing` | bidirecional | `{ groupId, isTyping }` |

---

## Notifications (`/api/notifications`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/notifications/push-subscribe` | Inscrever para push |
| `POST` | `/api/notifications/push-unsubscribe` | Cancelar push |
| `GET` | `/api/notifications` | Listar notificações |
| `PATCH` | `/api/notifications/read-all` | Marcar todas como lidas |
| `PATCH` | `/api/notifications/:id/read` | Marcar uma como lida |
| `DELETE` | `/api/notifications/:id` | Excluir notificação |

**Body (push-subscribe)**: Objeto de subscription do Push API.

---

## Search (`/api/search`)

> 🔒 Exige autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/search?q=` | Busca global |

**Resposta**:
```json
{
  "projects": [...],
  "tasks": [...],
  "users": [...],
  "files": [...],
  "messages": [...],
  "deliveries": [...]
}
```

Busca por nome, título, conteúdo (case-insensitive) em todos os recursos que o usuário tem acesso.

---

## Calendar (`/api/calendar`)

> 🔒 Exige autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/calendar?start=&end=` | Eventos do período |

**Query params**: `start` (ISO), `end` (ISO) — período do calendário.

Retorna tarefas com data de vencimento no período.

---

## Clients (`/api/clients`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/clients` | Criar cliente |
| `GET` | `/api/clients` | Listar clientes |
| `GET` | `/api/clients/:id` | Detalhe |
| `PATCH` | `/api/clients/:id` | Atualizar |
| `DELETE` | `/api/clients/:id` | Excluir |

**Body (POST/PATCH)**:
```json
{
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "notes": "string"
}
```

---

## Deliveries (`/api/deliveries`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/deliveries` | Criar entrega |
| `GET` | `/api/deliveries/project/:projectId` | Listar por projeto |
| `GET` | `/api/deliveries/:id` | Detalhe |
| `PATCH` | `/api/deliveries/:id/status` | Atualizar status |
| `POST` | `/api/deliveries/:id/versions` | Adicionar versão |
| `DELETE` | `/api/deliveries/:id` | Excluir |

**Status**: `IN_PRODUCTION`, `IN_REVIEW`, `CORRECTIONS`, `APPROVED`, `REJECTED`

**Body (POST)**:
```json
{ "title": "string", "description": "string", "projectId": "string", "dueDate": "ISO" }
```

**Body (PATCH /:id/status)**:
```json
{ "status": "APPROVED", "reviewNote": "string" }
```

**Body (POST /:id/versions)**:
```json
{ "note": "string", "files": ["fileId1", "fileId2"] }
```

---

## Plans (`/api/plans`)

> 🔒 Todas rotas exigem autenticação. ⭐ CRUD exige ADMIN.

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| `GET` | `/api/plans/user/me` | 🔒 | Plano do usuário logado |
| `GET` | `/api/plans` | 🔒 | Listar planos |
| `GET` | `/api/plans/:id` | 🔒 | Detalhe do plano |
| `POST` | `/api/plans` | ⭐ | Criar plano |
| `PATCH` | `/api/plans/:id` | ⭐ | Atualizar plano |
| `DELETE` | `/api/plans/:id` | ⭐ | Excluir plano |

---

## Reports (`/api/reports`)

> 🔒 Todas rotas exigem autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/reports/productivity` | Relatório de produtividade |
| `GET` | `/api/reports/deliveries` | Relatório de entregas |
| `GET` | `/api/reports/delays` | Relatório de atrasos |
| `GET` | `/api/reports/collaborator/:id` | Relatório por colaborador |
| `GET` | `/api/reports/project/:id` | Relatório por projeto |

**Query params** (opcionais): `startDate`, `endDate`

### Exportação

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/reports/export/productivity` | Exportar produtividade |
| `GET` | `/api/reports/export/deliveries` | Exportar entregas |
| `GET` | `/api/reports/export/delays` | Exportar atrasos |
| `GET` | `/api/reports/export/project/:id` | Exportar relatório do projeto |

**Query params**: `format` = `csv` (default), `xlsx`, `pdf` | `startDate`, `endDate`

---

## Dashboard (`/api/dashboard`)

> 🔒 Exige autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/dashboard` | Indicadores do dashboard |

**Resposta**:
```json
{
  "projects": { "total", "active", "completed", "archived" },
  "tasks": { "total", "notStarted", "inProgress", "paused", "completed" },
  "recentProjects": [...],
  "recentTasks": [...],
  "productivity": { "completedThisWeek", "completionRate" }
}
```

---

## Backup (`/api/backup`)

> ⭐ Exige ADMIN.

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/backup/run` | Executar backup manual |

---

## Trash (`/api/trash`)

> 🔒 Exige autenticação.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/trash` | Listar lixeira |
| `POST` | `/api/trash/:id/restore` | Restaurar arquivo |
| `DELETE` | `/api/trash/:id` | Excluir permanentemente |
| `DELETE` | `/api/trash` | Esvaziar lixeira |

---

## Audit (`/api/audit`)

> ⭐ Exige ADMIN.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/audit` | Listar logs (paginado) |
| `GET` | `/api/audit/:id` | Detalhe do log |

**Query params**: `page`, `limit`, `userId`, `entity`, `action`

---

## Resumo de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `201` | Criado com sucesso |
| `400` | Erro de validação |
| `401` | Não autenticado |
| `403` | Sem permissão / limite do plano |
| `404` | Recurso não encontrado |
| `409` | Conflito (ex: email já existe) |
| `500` | Erro interno do servidor |

## Resumo de Rotas por Módulo

| Módulo | Quantidade |
|--------|-----------|
| Auth | 10 |
| Users | 5 |
| Roles | 5 |
| Projects | 8 |
| Tasks | 5 |
| Comments | 4 |
| Folders | 4 |
| Files | 8 |
| Groups | 8 |
| Chat | 2 (+5 WebSocket) |
| Notifications | 6 |
| Search | 1 |
| Calendar | 1 |
| Clients | 5 |
| Deliveries | 6 |
| Plans | 6 |
| Reports | 9 |
| Dashboard | 1 |
| Backup | 1 |
| Trash | 4 |
| Audit | 2 |
| **Total** | **~105 endpoints** |
