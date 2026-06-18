'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Search, FolderKanban, ListChecks, Users, FileText, MessageSquare, Package, X, Loader2,
} from 'lucide-react';


interface SearchResults {
  projects: any[];
  tasks: any[];
  users: any[];
  files: any[];
  messages: any[];
  deliveries: any[];
}

const RESULT_ICONS: Record<string, any> = {
  projects: FolderKanban,
  tasks: ListChecks,
  users: Users,
  files: FileText,
  messages: MessageSquare,
  deliveries: Package,
};

const RESULT_LABELS: Record<string, string> = {
  projects: 'Projetos',
  tasks: 'Tarefas',
  users: 'Usuários',
  files: 'Arquivos',
  messages: 'Mensagens',
  deliveries: 'Entregas',
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const performSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); setSearched(false); return; }
    setSearching(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/api/search?q=${encodeURIComponent(q)}`);
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleChange = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(q), 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      performSearch(query);
    }
  };

  const totalResults = results
    ? Object.values(results).reduce((acc: number, arr: any[]) => acc + arr.length, 0)
    : 0;

  const resultKeys = results ? (Object.keys(results) as (keyof SearchResults)[]) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Busca Global</h1>
        <p className="text-gray-500 dark:text-gray-400">Pesquise projetos, tarefas, arquivos, mensagens e entregas</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input ref={inputRef} type="text" value={query} onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua busca... (Ctrl+K para focar)"
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 outline-none text-lg"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); setSearched(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      )}

      {!searching && searched && query.length < 2 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Digite pelo menos 2 caracteres para buscar</p>
        </div>
      )}

      {!searching && searched && query.length >= 2 && totalResults === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhum resultado encontrado para "{query}"</p>
        </div>
      )}

      {!searching && results && totalResults > 0 && (
        <div className="space-y-8">
          <p className="text-sm text-gray-500">{totalResults} resultado(s) para "{query}"</p>
          {resultKeys.map((key) => {
            const items = results[key];
            if (items.length === 0) return null;
            const Icon = RESULT_ICONS[key];
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-5 h-5 text-gray-500" />
                  <h2 className="font-semibold">{RESULT_LABELS[key]} ({items.length})</h2>
                </div>
                <div className="space-y-2">
                  {key === 'projects' && items.map((item: any) => (
                    <Link key={item.id} href={`/projects/${item.id}`}
                      className="block bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                      <p className="text-sm font-medium">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">{item.owner?.name}</p>
                    </Link>
                  ))}
                  {key === 'tasks' && items.map((item: any) => (
                    <Link key={item.id} href={`/projects/${item.projectId}`}
                      className="block bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                      <p className="text-sm font-medium">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        {item.assignedTo ? item.assignedTo.name : 'Não atribuído'}
                      </p>
                    </Link>
                  ))}
                  {key === 'users' && items.map((item: any) => (
                    <div key={item.id}
                      className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">@{item.username}</p>
                          <p className="text-xs text-gray-500">{item.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {key === 'files' && items.map((item: any) => (
                    <Link key={item.id} href={`/projects/${item.projectId}/files`}
                      className="block bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                      <p className="text-sm font-medium">{item.originalName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.uploadedBy?.name}</p>
                    </Link>
                  ))}
                  {key === 'messages' && items.map((item: any) => (
                    <Link key={item.id} href={`/projects/${item.group?.projectId}/chat`}
                      className="block bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                      <p className="text-sm">{item.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.user?.name} em {item.group?.name}</p>
                    </Link>
                  ))}
                  {key === 'deliveries' && items.map((item: any) => (
                    <Link key={item.id} href={`/projects/${item.projectId}/deliveries`}
                      className="block bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.createdBy?.name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
