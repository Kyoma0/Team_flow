'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { BarChart3, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [period, setPeriod] = useState('7');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    try { const { data: p } = await api.get('/api/projects'); setProjects(p); } catch {}
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (selectedProject) params.set('projectId', selectedProject);
      const { data: d } = await api.get(`/api/reports/tasks?${params}`);
      setData(d);
    } catch {} finally { setLoading(false); }
  }, [selectedProject, period]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const STATUS_COLORS: Record<string, string> = {
    NOT_STARTED: '#9ca3af',
    IN_PROGRESS: '#3b82f6',
    PAUSED: '#eab308',
    IN_REVIEW: '#8b5cf6',
    COMPLETED: '#22c55e',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Relatórios</h1>
        <button onClick={() => { if (data) { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'relatorio.json'; a.click(); } }} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50"><Download className="w-4 h-4" /> Exportar</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
          <option value="">Todos os projetos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm">
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : data ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold mb-3">Tarefas por status</h3>
            <div className="space-y-2">
              {Object.entries(data.byStatus || {}).map(([status, count]: any) => (
                <div key={status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{status}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(count / Math.max(...(Object.values(data.byStatus || {}) as number[])) * 100)}%`, backgroundColor: STATUS_COLORS[status] || '#6366f1' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold mb-3">Tarefas por prioridade</h3>
            <div className="space-y-2">
              {Object.entries(data.byPriority || {}).map(([priority, count]: any) => (
                <div key={priority} className="flex justify-between text-xs py-1">
                  <span>{priority}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold mb-3">Tarefas por responsável</h3>
            <div className="space-y-1">
              {Object.entries(data.byAssignee || {}).map(([name, count]: any) => (
                <div key={name} className="flex justify-between text-xs py-1">
                  <span>{name}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h3 className="text-sm font-semibold mb-3">Resumo</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Total de tarefas</span><span className="font-medium">{data.total || 0}</span></div>
              <div className="flex justify-between"><span>Concluídas</span><span className="font-medium text-green-600">{data.byStatus?.COMPLETED || 0}</span></div>
              <div className="flex justify-between"><span>Em andamento</span><span className="font-medium text-yellow-600">{data.byStatus?.IN_PROGRESS || 0}</span></div>
              <div className="flex justify-between"><span>Atrasadas</span><span className="font-medium text-red-600">{data.overdue || 0}</span></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Selecione um período para gerar o relatório</p>
        </div>
      )}
    </div>
  );
}
