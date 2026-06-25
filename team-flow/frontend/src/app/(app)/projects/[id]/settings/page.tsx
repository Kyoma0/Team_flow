'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Archive, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectSettingsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/api/projects/${id}`).then(({ data }) => {
      setProject(data);
      setFormData({
        name: data.name,
        description: data.description || '',
        startDate: data.startDate ? data.startDate.split('T')[0] : '',
        endDate: data.endDate ? data.endDate.split('T')[0] : '',
      });
      setLoading(false);
    });
  }, [id]);

  const isOwner = project?.ownerId === user?.id;
  if (!isOwner) return <div className="text-center py-20 text-gray-500">Apenas o dono do projeto pode acessar as configurações.</div>;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, startDate: formData.startDate || undefined, endDate: formData.endDate || undefined };
      await api.patch(`/api/projects/${id}`, payload);
      toast.success('Projeto atualizado!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Arquivar este projeto?')) return;
    await api.post(`/api/projects/${id}/archive`);
    toast.success('Projeto arquivado');
    router.push('/projects');
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza? Esta ação não pode ser desfeita.')) return;
    await api.delete(`/api/projects/${id}`);
    toast.success('Projeto excluído');
    router.push('/projects');
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Informações do projeto</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data início</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data fim</label>
            <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        </div>
        <button type="submit" disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </form>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Zona de Perigo</h2>
        <p className="text-sm text-gray-500">Ações irreversíveis</p>
        <div className="flex gap-3">
          <button onClick={handleArchive} className="flex items-center gap-2 px-4 py-2 border border-yellow-300 text-yellow-700 rounded-lg text-sm hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
            <Archive className="w-4 h-4" /> Arquivar projeto
          </button>
          <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20">
            <Trash2 className="w-4 h-4" /> Excluir projeto
          </button>
        </div>
      </div>
    </div>
  );
}
