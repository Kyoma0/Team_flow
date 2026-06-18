'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Download, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/api/account/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teamflow-my-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados!');
    } catch { toast.error('Erro ao exportar'); } finally { setExporting(false); }
  };

  const handleDelete = async () => {
    if (confirmText !== 'EXCLUIR') return;
    setDeleting(true);
    try {
      await api.post('/api/account/delete');
      toast.success('Conta excluída');
      logout();
      router.push('/login');
    } catch { toast.error('Erro ao excluir conta'); } finally { setDeleting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Gerenciar Conta</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Download className="w-5 h-5" /> Exportar dados</h2>
        <p className="text-sm text-gray-500">Baixe todos os seus dados em formato JSON</p>
        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exportar meus dados
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 p-6 space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5" /> Excluir conta</h2>
        <p className="text-sm text-gray-500">Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.</p>
        <div className="space-y-2">
          <p className="text-sm font-medium">Digite <strong>EXCLUIR</strong> para confirmar:</p>
          <input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)}
            placeholder="EXCLUIR"
            className="w-full px-3 py-2 rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-red-500 outline-none" />
          <button onClick={handleDelete} disabled={confirmText !== 'EXCLUIR' || deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Excluir minha conta permanentemente
          </button>
        </div>
      </div>
    </div>
  );
}
