'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { Plus, FolderKanban, MoreHorizontal, Search, Filter, Building2, Star, ListChecks, Users, Layers } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isProjectFavorite, toggleProject } = useFavorites();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({ name: '', description: '', startDate: '', endDate: '', clientId: '' });
  const [creating, setCreating] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const limit = 12;

  const fetchProjects = async (p = page) => {
    try {
      const { data } = await api.get(`/api/projects?page=${p}&limit=${limit}`);
      setProjects(data.projects);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Erro ao buscar projetos:', err);
      setProjects([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const openCreateModal = async () => {
    setShowCreateModal(true);
    try {
      const { data } = await api.get('/api/clients');
      setClients(data);
    } catch {
      setClients([]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = { ...formData, startDate: formData.startDate || undefined, endDate: formData.endDate || undefined };
      await api.post('/api/projects', payload);
      toast.success('Projeto criado!');
      setShowCreateModal(false);
      setFormData({ name: '', description: '', startDate: '', endDate: '', clientId: '' });
      fetchProjects(1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar');
    } finally {
      setCreating(false);
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFav = !showFavoritesOnly || isProjectFavorite(p.id);
    return matchesSearch && matchesFav;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projetos</h1>
          <p className="text-gray-500 dark:text-gray-400">{stats?.active} ativos · {stats?.total} total</p>
        </div>
        <button onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 text-center">
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 text-center">
            <p className="text-lg font-bold text-green-600">{stats.active}</p>
            <p className="text-xs text-gray-500">Ativos</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 text-center">
            <p className="text-lg font-bold text-blue-600">{stats.completed}</p>
            <p className="text-xs text-gray-500">Concluídos</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 text-center">
            <p className="text-lg font-bold text-gray-500">{stats.archived}</p>
            <p className="text-xs text-gray-500">Arquivados</p>
          </div>
        </div>
      )}

      {/* Search & filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>
        <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border transition-colors ${showFavoritesOnly ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 text-yellow-600' : 'border-gray-300 dark:border-slate-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
          <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-yellow-500' : ''}`} />
          Favoritos
        </button>
      </div>

      {/* Project list */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-md transition-shadow group"
          >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-primary-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleProject(project.id); }}
                    className={`p-1 rounded transition-colors ${isProjectFavorite(project.id) ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500'}`}>
                    <Star className={`w-4 h-4 ${isProjectFavorite(project.id) ? 'fill-yellow-500' : ''}`} />
                  </button>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                    project.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  }`}>
                    {project.status === 'ACTIVE' ? 'Ativo' : project.status === 'ARCHIVED' ? 'Arquivado' : 'Concluído'}
                  </span>
                </div>
              </div>
            <h3 className="font-semibold text-base mb-1 group-hover:text-primary-600 transition-colors">{project.name}</h3>
            {project.client && (
              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mb-2">
                <Building2 className="w-3 h-3" /> {project.client.name}
              </div>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{project.description || 'Sem descrição'}</p>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-100 dark:border-slate-700">
              <span className="flex items-center gap-1"><ListChecks className="w-3.5 h-3.5 text-gray-400" /> {project._count.tasks}</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gray-400" /> {project._count.members}</span>
              <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-gray-400" /> {project._count.groups}</span>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-gray-500">
            <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum projeto encontrado</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => { setPage(pagination.page - 1); fetchProjects(pagination.page - 1); }}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700">
            Anterior
          </button>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => { setPage(p); fetchProjects(p); }}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${p === pagination.page ? 'bg-primary-600 text-white' : 'border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
              {p}
            </button>
          ))}
          <button onClick={() => { setPage(pagination.page + 1); fetchProjects(pagination.page + 1); }}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700">
            Próximo
          </button>
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo Projeto</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente</label>
                <select value={formData.clientId} onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Sem cliente</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
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
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {creating ? 'Criando...' : 'Criar projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
