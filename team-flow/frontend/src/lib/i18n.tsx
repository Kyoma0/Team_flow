type Messages = Record<string, string>;

type Locale = 'pt-BR' | 'en-US';

let currentLocale: Locale = 'pt-BR';

const messages: Record<Locale, Messages> = {
  'pt-BR': {
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.create': 'Criar',
    'common.search': 'Pesquisar',
    'common.loading': 'Carregando...',
    'common.noResults': 'Nenhum resultado encontrado',
    'task.not_started': 'Não iniciada',
    'task.in_progress': 'Em andamento',
    'task.paused': 'Pausada',
    'task.in_review': 'Em revisão',
    'task.completed': 'Concluída',
    'priority.low': 'Baixa',
    'priority.medium': 'Média',
    'priority.high': 'Alta',
    'priority.urgent': 'Urgente',
    'auth.login': 'Entrar',
    'auth.logout': 'Sair',
    'auth.register': 'Cadastrar',
    'project.title': 'Projetos',
    'project.new': 'Novo Projeto',
    'project.members': 'Membros',
    'dashboard.title': 'Painel',
    'dashboard.tasks': 'Tarefas',
    'messages.title': 'Mensagens',
    'notifications.title': 'Notificações',
    'settings.title': 'Configurações',
    'profile.title': 'Perfil',
  },
  'en-US': {
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.noResults': 'No results found',
    'task.not_started': 'Not started',
    'task.in_progress': 'In progress',
    'task.paused': 'Paused',
    'task.in_review': 'In review',
    'task.completed': 'Completed',
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',
    'auth.login': 'Sign in',
    'auth.logout': 'Sign out',
    'auth.register': 'Register',
    'project.title': 'Projects',
    'project.new': 'New Project',
    'project.members': 'Members',
    'dashboard.title': 'Dashboard',
    'dashboard.tasks': 'Tasks',
    'messages.title': 'Messages',
    'notifications.title': 'Notifications',
    'settings.title': 'Settings',
    'profile.title': 'Profile',
  },
};

export function t(key: string): string {
  const localeMessages = messages[currentLocale];
  if (localeMessages && key in localeMessages) {
    return localeMessages[key];
  }
  return key;
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(currentLocale === 'en-US' ? 'en-US' : 'pt-BR').format(value);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(
    currentLocale === 'en-US' ? 'en-US' : 'pt-BR',
    { style: 'currency', currency: currentLocale === 'en-US' ? 'USD' : 'BRL' },
  ).format(value);
}
