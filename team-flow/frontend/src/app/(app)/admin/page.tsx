'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Users, BarChart3, CreditCard, Trash2, Shield, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'users' | 'stats' | 'plans';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    setLoading(true);
    if (tab === 'stats') fetchStats().finally(() => setLoading(false));
    if (tab === 'users') fetchUsers().finally(() => setLoading(false));
    if (tab === 'plans') fetchPlans().finally(() => setLoading(false));
  }, [tab, fetchStats, fetchUsers, fetchPlans]);

  const tabs = [
    { id: 'stats' as Tab, label: 'Estatísticas', icon: BarChart3 },
    { id: 'users' as Tab, label: 'Usuários', icon: Users },
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
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Nome</th>
                  <th className="text-left px-4 py-3 font-medium">Email</th>
                  <th className="text-center px-4 py-3 font-medium">Verif.</th>
                  <th className="text-center px-4 py-3 font-medium">2FA</th>
                  <th className="text-center px-4 py-3 font-medium">Projetos</th>
                  <th className="text-center px-4 py-3 font-medium">Data</th>
                  <th className="text-center px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3 text-center">{u.emailVerified ? '✅' : '❌'}</td>
                    <td className="px-4 py-3 text-center">{u.twoFactorEnabled ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-center">{u._count?.memberships || 0}</td>
                    <td className="px-4 py-3 text-center text-gray-500">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={async () => {
                        if (!confirm(`Excluir ${u.name}?`)) return;
                        await api.delete(`/api/admin/users/${u.id}`);
                        toast.success('Usuário excluído');
                        fetchUsers();
                      }} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === 'plans' ? (
        <div className="space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-sm text-gray-500">R$ {Number(p.price).toFixed(2)} · {p.maxProjects === -1 ? '∞' : p.maxProjects} projetos · {p.maxMembers === -1 ? '∞' : p.maxMembers} membros</p>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">{p.features?.split(',').length || 0} recursos</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
