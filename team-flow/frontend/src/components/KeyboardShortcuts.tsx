'use client';

import { useState, useEffect } from 'react';
import { Command, X } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], action: 'Busca global' },
  { keys: ['Ctrl', 'N'], action: 'Nova tarefa' },
  { keys: ['Ctrl', 'B'], action: 'Alternar sidebar' },
  { keys: ['Ctrl', 'D'], action: 'Ir para dashboard' },
  { keys: ['Ctrl', 'P'], action: 'Ir para projetos' },
  { keys: ['Ctrl', 'Shift', 'H'], action: 'Abrir ajuda de atalhos' },
  { keys: ['Esc'], action: 'Fechar modal / painel' },
  { keys: ['?'], action: 'Abrir ajuda de atalhos' },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !(e.target as HTMLElement)?.closest) {
        setOpen(true);
      }
      if ((e.key === 'H' || e.key === 'h') && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Command className="w-5 h-5" /> Atalhos do teclado</h2>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1.5">
              <span className="text-sm">{s.action}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((key, j) => (
                  <span key={j} className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded font-mono font-medium">
                    {key}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">Pressione <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-mono">?</kbd> ou <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-slate-700 rounded font-mono">Ctrl+Shift+H</kbd> para abrir esta janela.</p>
      </div>
    </div>
  );
}
