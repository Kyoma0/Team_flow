'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { User, ListChecks, FileText, Image, File, Bell, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

const getEntityIcon = (entity: string) => {
  switch (entity) {
    case 'user':
    case 'users':
      return User;
    case 'task':
    case 'tasks':
      return ListChecks;
    case 'file':
    case 'files':
      return FileText;
    case 'image':
      return Image;
    default:
      return File;
  }
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    CREATE: 'criou',
    UPDATE: 'atualizou',
    DELETE: 'excluiu',
    LOGIN: 'fez login',
    LOGOUT: 'fez logout',
    UPLOAD: 'enviou',
    DOWNLOAD: 'baixou',
    APPROVE: 'aprovou',
    REJECT: 'rejeitou',
    ASSIGN: 'atribuiu',
    COMMENT: 'comentou',
  };
  return labels[action] || action;
};

const getEntityLabel = (entity: string) => {
  const labels: Record<string, string> = {
    user: 'usuário',
    users: 'usuário',
    task: 'tarefa',
    tasks: 'tarefa',
    file: 'arquivo',
    files: 'arquivo',
    project: 'projeto',
    projects: 'projeto',
    delivery: 'entrega',
    deliveries: 'entrega',
    message: 'mensagem',
    messages: 'mensagem',
  };
  return labels[entity] || entity;
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchActivities = async (p: number) => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/audit', { params: { page: p, limit } });
      setActivities(data.data);
      setTotal(data.total);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(page);
  }, [page]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atividades Recentes</h1>
        <p className="text-gray-500 dark:text-gray-400">Registro de ações no sistema</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
        {loading && activities.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma atividade registrada</p>
          </div>
        ) : (
          activities.map((item) => {
            const Icon = getEntityIcon(item.entity);
            return (
              <div key={item.id} className="flex items-start gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.user?.avatar ? (
                    <img src={item.user.avatar} alt={item.user.name} className="w-full h-full object-cover" />
                  ) : (
                    <Icon className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{item.user?.name || 'Sistema'}</span>
                    {' '}{getActionLabel(item.action)}{' '}
                    <span className="text-gray-500">{getEntityLabel(item.entity)}</span>
                    {item.metadata && <span className="text-gray-400"> · {item.metadata}</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(item.createdAt)}</p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
