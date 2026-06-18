'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Pencil, Trash2, Building2, Mail, Phone, Globe } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', notes: '' });

  const fetchClients = async () => {
    try {
      const res = await api.get('/api/clients');
      setClients(res.data);
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClients(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', company: '', email: '', phone: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (client: any) => {
    setEditing(client);
    setForm({ name: client.name, company: client.company || '', email: client.email || '', phone: client.phone || '', notes: client.notes || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Nome é obrigatório');
    try {
      if (editing) {
        await api.patch(`/api/clients/${editing.id}`, form);
        toast.success('Cliente atualizado');
      } else {
        await api.post('/api/clients', form);
        toast.success('Cliente criado');
      }
      setShowModal(false);
      fetchClients();
    } catch {
      toast.error('Erro ao salvar cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await api.delete(`/api/clients/${id}`);
      toast.success('Cliente excluído');
      fetchClients();
    } catch {
      toast.error('Erro ao excluir cliente');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum cliente cadastrado</p>
          <button onClick={openCreate} className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium">
            Cadastrar primeiro cliente
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Empresa</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Telefone</th>
                <th className="text-center py-3 px-4 font-medium text-gray-500">Projetos</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-medium">{client.name}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{client.company || '-'}</td>
                  <td className="py-3 px-4">
                    {client.email ? (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-1 text-primary-600 hover:underline">
                        <Mail className="w-3.5 h-3.5" /> {client.email}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    {client.phone ? (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" /> {client.phone}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">{client._count?.projects ?? 0}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => openEdit(client)} className="p-1.5 text-gray-400 hover:text-primary-600 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded ml-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold">{editing ? 'Editar Cliente' : 'Novo Cliente'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Empresa</label>
                <input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefone</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
