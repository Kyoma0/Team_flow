'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarTask {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  assigneeName?: string;
}

interface Props {
  tasks: CalendarTask[];
  onTaskClick?: (taskId: string) => void;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300',
  IN_REVIEW: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300',
  PAUSED: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300',
  NOT_STARTED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-300',
};

const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

export default function CalendarView({ tasks, onTaskClick }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const goPrev = () => setCurrentDate(new Date(year, month - 1, 1));
  const goNext = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [year, month]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, CalendarTask[]> = {};
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = task.dueDate.split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push(task);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
    }
    return map;
  }, [tasks]);

  const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayKey = dateKey(new Date());

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ChevronLeft className="w-5 h-5" /></button>
          <h3 className="text-lg font-semibold">{MONTHS[month]} {year}</h3>
          <button onClick={goNext} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <button onClick={goToday} className="px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700">
          Hoje
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-slate-700">
        {calendarDays.map(({ date, isCurrentMonth }, i) => {
          const key = dateKey(date);
          const dayTasks = tasksByDate[key] || [];
          const isToday = key === todayKey;

          return (
            <div
              key={i}
              className={`min-h-[90px] border-r border-b border-gray-200 dark:border-slate-700 p-1 ${isCurrentMonth ? '' : 'opacity-40'}`}
            >
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary-600 text-white' : ''}`}>
                {date.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick?.(task.id)}
                    className={`w-full text-left text-[10px] px-1 py-0.5 rounded border truncate ${STATUS_COLORS[task.status] || 'bg-gray-100 text-gray-700'}`}
                    title={task.title}
                  >
                    {task.title}
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-gray-500 px-1">+{dayTasks.length - 3} mais</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
