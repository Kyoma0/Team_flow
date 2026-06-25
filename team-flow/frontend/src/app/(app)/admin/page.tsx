'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Users, BarChart3, CreditCard, Trash2, Shield, Loader2, Search, Plus, Edit3, X, Check, UserPlus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'users' | 'stats' | 'plans' | 'companies';

interface AdminUser {
  id: string; username: string; name: string; email: string;
  roleType: string; isActive: boolean; emailVerified: boolean;
  twoFactorEnabled: boolean; avatar?: string; createdAt: string;
  planId?: string | null;
  plan?: { id: string; name: string } | null;
  _count?: { memberships: number };
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal states
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create form
  const emptyForm = { name: '', email: '', password: '', username: '', roleType: 'EMPLOYEE' };
  const [createForm, setCreateForm] = useState(emptyForm);

  const fetchStats = useCallback(async () => {
    const { data } = await api.get('/api/admin/stats');
    setStats(data);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await api.get('/api/admin/users');
    setUsers(data);
  }, []);

  const fetchPlans = useCallback(async () => {
    const { data } = await api.get('/api/admin/plans');
    setPlans(data);
  }, []);

  // ─── Companies ──────────────────────────────────────
  const [companies, setCompanies] = useState<any[]>([]);
  const [editCompany, setEditCompany] = useState<any | null>(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');

  const fetchCompanies = useCallback(async () => {
    const { data } = await api.get('/api/admin/companies');
    setCompanies(data);
  }, []);

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) { toast.error('Informe o nome da empresa'); return; }
    setSaving(true);
    try {
      await api.post('/api/admin/companies', { name: newCompanyName.trim() });
      toast.success('Empresa criada');
      setShowCreateCompany(false);
      setNewCompanyName('');
      fetchCompanies();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erro ao criar empresa');
    } finally { setSaving(false); }
  };

  const handleEditCompany = async () => {
    if (!editCompany || !editCompany.name?.trim()) { toast.error('Informe o nome'); return; }
    setSaving(true);
    try {
      await api.patch(`/api/admin/companies/${editCompany.id}`, { name: editCompany.name.trim() });
      toast.success('Empresa atualizada');
      setEditCompany(null);
      fetchCompanies();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erro ao atualizar');
    } finally { setSaving(false); }
  };

  const handleDeleteCompany = async (c: any) => {
    if (!confirm(`Excluir "${c.name}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await api.delete(`/api/admin/companies/${c.id}`);
      toast.success('Empresa excluída');
      fetchCompanies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir');
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'stats') fetchStats().finally(() => setLoading(false));
    if (tab === 'users') fetchUsers().finally(() => setLoading(false));
    if (tab === 'companies') fetchCompanies().finally(() => setLoading(false));
    if (tab === 'plans') fetchPlans().finally(() => setLoading(false));
  }, [tab, fetchStats, fetchUsers, fetchCompanies, fetchPlans]);

  const filtered = search
    ? users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.username?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const handleToggleActive = async (u: AdminUser) => {
    try {
      await api.patch(`/api/admin/users/${u.id}`, { isActive: !u.isActive });
      toast.success(u.isActive ? 'Usuário desativado' : 'Usuário ativado');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar');
    }
  };

  const handleDelete = async (u: AdminUser) => {
    if (!confirm(`Desativar ${u.name}? O usuário não será excluído permanentemente.`)) return;
    try {
      await api.delete(`/api/admin/users/${u.id}`);
      toast.success('Usuário desativado');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao desativar');
    }
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const body: any = {};
      if (editUser.name) body.name = editUser.name;
      if (editUser.email) body.email = editUser.email;
      body.roleType = editUser.roleType;
      body.isActive = editUser.isActive;
      await api.patch(`/api/admin/users/${editUser.id}`, body);
      toast.success('Usuário atualizado');
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast.error('Preencha nome, email e senha');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/admin/users', createForm);
      toast.success('Usuário criado com sucesso');
      setShowCreate(false);
      setCreateForm(emptyForm);
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'stats' as Tab, label: 'Estatísticas', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Usuários', icon: Users },
    { id: 'companies' as Tab, label: 'Empresas', icon: Building2 },
    { id: 'plans' as Tab, label: 'Planos', icon: CreditCard },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6" /> Administração</h1>

      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : tab === 'stats' && stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Usuários', value: stats.users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Projetos', value: stats.projects, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
            { label: 'Tarefas', value: stats.tasks, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
            { label: 'Arquivos', value: stats.files, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
          ].map((s) => (
            <div key={s.label} className={`${s.bg} rounded-xl p-5`}>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      ) : tab === 'users' ? (
        <div className="space-y-4">
          {/* Search + Create */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome, email ou username..."
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
              <UserPlus className="w-4 h-4" /> Novo
            </button>
          </div>

          {/* Users table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nome</th>
                    <th className="text-left px-4 py-3 font-medium">Email</th>
                    <th className="text-center px-4 py-3 font-medium">Tipo</th>
                    <th className="text-center px-4 py-3 font-medium">Ativo</th>
                    <th className="text-center px-4 py-3 font-medium">Verif.</th>
                    <th className="text-center px-4 py-3 font-medium">Projetos</th>
                    <th className="text-center px-4 py-3 font-medium">Data</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">Nenhum usuário encontrado</td></tr>
                  ) : filtered.map((u) => (
                    <tr key={u.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/30 ${!u.isActive ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-gray-500">{u.email}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          u.roleType === 'ADMIN' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          u.roleType === 'LEADER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300'
                        }`}>{u.roleType}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleToggleActive(u)}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors ${
                            u.isActive
                              ? 'border-green-300 text-green-700 bg-green-50 dark:border-green-700 dark:text-green-400 dark:bg-green-900/20'
                              : 'border-red-300 text-red-700 bg-red-50 dark:border-red-700 dark:text-red-400 dark:bg-red-900/20'
                          }`}>
                          {u.isActive ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {u.isActive ? 'Ativo' : 'Inativo'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">{u.emailVerified ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-center">{u._count?.memberships || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditUser({ ...u })}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="Editar">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(u)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Desativar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === 'companies' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">{companies.length} empresa(s) cadastrada(s)</p>
            <button onClick={() => setShowCreateCompany(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
              <Plus className="w-4 h-4" /> Nova Empresa
            </button>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nome</th>
                    <th className="text-center px-4 py-3 font-medium">Membros</th>
                    <th className="text-center px-4 py-3 font-medium">Projetos</th>
                    <th className="text-center px-4 py-3 font-medium">Data</th>
                    <th className="text-center px-4 py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {companies.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Nenhuma empresa cadastrada</td></tr>
                  ) : companies.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-center">{c._count?.members || 0}</td>
                      <td className="px-4 py-3 text-center">{c._count?.projects || 0}</td>
                      <td className="px-4 py-3 text-center text-gray-500 text-xs">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditCompany({ ...c })}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="Editar">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteCompany(c)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : tab === 'plans' ? (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">R$ {Number(p.price).toFixed(2)} · {p.maxProjects === -1 ? '∞' : p.maxProjects} projetos · {p.maxUsers === -1 ? '∞' : p.maxUsers} membros</p>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{Array.isArray(p.features) ? p.features.length : typeof p.features === 'string' ? p.features.split(',').length : 0} recursos</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditUser(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Editar Usuário</h3>
              <button onClick={() => setEditUser(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input type="text" value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select value={editUser.roleType} onChange={e => setEditUser({ ...editUser, roleType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="EMPLOYEE">Funcionário</option>
                  <option value="LEADER">Líder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Ativo</label>
                <button onClick={() => setEditUser({ ...editUser, isActive: !editUser.isActive })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${editUser.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editUser.isActive ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleEdit} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowCreateCompany(false); setNewCompanyName(''); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Nova Empresa</h3>
              <button onClick={() => { setShowCreateCompany(false); setNewCompanyName(''); }} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome da empresa *</label>
              <input type="text" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Ex: Minha Empresa LTDA" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowCreateCompany(false); setNewCompanyName(''); }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleCreateCompany} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {editCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditCompany(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Editar Empresa</h3>
              <button onClick={() => setEditCompany(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nome</label>
              <input type="text" value={editCompany.name} onChange={e => setEditCompany({ ...editCompany, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditCompany(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleEditCompany} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowCreate(false); setCreateForm(emptyForm); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Novo Usuário</h3>
              <button onClick={() => { setShowCreate(false); setCreateForm(emptyForm); }} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input type="text" value={createForm.username} onChange={e => setCreateForm({ ...createForm, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha *</label>
                <input type="password" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select value={createForm.roleType} onChange={e => setCreateForm({ ...createForm, roleType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="EMPLOYEE">Funcionário</option>
                  <option value="LEADER">Líder</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowCreate(false); setCreateForm(emptyForm); }} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={handleCreate} disabled={saving}
                className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
