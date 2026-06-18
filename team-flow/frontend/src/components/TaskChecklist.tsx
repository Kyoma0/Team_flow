'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { CheckSquare, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChecklistItem {
  id: string;
  content: string;
  checked: boolean;
  order: number;
}

interface Props {
  taskId: string;
}

export default function TaskChecklist({ taskId }: Props) {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchItems = useCallback(async () => {
    try { const { data } = await api.get(`/api/tasks/${taskId}/checklist`); setItems(data); } catch {} finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    setAdding(true);
    try {
      const { data } = await api.post(`/api/tasks/${taskId}/checklist`, { content: newItem });
      setItems([...items, data]);
      setNewItem('');
    } catch { toast.error('Erro ao adicionar'); } finally { setAdding(false); }
  };

  const handleToggle = async (id: string) => {
    const { data } = await api.patch(`/api/tasks/${taskId}/checklist/${id}/toggle`);
    setItems(items.map((i) => (i.id === id ? { ...i, checked: data.checked } : i)));
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/tasks/${taskId}/checklist/${id}`);
    setItems(items.filter((i) => i.id !== id));
  };

  const completed = items.filter((i) => i.checked).length;

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>;

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
        <CheckSquare className="w-4 h-4" />
        Checklist {items.length > 0 && <span className="text-xs text-gray-500 font-normal">({completed}/{items.length})</span>}
      </h4>

      {items.length > 0 && (
        <div className="mb-2 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(completed / items.length) * 100}%` }} />
        </div>
      )}

      <div className="space-y-1 mb-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group">
            <input type="checkbox" checked={item.checked} onChange={() => handleToggle(item.id)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0" />
            <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : ''}`}>{item.content}</span>
            <button onClick={() => handleDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-1">
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
          placeholder="Adicionar item..."
          className="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-1 focus:ring-primary-500 outline-none" />
        <button type="submit" disabled={!newItem.trim() || adding}
          className="p-1.5 text-primary-600 disabled:opacity-50 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
