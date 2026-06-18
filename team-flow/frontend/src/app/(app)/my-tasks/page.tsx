'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { ListTodo, Loader2, ChevronRight, Clock, AlertTriangle, User, Star } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';

const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Nao iniciada',
  IN_PROGRESS: 'Em andamento',
  PAUSED: 'Pausada',
  IN_REVIEW: 'Em revisao',
  COMPLETED: 'Concluida',
};

const STATUS_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export default function MyTasksPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [favFilter, setFavFilter] = useState(searchParams.get('favorites') === 'true');
  const { isTaskFavorite, toggleTask } = useFavorites();

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/api/tasks/my');
      setTasks(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const filtered = tasks
    .filter((t) => (filter === 'all' || t.status === filter) && (!favFilter || isTaskFavorite(t.id)))
    .sort((a: any, b: any) => STATUS_ORDER.indexOf(a.priority) - STATUS_ORDER.indexOf(b.priority));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ListTodo className="w-6 h-6" /> Minhas tarefas</h1>
        <div className="flex gap-1">
          <button onClick={() => setFavFilter(!favFilter)}
            className={`flex items-center gap-1 px-3 py-1 text-xs rounded-lg font-medium ${favFilter ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' : 'text-gray-500 hover:bg-gray-100'}`}>
            <Star className={`w-3.5 h-3.5 ${favFilter ? 'fill-yellow-500' : ''}`} /> Favoritas
          </button>
          {['all', 'NOT_STARTED', 'IN_PROGRESS', 'PAUSED', 'IN_REVIEW', 'COMPLETED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-lg font-medium ${filter === s ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 hover:bg-gray-100'}`}>
              {s === 'all' ? 'Todas' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <ListTodo className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Nenhuma tarefa encontrada</p>
          <p className="text-sm">Você não tem tarefas atribuídas a você{filter !== 'all' ? ' com este status' : ''}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task: any) => (
            <div key={task.id} onClick={() => router.push(`/projects/${task.projectId}`)}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                      className={`p-0.5 rounded shrink-0 transition-colors ${isTaskFavorite(task.id) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500'}`}>
                      <Star className={`w-3.5 h-3.5 ${isTaskFavorite(task.id) ? 'fill-yellow-500' : ''}`} />
                    </button>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      task.priority === 'URGENT' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      task.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>{task.priority}</span>
                    <span className="text-xs text-gray-500">{task.project?.name || 'Sem projeto'}</span>
                  </div>
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {STATUS_LABELS[task.status] || task.status}</span>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500' : ''}`}>
                        <AlertTriangle className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
