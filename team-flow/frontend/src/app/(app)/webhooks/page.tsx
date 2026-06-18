'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Plus, Link as LinkIcon, Trash2, ToggleLeft, ToggleRight, Copy, Eye, EyeOff, History, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_EVENTS = [
  { id: 'task.created', label: 'Tarefa criada' },
  { id: 'task.updated', label: 'Tarefa atualizada' },
  { id: 'task.deleted', label: 'Tarefa excluída' },
  { id: 'delivery.status_changed', label: 'Status de entrega alterado' },
  { id: 'project.created', label: 'Projeto criado' },
  { id: 'project.updated', label: 'Projeto atualizado' },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ url: '', events: [] as string[], projectId: '' });
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const fetchWebhooks = useCallback(async () => {
    try { const { data } = await api.get('/api/webhooks'); setWebhooks(data); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url.trim()) { toast.error('URL é obrigatória'); return; }
    if (formData.events.length === 0) { toast.error('Selecione pelo menos um evento'); return; }
    try {
      const { data } = await api.post('/api/webhooks', formData);
      toast.success('Webhook criado!');
      setShowCreateModal(false);
      setFormData({ url: '', events: [], projectId: '' });
      fetchWebhooks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar webhook');
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await api.patch(`/api/webhooks/${id}`, { active: !current });
    fetchWebhooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este webhook?')) return;
    await api.delete(`/api/webhooks/${id}`);
    toast.success('Webhook excluído');
    fetchWebhooks();
  };

  const toggleReveal = (id: string) => {
    const next = new Set(revealedSecrets);
    if (next.has(id)) next.delete(id); else next.add(id);
    setRevealedSecrets(next);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-gray-500 dark:text-gray-400">Integre o TeamFlow com outros serviços</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo webhook
        </button>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <LinkIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Nenhum webhook configurado</p>
          <p className="text-sm">Crie webhooks para receber eventos em tempo real</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${wh.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <p className="font-medium text-sm truncate">{wh.url}</p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {JSON.parse(wh.events || '[]').map((ev: string) => (
                      <span key={ev} className="px-1.5 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded text-[10px] font-medium">
                        {AVAILABLE_EVENTS.find((e) => e.id === ev)?.label || ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-3">
                  <button onClick={async () => {
                    setShowLogs(wh.id);
                    setLogsLoading(true);
                    try { const { data } = await api.get(`/api/webhooks/${wh.id}/logs`); setWebhookLogs(data); } catch {}
                    setLogsLoading(false);
                  }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500" title="Histórico de entregas">
                    <History className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleReveal(wh.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500" title="Ver secret">
                    {revealedSecrets.has(wh.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleToggle(wh.id, wh.active)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700" title={wh.active ? 'Desativar' : 'Ativar'}>
                    {wh.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
                  </button>
                  <button onClick={() => handleDelete(wh.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {revealedSecrets.has(wh.id) && (
                <div className="mt-2 flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <code className="text-xs flex-1 font-mono">{wh.secret}</code>
                  <button onClick={() => { navigator.clipboard.writeText(wh.secret); toast.success('Secret copiado!'); }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded"><Copy className="w-3 h-3" /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo webhook</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">URL *</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Eventos *</label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label key={ev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={formData.events.includes(ev.id)} onChange={() => {
                        setFormData((prev) => ({
                          ...prev,
                          events: prev.events.includes(ev.id) ? prev.events.filter((e) => e !== ev.id) : [...prev.events, ev.id],
                        }));
                      }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      {ev.label}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Projeto (opcional)</label>
                <input type="text" value={formData.projectId} onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  placeholder="ID do projeto ou deixe vazio para todos"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowLogs(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl mx-4 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Histórico de entregas</h2>
              <button onClick={() => setShowLogs(null)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            {logsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : webhookLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhuma entrega registrada</p>
            ) : (
              <div className="space-y-2">
                {webhookLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.status >= 200 && log.status < 300 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{log.event}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${log.status >= 200 && log.status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {log.status || 'Erro'}
                        </span>
                        <span className="text-xs text-gray-500">{log.duration}ms</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(log.createdAt).toLocaleString('pt-BR')}</p>
                      {log.response && <p className="text-xs text-gray-400 mt-1 truncate">{log.response}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
