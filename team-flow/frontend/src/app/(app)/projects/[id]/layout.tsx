'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, LayoutPanelTop, FolderOpen, MessageSquare, Package, Settings, Plus, MoreHorizontal, UserPlus, Trash2, Archive, AtSign, X, ListChecks,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { href: `/projects/${id}`, label: 'Board', icon: LayoutPanelTop },
    { href: `/projects/${id}/deliveries`, label: 'Entregas', icon: Package },
    { href: `/projects/${id}/files`, label: 'Arquivos', icon: FolderOpen },
    { href: `/projects/${id}/chat`, label: 'Chat', icon: MessageSquare },
    { href: `/projects/${id}/custom-fields`, label: 'Campos', icon: ListChecks },
    { href: `/projects/${id}/settings`, label: 'Configurações', icon: Settings },
  ];

  const fetchProject = async () => {
    try {
      const { data } = await api.get(`/api/projects/${id}`);
      setProject(data);
    } catch {
      toast.error('Projeto não encontrado');
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isOwner = project?.ownerId === user?.id;

  const handleSearch = async (q: string) => {
    setMemberSearch(q);
    if (q.length < 2) { setSearchResults([]); setShowResults(false); return; }
    setSearching(true);
    setShowResults(true);
    try {
      const { data } = await api.get(`/api/users/search?q=${q}`);
      const results = Array.isArray(data) ? data : data.value || [];
      setSearchResults(results);
    } catch { setSearchResults([]); } finally { setSearching(false); }
  };

  const handleAddMember = async (targetUser: any) => {
    try {
      await api.post(`/api/projects/${id}/members`, { username: targetUser.username });
      toast.success(`${targetUser.name} adicionado!`);
      setMemberSearch('');
      setSearchResults([]);
      setShowMembersModal(false);
      fetchProject();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao adicionar membro');
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleArchive = async () => {
    if (!confirm('Arquivar este projeto?')) return;
    await api.post(`/api/projects/${id}/archive`);
    toast.success('Projeto arquivado');
    router.push('/projects');
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este projeto? Essa ação não pode ser desfeita.')) return;
    await api.delete(`/api/projects/${id}`);
    toast.success('Projeto excluído');
    router.push('/projects');
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!project) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/projects" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">{project.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{project.description || 'Sem descrição'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowMembersModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
            <UserPlus className="w-4 h-4" /> Membro
          </button>
          {isOwner && (
            <>
              <button onClick={handleArchive} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                <Archive className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Members row */}
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {project.members?.slice(0, 6).map((m: any) => (
            <div key={m.id} className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-slate-800" title={m.user.name}>
              {m.user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {project.members?.length > 6 && (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex items-center justify-center text-xs font-medium border-2 border-white dark:border-slate-800">
              +{project.members.length - 6}
            </div>
          )}
        </div>
        <span className="text-sm text-gray-500">{project.members?.length} membros</span>
        <span className="text-sm text-gray-400">|</span>
        <span className="text-sm text-gray-500">{project._count?.tasks} tarefas</span>
        <span className="text-sm text-gray-400">|</span>
        <span className="text-sm text-gray-500">{project._count?.files} arquivos</span>
        <span className="text-sm text-gray-400">|</span>
        <span className="text-sm text-gray-500">{project._count?.groups} grupos</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-slate-700">
        {tabs.map((tab) => {
          const active = typeof window !== 'undefined' && window.location.pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                ${active
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      {children}

      {/* Add member modal */}
      {showMembersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowMembersModal(false); setShowResults(false); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Adicionar membro</h2>
              <button onClick={() => { setShowMembersModal(false); setShowResults(false); }}><X className="w-5 h-5" /></button>
            </div>
            <div ref={searchRef} className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={memberSearch} onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Buscar por @username, nome ou email..."
                autoFocus />
              {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
            </div>
            {showResults && (
              <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                {searchResults.length === 0 && memberSearch.length >= 2 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum usuário encontrado</p>
                )}
                {searchResults.map((u: any) => {
                  const isAlreadyMember = project?.members?.some((m: any) => m.userId === u.id);
                  return (
                    <button key={u.id} onClick={() => !isAlreadyMember && handleAddMember(u)}
                      disabled={isAlreadyMember}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                        ${isAlreadyMember ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                      <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">@{u.username}</p>
                        <p className="text-xs text-gray-500 truncate">{u.name} · {u.email}</p>
                      </div>
                      {isAlreadyMember
                        ? <span className="text-xs text-gray-400">Já é membro</span>
                        : <span className="text-xs text-primary-600 font-medium">Adicionar</span>
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
