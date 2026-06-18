'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getSocket } from '@/lib/socket';
import { useRouter } from 'next/navigation';
import {
  Send, MessageSquare, Search, X, Paperclip, FileText, Download, Plus, User, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime, formatBytes } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

export default function MessagesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [dmConversations, setDmConversations] = useState<any[]>([]);
  const [activeDm, setActiveDm] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgSearchQuery, setMsgSearchQuery] = useState('');
  const [msgSearchResults, setMsgSearchResults] = useState<any[] | null>(null);
  const [msgSearching, setMsgSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDMs = useCallback(async () => {
    try {
      const { data } = await api.get('/api/groups/dm');
      setDmConversations(data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDMs(); }, [fetchDMs]);

  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('message:new', (msg: any) => {
      if (msg.groupId === activeDm?.id) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => { socket.off('message:new'); };
  }, [token, activeDm?.id]);

  useEffect(() => {
    if (!socketRef.current || !activeDm) return;
    socketRef.current.emit('join:group', activeDm.id);
    fetchMessages(activeDm.id);
    return () => { if (socketRef.current) socketRef.current.emit('leave:group', activeDm.id); };
  }, [activeDm?.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchMessages = async (groupId: string) => {
    const { data } = await api.get(`/api/chat/messages/${groupId}`);
    setMessages(data.reverse());
  };

  const handleUserSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setUserSearchResults([]); setShowUserSearch(false); return; }
    setSearchingUsers(true);
    setShowUserSearch(true);
    try {
      const { data } = await api.get(`/api/users/search?q=${q}`);
      setUserSearchResults(Array.isArray(data) ? data : data.value || []);
    } catch { setUserSearchResults([]); } finally { setSearchingUsers(false); }
  };

  const startDM = async (targetUser: any) => {
    try {
      const { data } = await api.post(`/api/groups/dm/${targetUser.id}`);
      setDmConversations((prev) => {
        const exists = prev.find((g) => g.id === data.id);
        return exists ? prev : [data, ...prev];
      });
      setActiveDm(data);
      setShowUserSearch(false);
      setSearchQuery('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao iniciar conversa');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageText.trim() && !attachedFile) || !socketRef.current || !activeDm) return;

    let fileId: string | undefined;
    if (attachedFile) {
      setUploadingFile(true);
      try {
        const formData = new FormData();
        formData.append('file', attachedFile);
        const { data } = await api.post(`/api/files/upload?projectId=${activeDm.projectId}&groupId=${activeDm.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        fileId = data.id;
      } catch (err: any) {
        toast.error('Erro ao enviar arquivo');
        setUploadingFile(false);
        return;
      }
      setUploadingFile(false);
    }

    socketRef.current.emit('message:send', {
      content: messageText || (fileId ? 'Arquivo enviado' : ''),
      groupId: activeDm.id,
      fileId,
    });
    setMessageText('');
    setAttachedFile(null);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col shrink-0">
        <div className="p-3 border-b border-gray-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Mensagens</h3>
            <button onClick={() => setShowUserSearch(!showUserSearch)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showUserSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => handleUserSearch(e.target.value)}
                autoFocus placeholder="Buscar usuários..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              {searchingUsers && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-500" />}
              {showUserSearch && userSearchResults.length > 0 && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg max-h-48 overflow-y-auto">
                  {userSearchResults.filter((u) => u.id !== user?.id).map((u) => (
                    <button key={u.id} onClick={() => startDM(u)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-600 text-left">
                      <div className="w-7 h-7 rounded-full bg-primary-400 flex items-center justify-center text-white text-xs font-medium">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">@{u.username}</p>
                        <p className="text-xs text-gray-500">{u.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {dmConversations.filter((dm) =>
                dm.dmTarget?.name?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((dm) => (
                <button key={dm.id} onClick={() => { setActiveDm(dm); setShowUserSearch(false); }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${activeDm?.id === dm.id ? 'bg-primary-50 dark:bg-primary-900/50' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                  <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {dm.dmTarget?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{dm.dmTarget?.name || 'Desconhecido'}</p>
                    <p className="text-xs text-gray-500">@{dm.dmTarget?.username}</p>
                  </div>
                </button>
              ))}
              {!loading && dmConversations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhuma conversa</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col">
        {activeDm ? (
          <>
            <div className="flex items-center justify-between gap-2 p-3 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium shrink-0">
                  {activeDm.dmTarget?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{activeDm.dmTarget?.name}</p>
                  <p className="text-xs text-gray-500">@{activeDm.dmTarget?.username}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-1 shrink-0">
                {msgSearchQuery ? (
                  <div className="flex items-center gap-1">
                    <input type="text" value={msgSearchQuery} onChange={async (e) => {
                      const q = e.target.value;
                      setMsgSearchQuery(q);
                      if (!q.trim()) { setMsgSearchResults(null); setMsgSearching(false); return; }
                      setMsgSearching(true);
                      try {
                        const { data } = await api.get(`/api/chat/search/${activeDm.id}?q=${encodeURIComponent(q)}`);
                        setMsgSearchResults(data);
                      } catch { setMsgSearchResults([]); }
                      setMsgSearching(false);
                    }}
                      autoFocus placeholder="Buscar mensagens..." className="w-48 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    {msgSearching && <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
                    <button onClick={() => { setMsgSearchQuery(''); setMsgSearchResults(null); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setMsgSearchQuery(' ')} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
                    <Search className="w-4 h-4" />
                  </button>
                )}
                {msgSearchResults !== null && msgSearchQuery.trim() && (
                  <div className="absolute z-50 top-full right-0 mt-1 w-80 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg max-h-60 overflow-y-auto">
                    {msgSearchResults.length === 0 ? (
                      <p className="text-xs text-gray-500 p-3 text-center">Nenhuma mensagem encontrada</p>
                    ) : (
                      msgSearchResults.map((msg: any) => (
                        <button key={msg.id} onClick={() => { setMsgSearchQuery(''); setMsgSearchResults(null); }}
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
                      {msg.user?.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className={`max-w-[70%] ${msg.userId === user?.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-slate-700'} rounded-lg px-3 py-2`}>
                    {msg.userId !== user?.id && (
                      <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">{msg.user?.name}</p>
                    )}
                    {msg.content && (
                      <MarkdownRenderer content={msg.content}
                        className={msg.userId === user?.id ? 'prose-invert' : ''} />
                    )}
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
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setAttachedFile(f); e.target.value = ''; }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}
                  className="p-2 rounded-lg border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                  <Paperclip className="w-4 h-4" />
                </button>
                <input type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
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
              <p>Selecione uma conversa ou inicie uma nova</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
