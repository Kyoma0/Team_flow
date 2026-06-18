'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, GripVertical, X } from 'lucide-react';

const FIELD_TYPES = [
  { id: 'text', label: 'Texto' },
  { id: 'number', label: 'Número' },
  { id: 'select', label: 'Seleção' },
  { id: 'date', label: 'Data' },
  { id: 'boolean', label: 'Sim/Não' },
];

export default function CustomFieldsPage() {
  const { id } = useParams<{ id: string }>();
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'text', required: false, options: '' });

  const fetchFields = useCallback(async () => {
    try { const { data } = await api.get(`/api/projects/${id}/custom-fields`); setFields(data); } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchFields(); }, [fetchFields]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Nome é obrigatório'); return; }
    try {
      await api.post(`/api/projects/${id}/custom-fields`, {
        name: formData.name,
        type: formData.type,
        required: formData.required,
        options: formData.type === 'select' ? formData.options.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
      });
      toast.success('Campo criado!');
      setShowCreate(false);
      setFormData({ name: '', type: 'text', required: false, options: '' });
      fetchFields();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar campo');
    }
  };

  const handleDelete = async (fieldId: string) => {
    if (!confirm('Excluir este campo? Os valores nas tarefas serão perdidos.')) return;
    await api.delete(`/api/custom-fields/${fieldId}`);
    toast.success('Campo excluído');
    fetchFields();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campos Personalizados</h1>
          <p className="text-gray-500 dark:text-gray-400">Adicione campos extras às tarefas deste projeto</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo campo
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nome *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required placeholder="ex: Cliente, Versão do Blender"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">
                {FIELD_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {formData.type === 'select' && (
              <div>
                <label className="block text-sm font-medium mb-1">Opções (separadas por vírgula)</label>
                <input type="text" value={formData.options} onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="opção 1, opção 2, opção 3"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.required} onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              Campo obrigatório
            </label>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-3 py-1.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm">Cancelar</button>
              <button type="submit" className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">Criar</button>
            </div>
          </form>
        </div>
      )}

      {fields.length === 0 && !showCreate ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium mb-1">Nenhum campo personalizado</p>
          <p className="text-sm">Crie campos para adicionar informações específicas às tarefas</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-sm">{f.name} {f.required && <span className="text-red-500">*</span>}</p>
                  <p className="text-xs text-gray-500">{FIELD_TYPES.find((t) => t.id === f.type)?.label || f.type}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(f.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
