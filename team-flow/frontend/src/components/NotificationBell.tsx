'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { Bell, BellRing, CheckCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const fetchUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data);
    } catch {}
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/api/notifications?limit=10');
      setNotifications(data.notifications || []);
      fetchUnread();
    } catch {}
  }, [fetchUnread]);

  useEffect(() => {
    fetchUnread();
    pollRef.current = setInterval(fetchUnread, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchUnread]);

  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    await api.post('/api/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (n: any) => {
    if (!n.read) {
      await api.patch(`/api/notifications/${n.id}/read`);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
    }
    if (n.link) router.push(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-5 h-5 text-primary-600" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg z-50 max-h-96 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <CheckCheck className="w-3 h-3" /> Marcar todas lidas
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Nenhuma notificação</p>
            ) : (
              notifications.map((n) => (
                <button key={n.id} onClick={() => handleClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${n.read ? '' : 'bg-primary-50/50 dark:bg-primary-900/10'}`}>
                  <p className="text-sm font-medium">{n.type}</p>
                  {n.content && <p className="text-xs text-gray-500 mt-0.5">{n.content}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('pt-BR')}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
