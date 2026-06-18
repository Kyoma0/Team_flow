'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Plus, FileText, Trash2, ChevronRight, Layers, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_LABELS: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' };

export default function TemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#3b82f6' });
  const [items, setItems] = useState<{ title: string; description: string; priority: string }[]>([
    { title: '', description: '', priority: 'MEDIUM' },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const { data } = await api.get('/api/task-templates');
      setTemplates(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.title.trim());
    if (!formData.name.trim()) { toast.error('Nome do template é obrigatório'); return; }
    if (validItems.length === 0) { toast.error('Adicione pelo menos uma tarefa'); return; }
    try {
      await api.post('/api/task-templates', { ...formData, items: validItems });
      toast.success('Template criado!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', color: '#3b82f6' });
      setItems([{ title: '', description: '', priority: 'MEDIUM' }]);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este template?')) return;
    await api.delete(`/api/task-templates/${id}`);
    toast.success('Template excluído');
    fetchTemplates();
  };

  const handleApply = async (templateId: string) => {
    const projectId = prompt('ID do projeto para aplicar o template:');
    if (!projectId?.trim()) return;
    try {
      const { data } = await api.post(`/api/task-templates/${templateId}/apply/${projectId}`);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao aplicar template');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modelos de Tarefas</h1>
          <p className="text-gray-500 dark:text-gray-400">Crie modelos reutilizáveis de listas de tarefas</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo modelo
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Nenhum modelo ainda</p>
          <p className="text-sm">Crie modelos para padronizar fluxos de trabalho</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: template.color + '20' }}>
                    <Layers className="w-5 h-5" style={{ color: template.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.items?.length || 0} tarefas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleApply(template.id)}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium">
                    Aplicar
                  </button>
                  <button onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedId === template.id ? 'rotate-90' : ''}`} />
                  </button>
                  <button onClick={() => handleDelete(template.id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expandedId === template.id && (
                <div className="border-t border-gray-100 dark:border-slate-700 px-4 py-3 space-y-2">
                  {template.description && <p className="text-sm text-gray-500 mb-2">{template.description}</p>}
                  {template.items?.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[10px] text-gray-500 shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{item.title}</span>
                      <span className="text-xs text-gray-400">{PRIORITY_LABELS[item.priority] || item.priority}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo modelo de tarefas</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" rows={2} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Tarefas do modelo</label>
                  <button type="button" onClick={() => setItems([...items, { title: '', description: '', priority: 'MEDIUM' }])}
                    className="text-xs text-primary-600 hover:underline">+ Adicionar tarefa</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-xs text-gray-400 mt-3 w-5 shrink-0">{idx + 1}.</span>
                      <div className="flex-1 space-y-1">
                        <input type="text" value={item.title} onChange={(e) => {
                          const next = [...items]; next[idx] = { ...next[idx], title: e.target.value }; setItems(next);
                        }} placeholder="Título da tarefa" required
                          className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
                        <div className="flex gap-2">
                          <input type="text" value={item.description} onChange={(e) => {
                            const next = [...items]; next[idx] = { ...next[idx], description: e.target.value }; setItems(next);
                          }} placeholder="Descrição (opcional)"
                            className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
                          <select value={item.priority} onChange={(e) => {
                            const next = [...items]; next[idx] = { ...next[idx], priority: e.target.value }; setItems(next);
                          }} className="px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">
                            <option value="LOW">Baixa</option>
                            <option value="MEDIUM">Média</option>
                            <option value="HIGH">Alta</option>
                            <option value="URGENT">Urgente</option>
                          </select>
                          {items.length > 1 && (
                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))}
                              className="p-1 text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
                  Criar modelo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
