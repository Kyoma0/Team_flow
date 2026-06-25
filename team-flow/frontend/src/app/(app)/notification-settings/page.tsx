'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Bell, Save, Loader2 } from 'lucide-react';

interface Prefs {
  notifyTaskAssigned: boolean;
  notifyTaskStatus: boolean;
  notifyDeliveryStatus: boolean;
  notifyMentioned: boolean;
  notifyCommentReply: boolean;
}

const PREF_LABELS: Record<keyof Prefs, { label: string; desc: string }> = {
  notifyTaskAssigned: { label: 'Tarefas atribuídas a mim', desc: 'Quando uma tarefa for atribuída a você' },
  notifyTaskStatus: { label: 'Mudança de status de tarefas', desc: 'Quando o status de uma tarefa sua for alterado' },
  notifyDeliveryStatus: { label: 'Status de entregas', desc: 'Quando o status de uma entrega for alterado' },
  notifyMentioned: { label: 'Menções', desc: 'Quando você for mencionado em comentários' },
  notifyCommentReply: { label: 'Respostas a comentários', desc: 'Quando alguém responder seu comentário' },
};

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    notifyTaskAssigned: true,
    notifyTaskStatus: true,
    notifyDeliveryStatus: true,
    notifyMentioned: true,
    notifyCommentReply: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notification-preferences');
      setPrefs(data);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/api/notification-preferences', prefs);
      toast.success('Preferências salvas!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: keyof Prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="w-6 h-6" /> Notificações</h1>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <p className="text-sm text-gray-500">Escolha quais notificações você deseja receber por email</p>

        {(Object.keys(PREF_LABELS) as (keyof Prefs)[]).map((key) => (
          <label key={key} className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input type="checkbox" checked={prefs[key]} onChange={() => toggle(key)}
                className="sr-only peer" />
              <div className="w-10 h-6 bg-gray-200 dark:bg-slate-600 rounded-full peer-checked:bg-primary-500 transition-colors"></div>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${prefs[key] ? 'translate-x-4' : ''}`}></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium group-hover:text-primary-600 transition-colors">{PREF_LABELS[key].label}</p>
              <p className="text-xs text-gray-500">{PREF_LABELS[key].desc}</p>
            </div>
          </label>
        ))}

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar preferências
        </button>
      </div>
    </div>
  );
}
