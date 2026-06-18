'use client';

import { useState, useMemo } from 'react';
import { ViewMode, Gantt } from 'gantt-task-react';
import 'gantt-task-react/dist/index.css';

export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  assignee?: string;
  status: string;
  dependencies?: string[];
  type: 'task' | 'milestone' | 'project';
}

interface Props {
  tasks: GanttTask[];
  onTaskClick?: (taskId: string) => void;
}

export default function GanttChart({ tasks, onTaskClick }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Day);

  const ganttTasks = useMemo(() => {
    return tasks
      .filter((t) => t.start && t.end)
      .map((t) => ({
        start: new Date(t.start),
        end: new Date(t.end),
        name: t.name,
        id: t.id,
        type: t.type === 'milestone' ? 'milestone' as const : 'task' as const,
        progress: t.progress,
        dependencies: t.dependencies?.filter(Boolean) || [],
        isDisabled: false,
        styles: { progressColor: '#6366f1', progressSelectedColor: '#4f46e5' },
      }));
  }, [tasks]);

  const handleClick = (task: any) => {
    if (onTaskClick) onTaskClick(task.id);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Cronograma</h3>
        <div className="flex items-center gap-1">
          {[ViewMode.Day, ViewMode.Week, ViewMode.Month].map((mode) => (
            <button key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-xs rounded-lg font-medium ${viewMode === mode ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
              {mode === ViewMode.Day ? 'Dia' : mode === ViewMode.Week ? 'Semana' : 'Mês'}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        {ganttTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">Nenhuma tarefa com datas definidas</p>
            <p className="text-xs mt-1">Adicione datas de início e término às tarefas para visualizar o cronograma</p>
          </div>
        ) : (
          <div style={{ minWidth: ganttTasks.length > 5 ? `${ganttTasks.length * 120}px` : '600px' }}>
            <Gantt
              tasks={ganttTasks}
              viewMode={viewMode}
              onDoubleClick={handleClick}
              listCellWidth="180px"
              projectBackgroundColor="transparent"
              projectProgressColor="#6366f1"
              projectProgressSelectedColor="#4f46e5"
            />
          </div>
        )}
      </div>
    </div>
  );
}
