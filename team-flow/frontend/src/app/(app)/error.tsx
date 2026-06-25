'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-white dark:bg-slate-900">
      <div className="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-primary-600 dark:text-primary-400" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Erro inesperado</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        Desculpe, ocorreu um erro inesperado. Tente novamente.
      </p>
      <div className="flex gap-3">
        <button onClick={() => reset()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </button>
        <a href="/"
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 font-medium">
          Ir para o início
        </a>
      </div>
    </div>
  );
}
