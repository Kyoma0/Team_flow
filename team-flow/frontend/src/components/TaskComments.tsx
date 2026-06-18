'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { MessageSquare, Send, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; avatar?: string };
  parentId?: string;
  replies?: Comment[];
}

interface Props {
  taskId: string;
}

export default function TaskComments({ taskId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = useCallback(async () => {
    try { const { data } = await api.get(`/api/tasks/${taskId}/comments`); setComments(data); } catch {} finally { setLoading(false); }
  }, [taskId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/tasks/${taskId}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (err: any) {
      toast.error('Erro ao enviar comentário');
    } finally { setSending(false); }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/api/tasks/${taskId}/comments`, { content: replyText, parentId });
      setReplyText('');
      setReplyTo(null);
      fetchComments();
    } catch { toast.error('Erro ao responder'); } finally { setSending(false); }
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/api/tasks/${taskId}/comments/${id}`, { content: editText });
      setEditingId(null);
      fetchComments();
    } catch { toast.error('Erro ao editar'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir comentário?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}/comments/${id}`);
      fetchComments();
    } catch { toast.error('Erro ao excluir'); }
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 pl-4 border-l-2 border-gray-100 dark:border-slate-700' : ''}`}>
      <div className="group py-2">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-bold shrink-0">
            {comment.user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={comment.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              (comment.user.name || '?')[0].toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{comment.user.name}</span>
              <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            {editingId === comment.id ? (
              <div className="mt-1 flex gap-2">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-1 focus:ring-primary-500 outline-none resize-none" rows={3} />
                <button onClick={() => handleEdit(comment.id)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <MarkdownRenderer content={comment.content} />
            )}
          </div>
          {user?.id === comment.user.id && editingId !== comment.id && (
            <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
              <button onClick={() => { setEditingId(comment.id); setEditText(comment.content); }} className="p-1 text-gray-400 hover:text-gray-600 rounded"><Edit2 className="w-3 h-3" /></button>
              <button onClick={() => handleDelete(comment.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-3 h-3" /></button>
            </div>
          )}
        </div>
        {!isReply && (
          <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="ml-9 mt-0.5 text-xs text-primary-600 hover:text-primary-700">
            Responder
          </button>
        )}
        {replyTo === comment.id && (
          <div className="ml-9 mt-1 flex gap-2">
            <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escreva uma resposta..." ref={inputRef as any}
              className="flex-1 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-1 focus:ring-primary-500 outline-none resize-none" rows={2} />
            <button onClick={() => handleReply(comment.id)} disabled={!replyText.trim() || sending} className="p-1 text-primary-600 self-end disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </div>
        )}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Comentários ({comments.length})
      </h4>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentário... (Markdown suportado)"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none resize-none" rows={2} />
        <button type="submit" disabled={!newComment.trim() || sending}
          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-lg text-sm self-end">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Nenhum comentário ainda</p>
      ) : (
        <div className="space-y-1">
          {comments.map((c) => renderComment(c))}
        </div>
      )}
    </div>
  );
}
