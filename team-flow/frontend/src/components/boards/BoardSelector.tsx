'use client';

import { FormEvent, useState } from 'react';
import { Check, ChevronDown, LayoutPanelTop, Plus, Star } from 'lucide-react';
import type { Board } from '@/types';

interface BoardSelectorProps {
  boards: Board[];
  activeBoardId?: string;
  loading?: boolean;
  onSelect: (board: Board) => void;
  onCreate: (name: string) => Promise<void>;
  onSetDefault?: (board: Board) => Promise<void>;
}

export default function BoardSelector({
  boards,
  activeBoardId,
  loading = false,
  onSelect,
  onCreate,
  onSetDefault,
}: BoardSelectorProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const activeBoard = boards.find((board) => board.id === activeBoardId) || boards[0];

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      await onCreate(name.trim());
      setName('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
      >
        <LayoutPanelTop className="w-4 h-4 text-primary-600" />
        <span className="max-w-40 truncate">{loading ? 'Carregando...' : activeBoard?.name || 'Sem board'}</span>
        {activeBoard?.isDefault && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-2 w-72 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-2">
          <div className="max-h-64 overflow-y-auto">
            {boards.map((board) => (
              <div key={board.id} className="flex items-center gap-1 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    onSelect(board);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/30">
                    <LayoutPanelTop className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{board.name}</span>
                    <span className="block text-xs text-gray-500">{board.columns.length} coluna(s)</span>
                  </span>
                  {board.id === activeBoardId && <Check className="w-4 h-4 text-primary-600" />}
                </button>
                {onSetDefault && !board.isDefault && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onSetDefault(board);
                      setOpen(false);
                    }}
                    className="mr-1 rounded-md p-1.5 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20"
                    title="Definir como padrao"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
            {!loading && boards.length === 0 && (
              <p className="px-2 py-4 text-center text-sm text-gray-500">Nenhum board encontrado</p>
            )}
          </div>

          <form onSubmit={handleCreate} className="mt-2 flex gap-2 border-t border-gray-100 pt-2 dark:border-slate-700">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Novo board"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700"
            />
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-white hover:bg-primary-700 disabled:opacity-50"
              title="Criar board"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
