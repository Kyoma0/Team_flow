# Wireframes — Descrição das Telas

> Documento descritivo de todas as telas do sistema TeamFlow. Cada seção descreve layout, elementos de UI, navegação, estados e comportamento responsivo.

---

## 1. Login `/login`

### Layout
- Fundo gradiente (azul-escuro para roxo) com ilustração abstrata à direita (ou pattern geométrico)
- Card centralizado com largura máxima de 420px
- Logo "TeamFlow" no topo do card

### Elementos
- Campo **Email** (ícone de envelope, placeholder: "seu@email.com")
- Campo **Senha** (ícone de cadeado, toggle de visibilidade)
- Botão **"Entrar"** (primário, full width, azul)
- Link **"Esqueceu a senha?"** abaixo do botão
- Separador "ou" com linhas horizontais
- Botão **"Criar conta gratuita"** (outline, full width)

### Estados
- **Loading**: Spinner no botão, campos desabilitados
- **Erro**: Toast vermelho no topo ("Email ou senha inválidos"), campos destacados em vermelho
- **Sucesso**: Redireciona para `/dashboard`

### Responsivo
- Mobile: Card ocupa 100% da tela, sem ilustração lateral
- Tablet: Mesmo layout, card centralizado

---

## 2. Cadastro `/register`

### Layout
- Mesmo fundo do login, card centralizado

### Elementos
- Campo **Nome completo**
- Campo **Email**
- Campo **Username** (opcional, com sugestão automática baseada no email)
- Campo **Senha** (com indicador de força: fraca/média/forte)
- Campo **Confirmar senha**
- Select **Tipo de conta**: Funcionário (default), Líder
- Checkbox "Aceito os termos de uso"
- Botão **"Criar conta"**
- Link "Já tem conta? Faça login"

### Estados
- **Validação**: Validação em tempo real (email duplicado via debounce)
- **Sucesso**: Modal "Conta criada! Verifique seu email para confirmar."
- **Erro**: Mensagens inline abaixo de cada campo

### Comportamento
- Após cadastro, faz login automático e redireciona para `/dashboard`

---

## 3. Dashboard `/dashboard`

### Layout
- Sidebar fixa à esquerda (240px, modo escuro)
- Header superior (altura 64px) com busca, notificações e avatar
- Grid de cards no conteúdo principal

### Sidebar (presente em todas telas autenticadas)
- Logo no topo
- Links de navegação com ícones:

| Ícone | Rota | Label |
|-------|------|-------|
| LayoutDashboard | `/dashboard` | Dashboard |
| FolderKanban | `/projects` | Projetos |
| Calendar | `/calendar` | Calendário |
| MessageSquare | `/messages` | Mensagens |
| FileText | `/plans` | Planos |
| Users | `/clients` | Clientes |
| BarChart3 | `/reports` | Relatórios |
| Search | `/search` | Buscar |
| Bell | `/notifications` | Notificações |
| User | `/profile` | Perfil |
| Settings | `/admin` | Admin (apenas ADMIN) |
| LifeBuoy | `/support` | Suporte |

- Badge de notificações não lidas no ícone Bell

### Conteúdo do Dashboard
1. **Linha superior** (3 cards):
   - **Projetos Ativos**: número grande + seta de variação em relação ao mês passado
   - **Tarefas Concluídas**: número + porcentagem do total
   - **Produtividade**: porcentagem + gráfico sparkline (recharts)

2. **Gráfico**: Barra de tarefas por status (últimos 7 dias)

3. **Linha inferior** (2 colunas):
   - **Projetos Recentes**: lista vertical com 5 cards (nome, status badge, progresso, owner avatar)
   - **Tarefas Recentes**: timeline vertical com 10 itens (título, projeto, responsável, status)

### Estados
- **Loading**: Skeleton loaders (shimmer effect) em todos os cards
- **Vazio**: "Bem-vindo ao TeamFlow! Crie seu primeiro projeto." + CTA button
- **Erro**: Card com mensagem de erro e botão "Tentar novamente"

### Responsivo
- Mobile: Sidebar vira bottom navigation + drawer lateral
- Tablets: Sidebar collapsível (ícone hamburger)

---

## 4. Projetos — Lista `/projects`

### Layout
- Header com título "Projetos" + botão "Novo Projeto"
- Grid de cards (2 colunas desktop, 1 tablet/mobile)
- Filtros no topo: Todos, Ativos, Arquivados, Concluídos

### Card de Projeto
- Nome do projeto (link para detalhe)
- Status badge colorido: ACTIVE (verde), ARCHIVED (cinza), COMPLETED (azul)
- Barra de progresso (tarefas concluídas / total)
- Avatar do owner + Nome
- Info: N tarefas · N membros · N grupos
- Menu de ações (três pontos): Arquivar, Editar, Excluir
- Cliente associado (se houver)

### Estado Vazio
- Ilustração + "Nenhum projeto ainda" + botão "Criar primeiro projeto"

### Novo Projeto (Modal)
- Campos: Nome (obrigatório), Descrição (textarea), Cliente (autocomplete), Datas (date picker)
- Botões: Cancelar, Criar

---

## 5. Projeto — Detalhe `/projects/[id]`

### Layout
- Header: Nome do projeto, status badge, owner, menu de ações
- Abas (tabs): **Tarefas | Arquivos | Entregas | Grupos | Membros | Configurações**

### Aba Tarefas (padrão)
- Botões: "Nova Tarefa", toggle visualização (Kanban / Lista / Calendário)

#### Kanban View
- 5 colunas: **Não Iniciado | Em Andamento | Pausado | Em Revisão | Concluído**
- Cards de tarefa arrastáveis (dnd-kit)
- Cada card: título, prioridade badge, responsável avatar, data, contagem de comentários
- Scroll horizontal nas colunas

#### List View
- Tabela: Título | Status | Prioridade | Responsável | Vencimento | Ações
- Ordenável por coluna
- Filtros: status, prioridade, responsável, data
- Paginação

#### Calendar View
- Calendário mensal com dots indicando tarefas com vencimento no dia
- Clique no dia: lista de tarefas daquele dia
- Tarefas atrasadas em vermelho

### Aba Arquivos
- Árvore de pastas à esquerda (recursiva, com ícones de pasta/arquivo)
- Grid/list de arquivos à direita
- Upload button (drag & drop zone)
- Breadcrumb de navegação de pastas

### Aba Entregas
- Lista de entregas com status, responsável, data de vencimento
- Badge de versões
- Ações: Criar entrega, Adicionar versão, Revisar

### Aba Grupos
- Lista de grupos de chat + "Criar grupo"
- Badge de membros em cada grupo

### Aba Membros
- Grid de avatars com nome, email, role no projeto
- Botão "Adicionar Membro" (modal com busca de usuário por nome/email)
- Menu de ações: Remover, Mudar role

### Aba Configurações
- Editar nome, descrição, datas, cliente
- Perigo: Excluir projeto (confirmação com texto)

---

## 6. Kanban (Quadro de Tarefas)

### Layout (full width)
- Sidebar recolhida ou em modo compacto
- 5 colunas ocupando toda largura, com scroll horizontal
- Cada coluna: cabeçalho com nome do status + contagem

### Card de Tarefa
- Título (negrito, 14px)
- Badge de prioridade: LOW (cinza), MEDIUM (azul), HIGH (laranja), URGENT (vermelho)
- Avatar do responsável (tooltip com nome)
- Data de vencimento (vermelho se atrasada)
- Ícone de comentários + contagem
- Ícone de anexos + contagem

### Interações
- **Drag & drop**: Arrastar entre colunas muda o status
- **Clique**: Abre modal/modal lateral com detalhes da tarefa
- **Clique direito**: Menu contextual (Editar, Duplicar, Excluir)
- **Scroll**: Keep position ao recarregar

### Estados
- **Loading**: Skeleton columns
- **Vazio**: "Nenhuma tarefa nesta coluna"

### Responsivo
- Mobile: Colunas empilhadas verticalmente com accordion
- Tablet: Colunas reduzidas, scroll horizontal

---

## 7. Chat `/messages`

### Layout (split pane)
- **Painel esquerdo** (320px): Lista de conversas
- **Painel direito**: Conversa ativa

### Painel Esquerdo
- Search bar: "Buscar conversas..."
- Seção "Direct Messages": lista de DMs com avatar + nome + última mensagem + dot de não lida
- Seção "Grupos": lista de grupos com ícone de grupo + nome + último membro ativo
- Badge de não lidas em cada conversa

### Painel Direito (Conversa Ativa)
- **Header**: Nome do grupo/DM, avatars dos membros, "Ver membros" button
- **Messages area**: Scroll infinito para cima (carrega histórico), mensagens agrupadas por dia
  - Bolhas de mensagem: alinhadas à direita (minhas), à esquerda (outros)
  - Avatar + nome + hora em cada bolha
  - Arquivos anexados exibidos como cards (nome, tamanho, download)
- **Input area**: Textarea expansível (até 4 linhas), botão de anexo (arquivo), botão de envio
- **Typing indicator**: "Fulano está digitando..."

### Estados
- **Loading mensagens**: Skeleton messages (bolhas cinzas)
- **Vazio**: "Nenhuma mensagem ainda. Envie a primeira!"
- **Erro ao enviar**: Bolha vermelha "Falha ao enviar" + botão "Tentar novamente"
- **Offline**: Banner "Você está offline. As mensagens serão enviadas quando reconectar."

### Responsivo
- Mobile: Split vira tela única (lista → conversa, com back button)

---

## 8. Arquivos `/projects/[id]/files`

### Layout
- **Sidebar de pastas** (260px, apenas desktop): árvore expansível
  - Pasta raiz, subpastas indentadas
  - Ícone de pasta (fechada/aberta)
  - Clique para selecionar
- **Área principal**: grid de arquivos (4 colunas desktop)

### Grid de Arquivos
- Card de arquivo:
  - Ícone baseado em mime type (PDF, imagem, vídeo, código, etc.)
  - Nome do arquivo (truncado após 30 chars)
  - Tamanho formatado (KB, MB, GB)
  - Data de upload
  - Avatar de quem enviou
  - Checkbox para seleção múltipla
  - Menu de ações: Download, Versões, Mover, Excluir
- Ordenação: Nome, Data, Tamanho

### Upload
- Drag & drop zone (dashed border) no topo
- Barra de progresso individual para cada arquivo
- Suporte a upload em lote (múltiplos arquivos)
- Preview de imagem antes do upload

### Estados
- **Vazio**: Ilustração + "Nenhum arquivo ainda" + upload CTA
- **Uploading**: Overlay com progresso total e individual
- **Erro upload**: Toast "Falha ao enviar arquivo" + retry

---

## 9. Entregas `/projects/[id]/deliveries`

### Layout
- Header: "Entregas" + botão "Nova Entrega"
- Lista vertical de cards de entrega

### Card de Entrega
- Título (link para detalhe)
- Status badge:

| Status | Cor |
|--------|-----|
| IN_PRODUCTION | Azul |
| IN_REVIEW | Amarelo |
| CORRECTIONS | Laranja |
| APPROVED | Verde |
| REJECTED | Vermelho |

- Data de vencimento (vermelho se atrasada)
- Responsável (criador) + Revisor (se atribuído)
- Badge "N versões"
- Menu: Adicionar versão, Revisar, Excluir

### Modal de Detalhe
- Informações completas
- Timeline de versões (data, versão, nota, arquivos)
- Formulário de revisão (status + nota)

---

## 10. Notificações `/notifications`

### Layout
- Header: "Notificações" + botão "Marcar todas como lidas"
- Lista vertical

### Item de Notificação
- Ícone baseado no tipo: task (CheckSquare), delivery (Package), comment (MessageSquare), project (FolderKanban)
- Conteúdo: "Fulano te atribuiu à tarefa 'X' no projeto Y"
- Tempo relativo: "há 5 minutos", "há 2 horas", "ontem"
- Destaque visual: não lida (fundo azul claro + dot azul), lida (fundo branco)
- Clique: redireciona para o recurso + marca como lida

### Estados
- **Vazio**: "Nenhuma notificação" + sininho ilustração
- **Loading**: Skeleton list

---

## 11. Perfil `/profile`

### Layout
- Card centralizado (máx 600px)

### Seções
1. **Avatar**: Imagem circular, hover com "Alterar", upload de nova imagem
2. **Informações**: Nome, Username, Email (verificado/não verificado), Tipo de conta
3. **Alterar Senha**: Campos: Senha atual, Nova senha, Confirmar nova senha
4. **Plano Atual**: Card com nome do plano, limites (storage usado, projetos), botão "Fazer upgrade"
5. **Atividade**: Últimos logs de acesso

---

## 12. Planos `/plans`

### Layout
- Header: "Planos e Preços" + "Plano atual: [nome]"
- Grid de cards de planos (4 colunas desktop, 2 tablet, 1 mobile)

### Card de Plano
- Nome do plano em destaque
- Preço mensal/anual (toggle)
- Destaque no plano atual (borda azul + badge "ATUAL")
- Checkmarks para funcionalidades incluídas
- X para funcionalidades não incluídas
- Botão: "Atualizar" / "Downgrade" / "Selecionar" / "Contatar vendas"
- Plano Gratuito tem badge "Grátis"

### Modal de Confirmação
- Resumo da mudança: Plano atual → Novo plano
- Valor a pagar (pró-rated se upgrade no meio do mês)
- Botões: Confirmar, Cancelar

### Estados
- **Após pagamento**: Modal de sucesso + "Bem-vindo ao plano [nome]!"
- **Erro pagamento**: Mensagem + tentar novamente

---

## 13. Clientes `/clients`

### Layout
- Header: "Clientes" + botão "Novo Cliente"
- Tabela ou grid de cards

### Tabela
| Nome | Empresa | Email | Telefone | Projetos | Ações |

### Card (grid view)
- Avatar (iniciais da pessoa em círculo colorido)
- Nome, empresa, email
- Contagem de projetos vinculados
- Menu: Editar, Excluir

### Modal Novo/Editar Cliente
- Campos: Nome (obrigatório), Empresa, Email, Telefone, Notas (textarea)

### Estados
- **Vazio**: "Nenhum cliente cadastrado" + CTA
- **Erro exclusão**: Toast se cliente tiver projetos ativos

---

## 14. Calendário `/calendar`

### Layout
- Header: Navegação de mês (setas + nome do mês/ano) + "Hoje"
- Grid do calendário (7 colunas, linhas por semana)
- Abas: Mês | Semana | Dia

### Grid Mensal
- Células do dia: número + dots coloridos representando tarefas
- Tarefas atrasadas: dot vermelho
- Tarefas do dia atual: destaque azul no número
- Clique no dia: expande para mostrar lista de tarefas daquele dia
- Mês anterior/próximo: células em cinza claro

### Estados
- **Loading**: Skeleton calendar grid
- **Vazio**: "Nenhuma tarefa com data neste período"

---

## 15. Relatórios `/reports`

### Layout
- Header: "Relatórios" + botão "Exportar"
- Grid de cards de relatório (2x2)

### Cards
1. **Produtividade**: Gráfico de barras (tarefas por projeto) + tabela
2. **Entregas**: Gráfico de pizza (status de entregas) + tabela
3. **Atrasos**: Lista vermelha de tarefas e entregas atrasadas
4. **Por Colaborador**: Select de colaborador + cards individuais

### Cada Card
- Título
- Resumo numérico
- Gráfico (recharts)
- Botão "Exportar" → Modal: CSV, XLSX, PDF

### Estados
- **Loading**: Skeleton charts
- **Vazio**: "Sem dados para o período selecionado"

---

## 16. Admin `/admin`

### Layout
- Abas: **Usuários | Cargos | Auditoria | Planos**

### Usuários
- Tabela com todos usuários
- Colunas: Nome, Email, Tipo, Status (ativo/inativo), Criado em, Ações
- Ações: Editar (modal), Desativar (toggle)
- Filtro: por tipo, status

### Cargos
- Lista de cargos + "Novo Cargo"
- Modal: Nome, Descrição, Checkboxes de permissões

### Auditoria
- Tabela paginada com logs
- Colunas: Data/Hora, Usuário, Ação, Entidade, Detalhes
- Filtros: por usuário, ação, entidade
- Exportável

### Planos
- CRUD de planos (admin apenas)
- Editor de features (checkboxes)
- Precificação mensal/anual

---

## 17. Search `/search`

### Layout
- Search bar centralizada, grande (como Google)
- Resultados agrupados por categoria em abas: **Todos | Projetos | Tarefas | Usuários | Arquivos | Mensagens**

### Cada Resultado
- Ícone do tipo
- Título (highlight na palavra buscada)
- Descrição/resumo com highlight
- Link para o recurso

### Estados
- **Antes da busca**: "Busque por projetos, tarefas, arquivos..."
- **Sem resultados**: Ilustração + "Nenhum resultado para '[query]'" + sugestões
- **Loading**: Spinner no centro
- **Erro**: "Erro ao buscar. Tente novamente."

### Comportamento
- Debounce de 300ms
- Resultados atualizados enquanto digita
- Atalho de teclado: Ctrl+K para focar na busca

---

## 18. Visualizador 3D `/viewer`

### Layout
- Tela cheia (sidebar oculta opcionalmente)
- Canvas Three.js ocupando toda área

### Elementos
- Toolbar superior: Carregar arquivo, Ajustar, Resetar visualização
- Controles de órbita (arrastar para rotacionar, scroll para zoom)
- Painel lateral (toggle): Lista de objetos carregados, propriedades
- Botão fullscreen

### Estados
- **Vazio**: "Carregue um arquivo 3D para visualizar" + upload zone
- **Loading**: Progress bar de carregamento do modelo
- **Erro**: "Formato não suportado" + formatos aceitos

---

## 19. Estados Globais da Aplicação

### Error Boundary
- Tela de erro inesperado com "Recarregar" e "Voltar ao início"

### 404
- Ilustração + "Página não encontrada" + "Voltar ao Dashboard"

### Offline
- Banner persistente no topo: "Você está offline. Algumas funcionalidades podem não funcionar."
- Indicador de reconexão (Socket.IO)

### Loading (entre páginas)
- Barra de progresso no topo (Next.js nProgress)
- Transição suave entre páginas

---

## 20. Componentes Compartilhados

### Sidebar (Shell)
- 240px, fundo dark (slate-900)
- Logo + Nome do app no topo
- Links com ícone + label
- Seção "Projetos" com lista dos últimos 5 projetos clicáveis
- User info no rodapé (avatar + nome + logout)

### Top Header
- 64px, breadcrumb da página atual
- Search bar (encurtada)
- Bell icon com badge de notificações
- Avatar do usuário (dropdown: Perfil, Admin, Sair)

### Modais
- Overlay semi-transparente
- Card centralizado com padding
- Título, corpo, footer (ações)
- Animação de fade + scale
- Fechar: X no canto, clique fora, ESC

### Toasts (react-hot-toast)
- Sucesso: verde, ícone check
- Erro: vermelho, ícone X
- Info: azul, ícone i
- Posição: top-right
- Auto-dismiss: 4 segundos (erro: 8s)

### Empty States
- Ilustração (SVG inline, colorida)
- Título descritivo
- Subtítulo explicativo
- CTA button (se aplicável)

### Loading States
- Skeleton loaders (shimmer animation)
- Forma aproximada do conteúdo (retângulos, círculos)
- Spinner para ações (botões)
- Barra de progresso para uploads
