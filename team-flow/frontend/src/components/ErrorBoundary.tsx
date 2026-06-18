'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Algo deu errado</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" /> Recarregar página
          </button>
          {this.state.error && (
            <details className="mt-4 text-left w-full max-w-md">
              <summary className="text-sm text-gray-500 cursor-pointer">Detalhes do erro</summary>
              <pre className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-700 dark:text-red-300 overflow-auto max-h-40">
                {this.state.error.message}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
