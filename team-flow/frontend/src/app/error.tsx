'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function RootError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-white dark:bg-slate-900">
      <AlertTriangle className="w-20 h-20 text-red-400 mb-6" />
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
