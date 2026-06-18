'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg p-4 flex items-center gap-3 max-w-sm">
      <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
        TF
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Instalar TeamFlow</p>
        <p className="text-xs text-gray-500">Adicione à tela inicial</p>
      </div>
      <button onClick={handleInstall} className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium shrink-0">
        Instalar
      </button>
      <button onClick={() => setShow(false)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
