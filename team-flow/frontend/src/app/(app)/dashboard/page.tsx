'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import type { DashboardStats } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { FolderKanban, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';
import { CardSkeleton, KanbanSkeleton } from '@/components/Skeleton';
import { getStatusLabel, getStatusColor } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import DashboardWidgets from '@/components/DashboardWidgets';

const COLORS = ['#94a3b8', '#3b82f6', '#eab308', '#22c55e'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/dashboard').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div>
        <div className="h-7 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-4 w-48 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mt-2" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <KanbanSkeleton />
    </div>
  );
  if (!data) return <p>Erro ao carregar dados</p>;

  const taskChartData = [
    { name: 'Não iniciada', value: data.tasks.notStarted },
    { name: 'Em andamento', value: data.tasks.inProgress },
    { name: 'Pausada', value: data.tasks.paused },
    { name: 'Concluída', value: data.tasks.completed },
  ];

  const statsCards = [
    { label: 'Projetos ativos', value: data.projects.active, icon: FolderKanban, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/50' },
    { label: 'Tarefas pendentes', value: data.tasks.notStarted + data.tasks.inProgress, icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50' },
    { label: 'Concluídas', value: data.tasks.completed, icon: CheckCircle2, color: 'text-green-600 bg-green-100 dark:bg-green-900/50' },
    { label: 'Produtividade', value: `${data.productivity.completionRate}%`, icon: TrendingUp, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Bem-vindo, {user?.name}</p>
      </div>

      <DashboardWidgets />

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
            <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Task Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição de Tarefas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {taskChartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold mb-4">Produtividade</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">{data.productivity.completedThisWeek}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Concluídas esta semana</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-500">{data.productivity.completionRate}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Taxa de conclusão</p>
            </div>
          </div>

          <h3 className="font-medium mb-3">Tarefas por status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent projects */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Projetos Recentes</h2>
          <Link href="/projects" className="text-sm text-primary-600 hover:underline">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {data.recentProjects.map((project: any) => (
            <Link key={project.id} href={`/projects/${project.id}`}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {project._count.tasks} tarefas · {project._count.members} membros
                </p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                project.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' :
                project.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
              }`}>
                {project.status === 'ACTIVE' ? 'Ativo' : project.status === 'ARCHIVED' ? 'Arquivado' : 'Concluído'}
              </span>
            </Link>
          ))}
          {data.recentProjects.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhum projeto ainda. <Link href="/projects" className="text-primary-600">Crie um projeto</Link></p>
          )}
        </div>
      </div>

      {/* Recent tasks */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4">Tarefas Recentes</h2>
        <div className="space-y-3">
          {data.recentTasks.map((task: any) => (
            <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{task.project.name}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{getStatusLabel(task.status)}</span>
            </div>
          ))}
          {data.recentTasks.length === 0 && (
            <p className="text-gray-500 text-center py-4">Nenhuma tarefa recente</p>
          )}
        </div>
      </div>
    </div>
  );
}
