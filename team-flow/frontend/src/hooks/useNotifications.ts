'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Notification } from '@/types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get('/api/notifications');
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const markAsRead = async (id: string) => {
    await api.patch(`/api/notifications/${id}/read`);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await api.patch('/api/notifications/read-all');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const remove = async (id: string) => {
    await api.delete(`/api/notifications/${id}`);
    setNotifications((prev) => {
      const next = prev.filter((n) => n.id !== id);
      const wasUnread = prev.find((n) => n.id === id && !n.read);
      if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
      return next;
    });
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, remove, refresh: fetch };
}
