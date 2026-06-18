'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Key, Plus, Trash2, Copy, Check, Eye, EyeOff, X } from 'lucide-react';

export default function TokensPage() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try { const { data } = await api.get('/api/api-tokens'); setTokens(data); } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;
    try {
      const { data } = await api.post('/api/api-tokens', { name: newTokenName });
      setCreatedToken(data.token);
      setNewTokenName('');
      fetchTokens();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar token');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Revogar este token? Isso não pode ser desfeito.')) return;
    await api.delete(`/api/api-tokens/${id}`);
    toast.success('Token revogado');
    fetchTokens();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Tokens</h1>
          <p className="text-gray-500 dark:text-gray-400">Tokens de acesso programático para integrações</p>
        </div>
        <button onClick={() => { setShowCreate(true); setCreatedToken(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> Novo token
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
          {createdToken ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Token criado com sucesso!</p>
              <p className="text-xs text-gray-500">Copie agora — ele não será mostrado novamente.</p>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                <code className="text-xs font-mono flex-1 break-all">{createdToken}</code>
                <button onClick={() => { navigator.clipboard.writeText(createdToken); toast.success('Copiado!'); }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded shrink-0"><Copy className="w-4 h-4" /></button>
              </div>
              <button onClick={() => { setShowCreate(false); setCreatedToken(null); }}
                className="text-sm text-primary-600 hover:text-primary-700">Fechar</button>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="flex gap-2">
              <input type="text" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)}
                required placeholder="Nome do token (ex: CI/CD)"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
              <button type="submit" disabled={!newTokenName.trim()}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">Criar</button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="p-2 text-gray-500 hover:text-gray-700"><X className="w-4 h-4" /></button>
            </form>
          )}
        </div>
      )}

      {tokens.length === 0 && !showCreate ? (
        <div className="text-center py-20 text-gray-500">
          <Key className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">Nenhum token de API</p>
          <p className="text-sm">Crie tokens para usar a API do TeamFlow programaticamente</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((tk: any) => (
            <div key={tk.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{tk.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Criado em {new Date(tk.createdAt).toLocaleDateString('pt-BR')}
                  {tk.lastUsed ? ` · Último uso: ${new Date(tk.lastUsed).toLocaleDateString('pt-BR')}` : ' · Nunca usado'}
                </p>
              </div>
              <button onClick={() => handleDelete(tk.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
