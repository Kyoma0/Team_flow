'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import type { Board, BoardColumn } from '@/types';

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Nao iniciada' },
  { value: 'IN_PROGRESS', label: 'Em andamento' },
  { value: 'PAUSED', label: 'Pausada' },
  { value: 'IN_REVIEW', label: 'Em revisao' },
  { value: 'COMPLETED', label: 'Concluida' },
];

interface BoardColumnManagerProps {
  board: Board;
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}

export default function BoardColumnManager({ board, onClose, onChanged }: BoardColumnManagerProps) {
  const [columns, setColumns] = useState<BoardColumn[]>(board.columns);
  const [newColumn, setNewColumn] = useState({
    name: '',
    status: 'NOT_STARTED',
    color: '#6b7280',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setColumns(board.columns);
  }, [board]);

  const refresh = async () => {
    await onChanged();
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!newColumn.name.trim()) return;

    setSaving(true);
    try {
      await api.post(`/api/boards/${board.id}/columns`, {
        ...newColumn,
        name: newColumn.name.trim(),
        order: columns.length,
      });
      setNewColumn({ name: '', status: 'NOT_STARTED', color: '#6b7280' });
      toast.success('Coluna criada');
      await refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao criar coluna');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (column: BoardColumn) => {
    setSaving(true);
    try {
      await api.patch(`/api/boards/columns/${column.id}`, {
        name: column.name,
        status: column.status,
        color: column.color,
        order: column.order,
      });
      toast.success('Coluna atualizada');
      await refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao atualizar coluna');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (column: BoardColumn) => {
    if (!confirm(`Excluir a coluna "${column.name}"? As tarefas serao movidas para outra coluna.`)) return;

    setSaving(true);
    try {
      await api.delete(`/api/boards/columns/${column.id}`);
      toast.success('Coluna excluida');
      await refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao excluir coluna');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalColumn = (columnId: string, changes: Partial<BoardColumn>) => {
    setColumns((current) =>
      current.map((column) => (column.id === columnId ? { ...column, ...changes } : column)),
    );
  };

  const usedStatuses = new Set(columns.map((column) => column.status));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-4 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Board</p>
            <h2 className="text-lg font-semibold">Colunas de {board.name}</h2>
            <p className="mt-1 text-sm text-gray-500">Cada coluna aponta para um status de tarefa.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {columns.map((column, index) => (
            <div key={column.id} className="grid gap-2 rounded-xl border border-gray-200 p-3 dark:border-slate-700 md:grid-cols-[1fr_160px_80px_auto_auto]">
              <input
                value={column.name}
                onChange={(event) => updateLocalColumn(column.id, { name: event.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700"
              />
              <select
                value={column.status}
                onChange={(event) => updateLocalColumn(column.id, { status: event.target.value })}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <input
                type="color"
                value={column.color}
                onChange={(event) => updateLocalColumn(column.id, { color: event.target.value })}
                className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white dark:border-slate-600"
              />
              <input
                type="number"
                min="0"
                value={column.order ?? index}
                onChange={(event) => updateLocalColumn(column.id, { order: Number(event.target.value) })}
                className="w-20 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700"
                title="Ordem"
              />
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => handleUpdate(column)}
                  disabled={saving || !column.name.trim()}
                  className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700 disabled:opacity-50"
                  title="Salvar coluna"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(column)}
                  disabled={saving || columns.length <= 1}
                  className="rounded-lg border border-red-200 p-2 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/50 dark:hover:bg-red-900/20"
                  title="Excluir coluna"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreate} className="mt-5 rounded-xl border border-dashed border-gray-300 p-3 dark:border-slate-600">
          <p className="mb-3 text-sm font-medium">Nova coluna</p>
          <div className="grid gap-2 md:grid-cols-[1fr_160px_80px_auto]">
            <input
              value={newColumn.name}
              onChange={(event) => setNewColumn((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nome da coluna"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700"
            />
            <select
              value={newColumn.status}
              onChange={(event) => setNewColumn((current) => ({ ...current, status: event.target.value }))}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-700"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value} disabled={usedStatuses.has(status.value)}>
                  {status.label}
                </option>
              ))}
            </select>
            <input
              type="color"
              value={newColumn.color}
              onChange={(event) => setNewColumn((current) => ({ ...current, color: event.target.value }))}
              className="h-10 w-full cursor-pointer rounded-lg border border-gray-300 bg-white dark:border-slate-600"
            />
            <button
              type="submit"
              disabled={saving || !newColumn.name.trim() || usedStatuses.has(newColumn.status)}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
