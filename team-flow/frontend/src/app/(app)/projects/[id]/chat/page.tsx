'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import { Plus, Send, Image, FileText, Users, LogOut, MessageSquare, Paperclip, Download, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime, formatBytes } from '@/lib/utils';

export default function ProjectChatPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGroups = useCallback(async () => {
    const { data } = await api.get(`/api/groups/project/${id}`);
    setGroups(data);
    if (data.length > 0 && !activeGroup) setActiveGroup(data[0]);
  }, [id, activeGroup]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  // Socket connection
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('message:new', (message: any) => {
      if (message.groupId === activeGroup?.id) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('message:typing', (data: { userId: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (data.isTyping) next.add(data.userId);
        else next.delete(data.userId);
        return next;
      });
    });

    return () => {
      socket.off('message:new');
      socket.off('message:typing');
    };
  }, [token, activeGroup?.id]);

  // Join group room
  useEffect(() => {
    if (!socketRef.current || !activeGroup) return;
    socketRef.current.emit('join:group', activeGroup.id);
    fetchMessages(activeGroup.id);

    return () => {
      if (socketRef.current) socketRef.current.emit('leave:group', activeGroup.id);
    };
  }, [activeGroup?.id]);

  const fetchMessages = async (groupId: string) => {
    const { data } = await api.get(`/api/chat/messages/${groupId}`);
    setMessages(data.reverse());
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedFile) || !socketRef.current || !activeGroup) return;

    let fileId: string | undefined;

    if (attachedFile) {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const { data } = await api.post(`/api/files/upload?projectId=${id}&groupId=${activeGroup.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileId = data.id;
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Erro ao enviar arquivo');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    socketRef.current.emit('message:send', {
      content: messageText || (fileId ? 'Arquivo enviado' : ''),
      groupId: activeGroup.id,
      fileId,
    });
    setMessageText('');
    setAttachedFile(null);
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socketRef.current || !activeGroup) return;
    socketRef.current.emit('message:typing', { groupId: activeGroup.id, isTyping });
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/groups', { name: groupName, projectId: id });
      toast.success('Grupo criado!');
      setShowCreateModal(false);
      setGroupName('');
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar grupo');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await api.post(`/api/groups/${groupId}/join`);
      toast.success('Você entrou no grupo');
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao entrar');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await api.post(`/api/groups/${groupId}/leave`);
      toast.success('Você saiu do grupo');
      if (activeGroup?.id === groupId) setActiveGroup(null);
      fetchGroups();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao sair');
    }
  };

  const isMember = (group: any) =>
    group.members?.some((m: any) => m.userId === user?.id);

  return (
    <div className="flex gap-4 h-[calc(100vh-220px)]">
      {/* Groups sidebar */}
      <div className="w-64 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700">
          <h3 className="font-semibold text-sm">Grupos</h3>
          <button onClick={() => setShowCreateModal(true)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {groups.map((group) => (
            <div key={group.id}
              className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors
                ${activeGroup?.id === group.id ? 'bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}
              onClick={() => setActiveGroup(group)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 text-xs font-medium">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{group.name}</p>
                  <p className="text-xs text-gray-500">{group._count?.members || 0} membros</p>
                </div>
              </div>
              {!isMember(group) && (
                <button onClick={(e) => { e.stopPropagation(); handleJoinGroup(group.id); }}
                  className="text-xs text-primary-600 hover:underline shrink-0">
                  Entrar
                </button>
              )}
              {isMember(group) && group.createdById === user?.id && (
                <button onClick={(e) => { e.stopPropagation(); handleLeaveGroup(group.id); }}
                  className="text-xs text-red-500 hover:underline shrink-0">
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {groups.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">Nenhum grupo</p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
        {activeGroup ? (
          <>
            <div className="p-3 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <h3 className="font-semibold">{activeGroup.name}</h3>
              <div className="relative flex items-center gap-1">
                {searchQuery ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={searchQuery} onChange={async (e) => {
                      const q = e.target.value;
                      setSearchQuery(q);
                      if (!q.trim()) { setSearchResults(null); setSearching(false); return; }
                      setSearching(true);
                      try {
                        const { data } = await api.get(`/api/chat/search/${activeGroup.id}?q=${encodeURIComponent(q)}`);
                        setSearchResults(data);
                      } catch { setSearchResults([]); }
                      setSearching(false);
                    }}
                      autoFocus placeholder="Buscar mensagens..." className="w-48 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    {searching && <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
                    <button onClick={() => { setSearchQuery(''); setSearchResults(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setSearchQuery(' ')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                    <Search className="w-4 h-4" />
                  </button>
                )}
                {searchResults !== null && searchQuery.trim() && (
                  <div className="absolute z-50 top-full right-0 mt-1 w-80 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.length === 0 ? (
                      <p className="text-xs text-gray-500 p-3 text-center">Nenhuma mensagem encontrada</p>
                    ) : (
                      searchResults.map((msg: any) => (
                        <button key={msg.id} onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                          className="w-full flex items-start gap-2 px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-slate-600 border-b border-gray-100 dark:border-slate-600 last:border-0">
                          <div className="w-6 h-6 rounded-full bg-primary-400 flex items-center justify-center text-white text-[10px] font-medium shrink-0 mt-0.5">
                            {msg.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{msg.user?.name}</p>
                            <p className="text-gray-600 dark:text-gray-400 truncate">{msg.content}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.userId === user?.id ? 'justify-end' : ''}`}>
                  {msg.userId !== user?.id && (
                    <div className="w-8 h-8 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-medium shrink-0">
                      {msg.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${msg.userId === user?.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700'} rounded-lg px-3 py-2`}>
                    {msg.userId !== user?.id && (
                      <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">{msg.user?.name}</p>
                    )}
                    {msg.content && <p className="text-sm">{msg.content}</p>}
                    {msg.file && (
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/files/${msg.fileId}/download`}
                        className="flex items-center gap-2 mt-1 px-2 py-1.5 rounded-lg bg-white/20 dark:bg-slate-800/50 text-xs hover:bg-white/30">
                        <FileText className="w-3 h-3" />
                        <span className="truncate">{msg.file.originalName}</span>
                        <Download className="w-3 h-3 shrink-0" />
                      </a>
                    )}
                    <p className="text-[10px] opacity-70 mt-1 text-right">{formatDateTime(msg.createdAt)}</p>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center py-12 text-gray-500 text-sm">Nenhuma mensagem ainda</div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 space-y-2">
              {attachedFile && (
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-1.5 text-sm">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="flex-1 truncate">{attachedFile.name}</span>
                  <span className="text-xs text-gray-400">{formatBytes(attachedFile.size)}</span>
                  <button onClick={() => setAttachedFile(null)} className="text-red-500 hover:text-red-700">&times;</button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input ref={fileInputRef} type="file" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAttachedFile(f); } e.target.value = ''; }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                  className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                  onFocus={() => handleTyping(true)} onBlur={() => handleTyping(false)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                />
                <button type="submit" disabled={(!messageText.trim() && !attachedFile) || uploadingFile}
                  className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50">
                  {uploadingFile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Selecione um grupo ou crie um novo</p>
            </div>
          </div>
        )}
      </div>

      {/* Create group modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">Novo grupo</h2>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do grupo</label>
                <input type="text" value={groupName} onChange={(e) => setGroupName(e.target.value)}
                  required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Design, Backend, Geral" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
