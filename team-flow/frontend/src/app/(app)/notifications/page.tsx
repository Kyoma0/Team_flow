'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCheck, Trash2, UserPlus, MessageSquare, ListChecks, FolderKanban } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const getIcon = (type: string) => {
  switch (type) {
    case 'task_new': return ListChecks;
    case 'task_status': return ListChecks;
    case 'message': return MessageSquare;
    case 'member_add': return UserPlus;
    case 'project_invite': return FolderKanban;
    case 'mention': return MessageSquare;
    case 'delivery_approved': return CheckCheck;
    case 'delivery_correction': return ListChecks;
    default: return Bell;
  }
};

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, remove } = useNotifications();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-gray-500 dark:text-gray-400">{unreadCount} não lidas</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
            <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => {
          const Icon = getIcon(notif.type);
          return (
            <div key={notif.id}
              className={`flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer
                ${notif.read
                  ? 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                  : 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                }`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                ${notif.read ? 'bg-gray-100 dark:bg-slate-700' : 'bg-primary-100 dark:bg-primary-900/50'}`}>
                <Icon className={`w-5 h-5 ${notif.read ? 'text-gray-500' : 'text-primary-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">{notif.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  {notif.project && (
                    <span className="text-xs text-primary-600">{notif.project.name}</span>
                  )}
                  <span className="text-xs text-gray-500">{timeAgo(notif.createdAt)}</span>
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(notif.id); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {notifications.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma notificação</p>
          </div>
        )}
      </div>
    </div>
  );
}
