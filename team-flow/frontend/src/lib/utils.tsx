import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
}

export function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'NOT_STARTED': return 'bg-gray-500';
    case 'IN_PROGRESS': return 'bg-blue-500';
    case 'PAUSED': return 'bg-yellow-500';
    case 'IN_REVIEW': return 'bg-purple-500';
    case 'COMPLETED': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    NOT_STARTED: 'Não iniciada',
    IN_PROGRESS: 'Em andamento',
    PAUSED: 'Pausada',
    IN_REVIEW: 'Em revisão',
    COMPLETED: 'Concluída',
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return labels[priority] || priority;
}

export function renderMentions(text: string): ReactNode {
  const parts = text.split(/(@[\w.-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <span key={i} className="text-primary-600 dark:text-primary-400 font-medium">{part}</span>;
    }
    return part;
  });
}

export function getPriorityColor(priority: string) {
  switch (priority) {
    case 'LOW': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    case 'MEDIUM': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
    case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
    case 'URGENT': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-700';
  }
}
