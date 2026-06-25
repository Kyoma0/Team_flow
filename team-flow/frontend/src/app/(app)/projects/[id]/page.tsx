'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import { getTaskSocket } from '@/lib/socket';
import {
  DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Trash2, MessageSquare, Calendar, User, X, AtSign, List, Columns, CalendarDays, Paperclip, Filter, Clock, Play, Square, BarChart3, UserPlus, Eye, CheckSquare, Tags, Star, Settings2, Box } from 'lucide-react';
import dynamic from 'next/dynamic';

const GanttChart = dynamic(
  () => import('@/components/GanttChart'),
  { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-xl h-64" /> }
);
import toast from 'react-hot-toast';
import { getStatusLabel, getPriorityLabel, getPriorityColor, getStatusColor, renderMentions, is3DModel } from '@/lib/utils';
import MentionsInput from '@/components/MentionsInput';
import TaskComments from '@/components/TaskComments';
import TaskChecklist from '@/components/TaskChecklist';
import CalendarView from '@/components/CalendarView';
import { TagBadge, TagPicker } from '@/components/TagBadge';
import BoardColumnManager from '@/components/boards/BoardColumnManager';
import BoardSelector from '@/components/boards/BoardSelector';
import { useFavorites } from '@/hooks/useFavorites';
import type { Board, BoardColumn } from '@/types';

function SortableTask({ task, onClick, isFavorite, onToggleFavorite }: { task: any; onClick: () => void; isFavorite?: boolean; onToggleFavorite?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button {...listeners} className="mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <p className="text-sm font-medium leading-tight">{task.title}</p>
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(); }}
              className={`p-0.5 rounded shrink-0 transition-colors ${isFavorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500'}`}>
              <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-yellow-500' : ''}`} />
            </button>
          </div>
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {task.priority && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" /> {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            {task.tags?.length > 0 && task.tags.slice(0, 3).map((tag: any) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
            {task.tags?.length > 3 && (
              <span className="text-[10px] text-gray-400">+{task.tags.length - 3}</span>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-slate-600">
            <div className="flex items-center gap-2">
              {task.assignedTo && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className="w-5 h-5 rounded-full bg-primary-400 flex items-center justify-center text-white text-[10px] font-medium">
                    {task.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                  {task.assignedTo.name}
                </div>
              )}
            </div>
            {task._count?.comments > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MessageSquare className="w-3 h-3" /> {task._count.comments}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ column, tasks, onAddTask, onTaskClick, getIsFavorite, onToggleFavorite }: {
  column: any;
  tasks: any[];
  onAddTask: () => void;
  onTaskClick: (task: any) => void;
  getIsFavorite: (taskId: string) => boolean;
  onToggleFavorite: (taskId: string) => void;
}) {
  const { setNodeRef } = useSortable({ id: column.id, data: { type: 'column', column } });

  return (
    <div className="flex-1 min-w-[260px] max-w-[320px] bg-gray-100 dark:bg-slate-800/50 rounded-xl border-t-4" style={{ borderTopColor: column.color }}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">{column.name}</h3>
          <span className="text-xs text-gray-500 bg-gray-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button onClick={onAddTask} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div ref={setNodeRef} className="p-2 space-y-2 min-h-[100px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} onClick={() => onTaskClick(task)}
              isFavorite={getIsFavorite(task.id)} onToggleFavorite={() => onToggleFavorite(task.id)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400">Nenhuma tarefa</div>
        )}
      </div>
    </div>
  );
}

export default function ProjectBoardPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const selectedTaskIdRef = useRef<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'calendar' | 'gantt'>('kanban');
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'NOT_STARTED', priority: 'MEDIUM', dueDate: '', assignedToId: '', boardColumnId: '', recurring: '', repeatUntil: '',
  });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeResults, setAssigneeResults] = useState<any[]>([]);
  const [showAssigneeResults, setShowAssigneeResults] = useState(false);
  const [assigneeSearching, setAssigneeSearching] = useState(false);

  const [filters, setFilters] = useState({ status: '', priority: '', assignedToId: '', dueDateFrom: '', dueDateTo: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [showFavTasksOnly, setShowFavTasksOnly] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [page, setPage] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [depSearchQuery, setDepSearchQuery] = useState('');
  const [depResults, setDepResults] = useState<any[]>([]);
  const [showDepResults, setShowDepResults] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentFiles, setCommentFiles] = useState<File[]>([]);
  const [uploadingCommentFiles, setUploadingCommentFiles] = useState(false);
  const commentFileInputRef = useRef<HTMLInputElement>(null);

  // Custom field state
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Trash state
  const [showTrash, setShowTrash] = useState(false);
  const [trashTasks, setTrashTasks] = useState<any[]>([]);

  const fetchTrashTasks = async () => {
    const { data } = await api.get(`/api/tasks/project/${id}/trash`);
    setTrashTasks(data);
  };

  useEffect(() => { if (showTrash) fetchTrashTasks(); }, [showTrash]);
  useEffect(() => { fetchProjectTags(); }, []);

  // Watch state
  const [isWatching, setIsWatching] = useState(false);
  const [watcherCount, setWatcherCount] = useState(0);

  // Board state
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoard, setActiveBoard] = useState<Board | null>(null);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [boardLoading, setBoardLoading] = useState(true);

  const fetchBoards = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/boards/project/${id}`);
      setBoards(data);
      setActiveBoard((current) => {
        if (current) return data.find((board: Board) => board.id === current.id) || data[0] || null;
        return data.find((board: Board) => board.isDefault) || data[0] || null;
      });
    } catch {} finally {
      setBoardLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const handleCreateBoard = async (name: string) => {
    try {
      const { data } = await api.post('/api/boards', {
        name,
        projectId: id,
        columns: [
          { name: 'Não iniciada', color: '#6b7280', status: 'NOT_STARTED', order: 0 },
          { name: 'Em andamento', color: '#3b82f6', status: 'IN_PROGRESS', order: 1 },
          { name: 'Pausada', color: '#eab308', status: 'PAUSED', order: 2 },
          { name: 'Em revisão', color: '#a855f7', status: 'IN_REVIEW', order: 3 },
          { name: 'Concluída', color: '#22c55e', status: 'COMPLETED', order: 4 },
        ],
      });
      setBoards((prev) => [...prev, data]);
      setActiveBoard(data);
      toast.success('Board criado!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar board');
    }
  };

  const handleSetDefaultBoard = async (board: Board) => {
    try {
      const { data } = await api.patch(`/api/boards/${board.id}/default`);
      setBoards((current) => current.map((item) => ({ ...item, isDefault: item.id === data.id })));
      setActiveBoard(data);
      toast.success('Board padrao atualizado');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao atualizar board');
    }
  };

  // Favorites
  const { isTaskFavorite, toggleTask } = useFavorites();

  // Tag state
  const [projectTags, setProjectTags] = useState<any[]>([]);
  const [taskTags, setTaskTags] = useState<any[]>([]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showNewTagForm, setShowNewTagForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [tagLoading, setTagLoading] = useState(false);

  const fetchProjectTags = async () => {
    try { const { data } = await api.get(`/api/tags/project/${id}`); setProjectTags(data); } catch {}
  };

  const fetchTaskTags = async (taskId: string) => {
    try { const { data } = await api.get(`/api/tags/task/${taskId}`); setTaskTags(data); } catch {}
  };

  const handleAddTag = async (tagId: string) => {
    if (!selectedTask) return;
    try {
      await api.post(`/api/tags/task/${selectedTask.id}/tag/${tagId}`);
      fetchTaskTags(selectedTask.id);
      toast.success('Tag adicionada');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao adicionar tag');
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!selectedTask) return;
    try {
      await api.delete(`/api/tags/task/${selectedTask.id}/tag/${tagId}`);
      fetchTaskTags(selectedTask.id);
    } catch { toast.error('Erro ao remover tag'); }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setTagLoading(true);
    try {
      await api.post('/api/tags', { name: newTagName.trim(), color: newTagColor, projectId: id });
      setNewTagName('');
      setNewTagColor('#3b82f6');
      setShowNewTagForm(false);
      await fetchProjectTags();
      toast.success('Tag criada');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar tag');
    } finally { setTagLoading(false); }
  };

  // Time tracking state
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [runningTimer, setRunningTimer] = useState<any>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [manualDuration, setManualDuration] = useState(0);
  const [manualDescription, setManualDescription] = useState('');

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fetchTimeEntries = async (taskId: string) => {
    try {
      const { data } = await api.get(`/api/time/task/${taskId}`);
      setTimeEntries(data);
    } catch {}
  };

  const fetchRunningTimer = async () => {
    try {
      const { data } = await api.get('/api/time/running');
      if (data) setRunningTimer(data);
    } catch {}
  };

  useEffect(() => {
    if (selectedTask) {
      api.get(`/api/tasks/${selectedTask.id}/watching`).then(({ data }) => setIsWatching(data.watching));
      api.get(`/api/tasks/${selectedTask.id}/watchers`).then(({ data }) => setWatcherCount(data.length));
    }
  }, [selectedTask?.id]);

  const handleTaskClick = async (taskId: string) => {
    selectedTaskIdRef.current = taskId;
    const resumo = tasks.find((t) => t.id === taskId) || null;
    setSelectedTask(resumo);

    try {
      const { data } = await api.get(`/api/tasks/${taskId}`);
      if (selectedTaskIdRef.current === taskId) {
        setSelectedTask(data);
      }
    } catch (err) {
      if (selectedTaskIdRef.current === taskId) {
        console.error('Falha ao buscar detalhes completos da tarefa', err);
      }
    }
  };

  const closeTaskPanel = () => {
    selectedTaskIdRef.current = null;
    setSelectedTask(null);
  };

  const handleSelectTask = (task: any) => {
    selectedTaskIdRef.current = task?.id || null;
    setSelectedTask(task);
    if (task) {
      fetchTimeEntries(task.id);
      fetchTaskTags(task.id);
      api.get(`/api/projects/${id}/custom-fields`).then(({ data }) => setCustomFields(data));
      api.get(`/api/tasks/${task.id}/custom-fields`).then(({ data }) => {
        const vals: Record<string, string> = {};
        data.forEach((v: any) => { vals[v.customFieldId] = v.value || ''; });
        setFieldValues(vals);
      });
      if (!task.files) {
        const currentId = task.id;
        api.get(`/api/tasks/${currentId}`).then(({ data }) => {
          if (selectedTaskIdRef.current === currentId) {
            setSelectedTask(data);
          }
        }).catch(() => {});
      }
    }
  };

  const handleFieldChange = async (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    if (selectedTask) {
      await api.post(`/api/tasks/${selectedTask.id}/custom-fields/${fieldId}`, { value });
    }
  };

  const handleCommentSubmit = async () => {
    if ((!commentText.trim() && commentFiles.length === 0) || !selectedTask) return;
    setUploadingCommentFiles(true);
    try {
      if (commentFiles.length > 0) {
        for (const file of commentFiles) {
          const formData = new FormData();
          formData.append('file', file);
          await api.post(`/api/files/upload?projectId=${id}&taskId=${selectedTask.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      if (commentText.trim()) {
        if (replyingTo) {
          await api.post('/api/comments/reply', { commentId: replyingTo, content: commentText });
        } else {
          await api.post('/api/comments', { taskId: selectedTask.id, content: commentText });
        }
      }

      setCommentText('');
      setReplyingTo(null);
      setCommentFiles([]);
      const { data } = await api.get(`/api/tasks/${selectedTask.id}`);
      handleSelectTask(data);
      fetchTasks();
      if (commentFiles.length > 0) toast.success('Arquivo(s) anexado(s)!');
    } catch {
      toast.error('Erro ao enviar');
    } finally {
      setUploadingCommentFiles(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.assignedToId) params.set('assignedToId', filters.assignedToId);
    if (filters.dueDateFrom) params.set('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params.set('dueDateTo', filters.dueDateTo);
    params.set('page', String(page));
    params.set('limit', '50');
    return params.toString();
  }, [filters, page]);

  const fetchTasks = useCallback(async () => {
    const qs = buildQueryString();
    const { data } = await api.get(`/api/tasks/project/${id}?${qs}`);
    const all = (data.all || []).map((t: any) => ({
      ...t,
      tags: (t.tags || []).map((tt: any) => tt.tag || tt),
    }));
    setTasks(all);
    setTotalTasks(data.total);
    setLoading(false);
  }, [id, buildQueryString]);

  useEffect(() => { fetchTasks(); fetchRunningTimer(); }, [fetchTasks]);

  useEffect(() => {
    const socket = getTaskSocket();
    socket.emit('join:project', id);
    socket.on('task:created', () => fetchTasks());
    socket.on('task:updated', () => fetchTasks());
    socket.on('task:deleted', () => fetchTasks());
    return () => {
      socket.emit('leave:project', id);
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [id, fetchTasks]);

  const getColumnTasks = (column: BoardColumn) => {
    const activeBoardColumnIds = new Set((activeBoard?.columns || []).map((item) => item.id));

    return tasks.filter((task) => {
      const assignedToThisColumn = task.boardColumnId === column.id;
      const assignedInsideActiveBoard = task.boardColumnId && activeBoardColumnIds.has(task.boardColumnId);
      const fallsBackToStatus = !assignedInsideActiveBoard && task.status === column.status;

      return (assignedToThisColumn || fallsBackToStatus) && (!showFavTasksOnly || isTaskFavorite(task.id));
    }).sort((a, b) => a.position - b.position);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (!over || !activeBoard) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    let targetColumn: BoardColumn | undefined;
    if (over.data.current?.type === 'column') {
      targetColumn = over.data.current.column;
    } else {
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetColumn = activeBoard.columns.find((column) => column.id === overTask.boardColumnId)
          || activeBoard.columns.find((column) => column.status === overTask.status);
      }
    }

    if (!targetColumn) return;

    if (targetColumn.id !== activeTaskData.boardColumnId || targetColumn.status !== activeTaskData.status || active.id !== over.id) {
      setTasks((prev) =>
        prev.map((t) => (t.id === active.id ? { ...t, status: targetColumn!.status, boardColumnId: targetColumn!.id, boardColumn: targetColumn } : t))
      );
      try {
        const { data } = await api.post(`/api/boards/${activeBoard.id}/tasks`, {
          taskId: active.id,
          columnId: targetColumn.id,
          position: Date.now(),
        });
        setTasks((prev) => prev.map((task) => (
          task.id === data.id
            ? { ...data, tags: (data.tags || []).map((tt: any) => tt.tag || tt) }
            : task
        )));
      } catch {
        fetchTasks();
      }
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/tasks', {
        ...formData,
        projectId: id,
        assignedToId: formData.assignedToId || undefined,
        boardColumnId: formData.boardColumnId || undefined,
      });
      toast.success('Tarefa criada!');
      setShowTaskModal(false);
      setFormData({ title: '', description: '', status: 'NOT_STARTED', priority: 'MEDIUM', dueDate: '', assignedToId: '', boardColumnId: '', recurring: '', repeatUntil: '' });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao criar tarefa');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await api.patch(`/api/tasks/${editingTask.id}`, {
        ...formData,
        assignedToId: formData.assignedToId || undefined,
        boardColumnId: formData.boardColumnId || undefined,
      });
      toast.success('Tarefa atualizada!');
      setEditingTask(null);
      fetchTasks();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao atualizar');
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      await api.delete(`/api/tasks/dependencies/${depId}`);
      toast.success('Dependência removida');
      const { data } = await api.get(`/api/tasks/${selectedTask.id}`);
      handleSelectTask(data);
    } catch {
      toast.error('Erro ao remover dependência');
    }
  };

  const handleSoftDelete = async (taskId: string) => {
    if (!confirm('Mover para a lixeira?')) return;
    await api.delete(`/api/tasks/${taskId}/soft`);
    toast.success('Tarefa movida para lixeira');
    closeTaskPanel();
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Excluir esta tarefa permanentemente?')) return;
    await api.delete(`/api/tasks/${taskId}`);
    toast.success('Tarefa excluída');
    closeTaskPanel();
    fetchTasks();
  };

  const openCreateModal = (column: BoardColumn) => {
    setFormData({ ...formData, status: column.status, boardColumnId: column.id });
    setShowTaskModal(true);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      assignedToId: task.assignedTo?.id || '',
      boardColumnId: task.boardColumnId || '',
      recurring: task.recurring || '',
      repeatUntil: task.repeatUntil ? task.repeatUntil.split('T')[0] : '',
    });
    setShowTaskModal(true);
  };

  const activeBoardColumns = activeBoard?.columns || [];

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold">Tarefas ({totalTasks})</h2>
          {viewMode === 'kanban' && (
            <>
              <BoardSelector
                boards={boards}
                activeBoardId={activeBoard?.id}
                loading={boardLoading}
                onSelect={(board) => setActiveBoard(board)}
                onCreate={handleCreateBoard}
                onSetDefault={handleSetDefaultBoard}
              />
              <button
                onClick={() => setShowColumnManager(true)}
                disabled={!activeBoard}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <Settings2 className="w-4 h-4" /> Colunas
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFavTasksOnly(!showFavTasksOnly)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs border transition-colors ${showFavTasksOnly ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 text-yellow-600' : 'border-gray-300 dark:border-slate-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
            <Star className={`w-3.5 h-3.5 ${showFavTasksOnly ? 'fill-yellow-500' : ''}`} />
            Favoritas
          </button>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500'}`} title="Filtros">
            <Filter className="w-4 h-4" />
            {(filters.status || filters.priority || filters.assignedToId || filters.dueDateFrom || filters.dueDateTo) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full" />
            )}
          </button>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Columns className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <List className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <CalendarDays className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('gantt')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
          <button onClick={() => { setBulkMode(!bulkMode); setSelectedTasks(new Set()); }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border ${bulkMode ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 text-primary-600' : 'border-gray-300 dark:border-slate-600 text-gray-500 hover:bg-gray-50'}`}>
            <CheckSquare className="w-4 h-4" /> {bulkMode ? 'Sair' : 'Selecionar'}
          </button>
          <button onClick={() => setShowInvite(true)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm">
            <UserPlus className="w-4 h-4" /> Convidar
          </button>
          <button onClick={() => setShowTrash(true)}
            className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <Trash2 className="w-3 h-3" /> Lixeira
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1">Status</label>
            <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Todos</option>
              {activeBoardColumns.map((col) => (<option key={col.id} value={col.status}>{col.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Prioridade</label>
            <select value={filters.priority} onChange={(e) => { setFilters({ ...filters, priority: e.target.value }); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="">Todas</option>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Responsável</label>
            <input type="text" value={filters.assignedToId} onChange={async (e) => {
              const val = e.target.value;
              setFilters({ ...filters, assignedToId: val });
              setPage(1);
            }} placeholder="ID do usuário" className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm w-36 focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Prazo início</label>
            <input type="date" value={filters.dueDateFrom} onChange={(e) => { setFilters({ ...filters, dueDateFrom: e.target.value }); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Prazo fim</label>
            <input type="date" value={filters.dueDateTo} onChange={(e) => { setFilters({ ...filters, dueDateTo: e.target.value }); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
          <button onClick={() => { setFilters({ status: '', priority: '', assignedToId: '', dueDateFrom: '', dueDateTo: '' }); setPage(1); }}
            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
            Limpar
          </button>
        </div>
      )}

      {viewMode === 'kanban' ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={(e) => setActiveTask(tasks.find((t) => t.id === e.active.id))} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {activeBoardColumns.map((col) => (
              <Column key={col.id} column={col} tasks={getColumnTasks(col)} onAddTask={() => openCreateModal(col)} onTaskClick={(task) => handleSelectTask(task)}
                getIsFavorite={isTaskFavorite} onToggleFavorite={toggleTask} />
            ))}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 p-3 shadow-lg w-[280px]">
                <p className="text-sm font-medium">{activeTask.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      ) : viewMode === 'list' ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-700/50 text-xs font-medium text-gray-500 uppercase tracking-wider">
            {bulkMode && tasks.length > 0 && (
              <div className="col-span-1 flex items-center">
                <input type="checkbox"
                  checked={selectedTasks.size === tasks.length}
                  onChange={() => {
                    if (selectedTasks.size === tasks.length) {
                      setSelectedTasks(new Set());
                    } else {
                      setSelectedTasks(new Set(tasks.map((t: any) => t.id)));
                    }
                  }}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
              </div>
            )}
            <div className={bulkMode ? 'col-span-3' : 'col-span-4'}>Tarefa</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Prioridade</div>
            <div className="col-span-2">Responsável</div>
            <div className="col-span-2">Prazo</div>
          </div>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-sm">Nenhuma tarefa encontrada</div>
          ) : (
            tasks.filter((t) => !showFavTasksOnly || isTaskFavorite(t.id)).sort((a, b) => a.position - b.position).map((task) => (
              <div key={task.id} onClick={() => { if (!bulkMode) handleSelectTask(task); }}
                className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer items-center"
              >
                <div className={bulkMode ? 'col-span-3 flex items-center gap-2' : 'col-span-4 flex items-center gap-2'}>
                  {bulkMode && (
                    <input type="checkbox" checked={selectedTasks.has(task.id)} onChange={() => {
                      const next = new Set(selectedTasks);
                      if (next.has(task.id)) next.delete(task.id); else next.add(task.id);
                      setSelectedTasks(next);
                    }} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  )}
                  <button onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className={`p-0.5 rounded shrink-0 transition-colors ${isTaskFavorite(task.id) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500'}`}>
                    <Star className={`w-3.5 h-3.5 ${isTaskFavorite(task.id) ? 'fill-yellow-500' : ''}`} />
                  </button>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(task.status)}`} />
                  <span className="text-sm font-medium truncate">{task.title}</span>
                  {task._count?.comments > 0 && (
                    <span className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                      <MessageSquare className="w-3 h-3" />{task._count.comments}
                    </span>
                  )}
                </div>
                <div className="col-span-2">
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700">{getStatusLabel(task.status)}</span>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>{getPriorityLabel(task.priority)}</span>
                </div>
                <div className="col-span-2 text-sm truncate">
                  {task.assignedTo ? (
                    <div className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-primary-400 flex items-center justify-center text-white text-[10px] font-medium">
                        {task.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs">{task.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
                <div className="col-span-2 text-xs text-gray-500">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView
          tasks={tasks.filter((t) => !showFavTasksOnly || isTaskFavorite(t.id)).map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate || t.createdAt,
            status: t.status,
            priority: t.priority,
            assigneeName: t.assignee?.name,
          }))}
          onTaskClick={(taskId) => handleTaskClick(taskId)}
        />
      ) : viewMode === 'gantt' ? (
        <GanttChart
          tasks={tasks.filter((t) => !showFavTasksOnly || isTaskFavorite(t.id)).map((t) => ({
            id: t.id,
            name: t.title,
            start: new Date(t.startDate || t.createdAt),
            end: new Date(t.dueDate || t.startDate || t.createdAt),
            progress: t.status === 'COMPLETED' ? 100 : t.status === 'IN_PROGRESS' ? 50 : 0,
            status: t.status,
            assignee: t.assignedTo?.name,
            dependencies: t.dependencies?.map((d: any) => d.dependsOnId),
            type: 'task' as const,
          }))}
          onTaskClick={(taskId) => handleTaskClick(taskId)}
        />
      ) : null}

      {bulkMode && selectedTasks.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-3 z-40 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <span className="text-sm font-medium">{selectedTasks.size} tarefa(s) selecionada(s)</span>
            <div className="flex items-center gap-2">
              <select onChange={async (e) => {
                if (e.target.value) {
                  await api.post('/api/tasks/bulk', { taskIds: Array.from(selectedTasks), action: 'status', value: e.target.value });
                  toast.success(`${selectedTasks.size} tarefa(s) atualizada(s)`);
                  setSelectedTasks(new Set());
                  fetchTasks();
                }
              }} defaultValue="" className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                <option value="">Alterar status...</option>
                {activeBoardColumns.map((column) => (
                  <option key={column.id} value={column.status}>{column.name}</option>
                ))}
              </select>
              <select onChange={async (e) => {
                if (e.target.value) {
                  await api.post('/api/tasks/bulk', { taskIds: Array.from(selectedTasks), action: 'priority', value: e.target.value });
                  toast.success(`${selectedTasks.size} tarefa(s) atualizada(s)`);
                  setSelectedTasks(new Set());
                  fetchTasks();
                }
              }} defaultValue="" className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                <option value="">Alterar prioridade...</option>
                <option value="URGENT">Urgente</option>
                <option value="HIGH">Alta</option>
                <option value="MEDIUM">Média</option>
                <option value="LOW">Baixa</option>
              </select>
              <button onClick={async () => {
                if (!confirm(`Excluir ${selectedTasks.size} tarefa(s)?`)) return;
                await api.post('/api/tasks/bulk', { taskIds: Array.from(selectedTasks), action: 'delete', value: '' });
                toast.success(`${selectedTasks.size} tarefa(s) excluída(s)`);
                setSelectedTasks(new Set());
                fetchTasks();
              }} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showColumnManager && activeBoard && (
        <BoardColumnManager
          board={activeBoard}
          onClose={() => setShowColumnManager(false)}
          onChanged={async () => {
            await fetchBoards();
            await fetchTasks();
          }}
        />
      )}

      {/* Task detail panel */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={closeTaskPanel}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 h-full overflow-y-auto p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{selectedTask.title}</h2>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); toggleTask(selectedTask.id); }}
                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border ${isTaskFavorite(selectedTask.id) ? 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 text-yellow-600' : 'border-gray-300 dark:border-slate-600 text-gray-500 hover:bg-gray-50'}`}>
                  <Star className={`w-3 h-3 ${isTaskFavorite(selectedTask.id) ? 'fill-yellow-500' : ''}`} />
                  {isTaskFavorite(selectedTask.id) ? 'Favorita' : 'Favoritar'}
                </button>
                <button onClick={async () => {
                  if (isWatching) {
                    await api.delete(`/api/tasks/${selectedTask.id}/watch`);
                    setIsWatching(false);
                    setWatcherCount((c) => c - 1);
                  } else {
                    await api.post(`/api/tasks/${selectedTask.id}/watch`);
                    setIsWatching(true);
                    setWatcherCount((c) => c + 1);
                  }
                }} className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg border ${isWatching ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-300 text-primary-600' : 'border-gray-300 dark:border-slate-600 text-gray-500 hover:bg-gray-50'}`}>
                  <Eye className="w-3 h-3" />
                  {isWatching ? 'Observando' : 'Observar'} ({watcherCount})
                </button>
                <button onClick={closeTaskPanel}><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="space-y-4">
              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-500 block">Tags</label>
                  <button onClick={() => setShowTagPicker(!showTagPicker)} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Tags className="w-3 h-3" /> Gerenciar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {taskTags.length > 0 ? taskTags.map((tag: any) => (
                    <TagBadge key={tag.id} tag={tag} onRemove={handleRemoveTag} />
                  )) : (
                    <p className="text-xs text-gray-400">Nenhuma tag</p>
                  )}
                </div>
                {showTagPicker && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
                    <TagPicker
                      tags={projectTags}
                      selected={taskTags.map((t: any) => t.id)}
                      onToggle={(tagId) => {
                        if (taskTags.find((t: any) => t.id === tagId)) {
                          handleRemoveTag(tagId);
                        } else {
                          handleAddTag(tagId);
                        }
                      }}
                      projectId={id as string}
                    />
                    {showNewTagForm ? (
                      <div className="flex gap-2 pt-2 border-t dark:border-slate-600">
                        <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                          placeholder="Nome da tag" className="flex-1 px-2 py-1 text-xs rounded border dark:border-slate-600 bg-white dark:bg-slate-700" />
                        <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer" />
                        <button onClick={handleCreateTag} disabled={tagLoading || !newTagName.trim()}
                          className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                          Criar
                        </button>
                        <button onClick={() => setShowNewTagForm(false)} className="px-2 py-1 text-xs border dark:border-slate-600 rounded hover:bg-gray-100 dark:hover:bg-slate-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowNewTagForm(true)} className="text-xs text-primary-600 hover:underline pt-1 block">
                        + Nova tag
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 block">Status</label>
                <span className={`inline-block px-2 py-1 rounded text-sm font-medium ${selectedTask.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : selectedTask.status === 'IN_REVIEW' ? 'bg-purple-100 text-purple-700' : selectedTask.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : selectedTask.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                  {getStatusLabel(selectedTask.status)}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500 block">Descrição</label>
                <p className="text-sm">{selectedTask.description || 'Sem descrição'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block">Responsável</label>
                <p className="text-sm">{selectedTask.assignedTo?.name || 'Não atribuído'}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500 block">Prioridade</label>
                <span className={`px-2 py-1 rounded text-sm font-medium ${getPriorityColor(selectedTask.priority)}`}>
                  {getPriorityLabel(selectedTask.priority)}
                </span>
              </div>
              {selectedTask.dueDate && (
                <div>
                  <label className="text-sm text-gray-500 block">Prazo</label>
                  <p className="text-sm">{new Date(selectedTask.dueDate).toLocaleDateString()}</p>
                </div>
              )}

              {/* Dependencies */}
              <div className="pt-4 border-t dark:border-slate-700">
                <h3 className="text-sm font-semibold mb-3">Dependências</h3>

                {selectedTask.dependencies?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Depende de:</p>
                    <div className="space-y-1">
                      {selectedTask.dependencies.map((dep: any) => (
                        <div key={dep.id} className="flex items-center justify-between bg-orange-50 dark:bg-orange-900/20 rounded-lg px-3 py-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(dep.dependsOn.status)}`} />
                            <span className="text-sm truncate">{dep.dependsOn.title}</span>
                          </div>
                          <button onClick={() => handleRemoveDependency(dep.id)} className="text-red-500 hover:text-red-700 shrink-0 ml-2">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.dependents?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Bloqueia:</p>
                    <div className="space-y-1">
                      {selectedTask.dependents.map((dep: any) => (
                        <div key={dep.id} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-1.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(dep.task.status)}`} />
                          <span className="text-sm truncate">{dep.task.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="flex gap-2">
                    <input type="text" value={depSearchQuery} onChange={async (e) => {
                      setDepSearchQuery(e.target.value);
                      if (e.target.value.length < 2) { setDepResults([]); setShowDepResults(false); return; }
                      setShowDepResults(true);
                      try {
                        const { data } = await api.get(`/api/tasks/project/${id}?search=${e.target.value}`);
                        const allTasks = data.all || [];
                        setDepResults(allTasks.filter((t: any) => t.id !== selectedTask?.id));
                      } catch { setDepResults([]); }
                    }}
                      placeholder="Buscar tarefa para dependência..."
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  {showDepResults && depResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg max-h-40 overflow-y-auto">
                      {depResults.map((t: any) => (
                        <button key={t.id} type="button" onClick={async () => {
                          try {
                            await api.post(`/api/tasks/${selectedTask.id}/dependencies`, { dependsOnId: t.id });
                            toast.success('Dependência adicionada!');
                            const { data } = await api.get(`/api/tasks/${selectedTask.id}`);
                            handleSelectTask(data);
                          } catch (err: any) {
                            toast.error(err.response?.data?.message || 'Erro ao adicionar dependência');
                          }
                          setShowDepResults(false);
                          setDepSearchQuery('');
                        }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-600 text-left">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(t.status)}`} />
                          <span className="truncate">{t.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Fields */}
              {customFields.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Campos personalizados</h4>
                  <div className="space-y-3">
                    {customFields.map((field) => (
                      <div key={field.id}>
                        <label className="block text-xs font-medium mb-1">
                          {field.name} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select value={fieldValues[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700">
                            <option value="">Selecione...</option>
                            {(JSON.parse(field.options || '[]') as string[]).map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={fieldValues[field.id] === 'true'} onChange={(e) => handleFieldChange(field.id, String(e.target.checked))}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                            {fieldValues[field.id] === 'true' ? 'Sim' : 'Não'}
                          </label>
                        ) : field.type === 'date' ? (
                          <input type="date" value={fieldValues[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                        ) : field.type === 'number' ? (
                          <input type="number" value={fieldValues[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                        ) : (
                          <input type="text" value={fieldValues[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            className="w-full px-2 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {selectedTask.files?.length > 0 && (
                <div className="pt-4 border-t dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip className="w-4 h-4" />
                    <h3 className="text-sm font-semibold">Arquivos ({selectedTask.files.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedTask.files.map((file: any) => (
                      <div key={file.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.originalName}</p>
                          <p className="text-xs text-gray-500">
                            {file.size > 1024 * 1024
                              ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              : `${(file.size / 1024).toFixed(0)} KB`}
                            {file.uploadedBy?.name && ` · ${file.uploadedBy.name}`}
                            {` · ${new Date(file.createdAt).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-3">
                          {is3DModel(file.originalName) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); router.push(`/viewer/${file.id}`); }}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
                              title="Visualizar em 3D"
                            >
                              <Box className="w-3 h-3" /> 3D
                            </button>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const { data: blob } = await api.get(`/api/files/${file.id}/download`, { responseType: 'blob' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = file.originalName;
                                a.click();
                                URL.revokeObjectURL(url);
                              } catch {
                                toast.error('Erro ao baixar arquivo');
                              }
                            }}
                            className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <TaskComments taskId={selectedTask.id} />

              <TaskChecklist taskId={selectedTask.id} />

              {/* Time Tracking */}
              <div className="pt-4 border-t dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Tempo</h3>
                  <button onClick={() => setShowTimeModal(true)} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                    <Plus className="w-3 h-3" /> Lançar horas
                  </button>
                </div>

                {timeEntries.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {timeEntries.map((entry: any) => (
                      <div key={entry.id} className="flex items-center justify-between py-1.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm">{formatDuration(entry.duration)}</p>
                          {entry.description && <p className="text-xs text-gray-500 truncate">{entry.description}</p>}
                          <p className="text-xs text-gray-400">{entry.user?.name} · {new Date(entry.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Nenhum registro de tempo</p>
                )}

                <div className="flex gap-2 mt-3">
                  {runningTimer?.taskId === selectedTask.id ? (
                    <button onClick={async () => {
                      await api.post(`/api/time/stop/${runningTimer.id}`);
                      setRunningTimer(null);
                      fetchTimeEntries(selectedTask.id);
                      toast.success('Timer parado');
                    }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600">
                      <Square className="w-3 h-3" /> Parar
                    </button>
                  ) : (
                    <button onClick={async () => {
                      const { data } = await api.post(`/api/time/start/${selectedTask.id}`);
                      setRunningTimer(data);
                      toast.success('Timer iniciado');
                    }} className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700">
                      <Play className="w-3 h-3" /> Iniciar timer
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t dark:border-slate-700">
                <button onClick={() => { openEditModal(selectedTask); closeTaskPanel(); }}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
                  Editar
                </button>
                <button onClick={() => handleSoftDelete(selectedTask.id)}
                  className="py-2 px-4 text-red-500 border border-red-300 rounded-lg text-sm hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit task modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">{editingTask ? 'Editar tarefa' : 'Nova tarefa'}</h2>
            <form onSubmit={editingTask ? handleUpdateTask : handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Título *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select value={formData.boardColumnId || activeBoardColumns.find((col) => col.status === formData.status)?.id || ''} onChange={(e) => {
                    const column = activeBoardColumns.find((col) => col.id === e.target.value);
                    setFormData({ ...formData, status: column?.status || formData.status, boardColumnId: column?.id || '' });
                  }}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">
                    {activeBoardColumns.map((col) => (<option key={col.id} value={col.id}>{col.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridade</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prazo</label>
                  <input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Repetir</label>
                  <select value={formData.recurring || ''} onChange={(e) => setFormData({ ...formData, recurring: e.target.value || '' })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="">Não repetir</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekdays">Dias úteis</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
              </div>
              {formData.recurring && (
                <div>
                  <label className="block text-sm font-medium mb-1">Repetir até</label>
                  <input type="date" value={formData.repeatUntil || ''} onChange={(e) => setFormData({ ...formData, repeatUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              )}
              <div className="relative">
                <label className="block text-sm font-medium mb-1">Responsável</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input type="text" value={assigneeSearch} onChange={async (e) => {
                    setAssigneeSearch(e.target.value);
                    if (e.target.value.length < 2) { setAssigneeResults([]); setShowAssigneeResults(false); return; }
                    setAssigneeSearching(true); setShowAssigneeResults(true);
                    try { const { data } = await api.get(`/api/users/search?q=${e.target.value}`); setAssigneeResults(Array.isArray(data) ? data : data.value || []); } catch { setAssigneeResults([]); } finally { setAssigneeSearching(false); }
                  }}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    placeholder="@username" />
                  {assigneeSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />}
                </div>
                {showAssigneeResults && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 shadow-lg max-h-40 overflow-y-auto">
                    {assigneeResults.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Ninguém encontrado</p>}
                    {assigneeResults.map((u: any) => (
                      <button key={u.id} type="button" onClick={() => {
                        setAssigneeSearch(`@${u.username}`);
                        setFormData({ ...formData, assignedToId: u.id });
                        setShowAssigneeResults(false);
                      }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-600 text-left">
                        <div className="w-6 h-6 rounded-full bg-primary-400 flex items-center justify-center text-white text-[10px] font-medium">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span>@{u.username}</span>
                        <span className="text-xs text-gray-400">{u.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowTaskModal(false); setEditingTask(null); }}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
                  {editingTask ? 'Salvar' : 'Criar tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTimeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTimeModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Lançar horas</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Duração (minutos)</label>
                <input type="number" min="1" value={manualDuration} onChange={(e) => setManualDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input type="text" value={manualDescription} onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTimeModal(false)}
                  className="flex-1 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-700">
                  Cancelar
                </button>
                <button onClick={async () => {
                  if (manualDuration <= 0) { toast.error('Informe a duração'); return; }
                  try {
                    await api.post('/api/time/log', { taskId: selectedTask.id, duration: manualDuration * 60, description: manualDescription });
                    toast.success('Horas lançadas!');
                    setShowTimeModal(false);
                    setManualDuration(0);
                    setManualDescription('');
                    fetchTimeEntries(selectedTask.id);
                  } catch { toast.error('Erro ao lançar horas'); }
                }} className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTrash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowTrash(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Trash2 className="w-5 h-5 text-red-500" /> Lixeira</h2>
              <button onClick={() => setShowTrash(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"><X className="w-5 h-5" /></button>
            </div>
            {trashTasks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Lixeira vazia</p>
            ) : (
              <div className="space-y-2">
                {trashTasks.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-gray-500">{t.assignedTo?.name || 'Sem responsável'}</p>
                    </div>
                    <button onClick={async () => {
                      await api.post(`/api/tasks/${t.id}/restore`);
                      toast.success('Tarefa restaurada');
                      fetchTrashTasks();
                      fetchTasks();
                    }} className="text-xs text-primary-600 hover:text-primary-700">Restaurar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInvite(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Convidar membro</h3>
            <div className="flex gap-2">
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none" />
              <button onClick={async () => {
                if (!inviteEmail.trim()) return;
                await api.post('/api/invites', { email: inviteEmail, projectId: id });
                toast.success('Convite enviado!');
                setInviteEmail('');
                setShowInvite(false);
              }} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">Convidar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
