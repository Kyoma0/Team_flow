'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { BarChart3, ListTodo, Clock, AlertTriangle, TrendingUp, Users, FileText, Plus, X } from 'lucide-react';

const WIDGET_TYPES = [
  { id: 'tasks_overdue', label: 'Tarefas atrasadas', icon: AlertTriangle },
  { id: 'tasks_today', label: 'Tarefas de hoje', icon: ListTodo },
  { id: 'tasks_by_status', label: 'Tarefas por status', icon: BarChart3 },
  { id: 'recent_activity', label: 'Atividade recente', icon: TrendingUp },
  { id: 'my_projects', label: 'Meus projetos', icon: Users },
  { id: 'recent_files', label: 'Arquivos recentes', icon: FileText },
  { id: 'time_summary', label: 'Resumo de horas', icon: Clock },
];

interface Widget {
  id: string;
  type: string;
  title: string;
}

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: '1', type: 'tasks_overdue', title: 'Tarefas atrasadas' },
    { id: '2', type: 'tasks_today', title: 'Tarefas de hoje' },
    { id: '3', type: 'tasks_by_status', title: 'Tarefas por status' },
    { id: '4', type: 'recent_activity', title: 'Atividade recente' },
  ]);
  const [showConfig, setShowConfig] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});

  const fetchData = useCallback(async () => {
    try {
      const promises = {
        tasks_overdue: api.get('/api/tasks/overdue').catch(() => ({ data: [] })),
        tasks_today: api.get('/api/tasks/today').catch(() => ({ data: [] })),
        tasks_by_status: api.get('/api/tasks/stats').catch(() => ({ data: {} })),
        recent_activity: api.get('/api/activity?limit=5').catch(() => ({ data: [] })),
        my_projects: api.get('/api/projects').catch(() => ({ data: [] })),
        recent_files: api.get('/api/files/recent').catch(() => ({ data: [] })),
        time_summary: api.get('/api/time/summary').catch(() => ({ data: {} })),
      };

      const results: Record<string, any> = {};
      for (const [key, promise] of Object.entries(promises)) {
        try { results[key] = (await promise).data; } catch { results[key] = null; }
      }
      setData(results);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addWidget = (type: string) => {
    const label = WIDGET_TYPES.find((w) => w.id === type)?.label || type;
    setWidgets([...widgets, { id: String(Date.now()), type, title: label }]);
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const renderWidget = (widget: Widget) => {
    const d = data[widget.type];
    switch (widget.type) {
      case 'tasks_overdue':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h3 className="text-sm font-medium">Tarefas atrasadas</h3>
            </div>
            <p className="text-2xl font-bold text-red-600">{(d as any[])?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Precisam de atenção</p>
          </div>
        );
      case 'tasks_today':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ListTodo className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-medium">Tarefas de hoje</h3>
            </div>
            <p className="text-2xl font-bold">{(d as any[])?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Vencem hoje</p>
          </div>
        );
      case 'tasks_by_status':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-green-500" />
              <h3 className="text-sm font-medium">Status</h3>
            </div>
            {d && typeof d === 'object' ? (
              <div className="space-y-1.5">
                {(Object.entries(d) as [string, number][]).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">Sem dados</p>}
          </div>
        );
      case 'recent_activity':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-medium">Atividade</h3>
            </div>
            <div className="space-y-2">
              {(d as any[])?.slice(0, 3).map((item: any) => (
                <p key={item.id} className="text-xs text-gray-600 dark:text-gray-400 truncate">{item.description}</p>
              )) || <p className="text-xs text-gray-400">Nenhuma atividade</p>}
            </div>
          </div>
        );
      case 'my_projects':
        return (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-medium">Projetos</h3>
            </div>
            <p className="text-2xl font-bold">{(d as any[])?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Ativos</p>
          </div>
        );
      default:
        return <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4"><p className="text-sm text-gray-400">Widget não disponível</p></div>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Visão geral</h2>
        <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700">
          <Plus className="w-4 h-4" /> {showConfig ? 'Fechar' : 'Personalizar'}
        </button>
      </div>

      {showConfig && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Adicionar widget:</p>
          <div className="flex flex-wrap gap-1.5">
            {WIDGET_TYPES.filter((w) => !widgets.find((ww) => ww.type === w.id)).map((w) => (
              <button key={w.id} onClick={() => addWidget(w.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                <w.icon className="w-3 h-3" /> {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {widgets.map((widget) => (
          <div key={widget.id} className="relative group">
            {showConfig && (
              <button onClick={() => removeWidget(widget.id)}
                className="absolute -top-1.5 -right-1.5 z-10 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            )}
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </div>
  );
}
