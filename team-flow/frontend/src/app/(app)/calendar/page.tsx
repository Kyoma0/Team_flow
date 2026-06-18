'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import CalendarView from '@/components/CalendarView';
import { Calendar, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try { const { data } = await api.get('/api/projects'); setProjects(data); } catch {}
  }, []);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedProject ? `/api/tasks/project/${selectedProject}` : `/api/tasks/all`;
      const { data } = await api.get(url);
      setTasks(Array.isArray(data) ? data : data.tasks || []);
    } catch {} finally { setLoading(false); }
  }, [selectedProject]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleTaskClick = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task?.projectId) {
      router.push(`/projects/${task.projectId}?task=${taskId}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6" /> Calendário</h1>
        <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">Todos os projetos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <CalendarView
          tasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate || t.createdAt,
            status: t.status,
            priority: t.priority,
            assigneeName: t.assignee?.name,
          }))}
          onTaskClick={handleTaskClick}
        />
      )}
    </div>
  );
}
