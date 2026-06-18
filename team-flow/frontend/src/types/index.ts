export interface User {
  id: string;
  username?: string;
  name: string;
  email: string;
  emailVerified: boolean;
  roleType: 'ADMIN' | 'LEADER' | 'EMPLOYEE';
  avatar?: string;
  role?: Role;
  isActive: boolean;
  planId?: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  owner: { id: string; name: string; email: string; avatar?: string };
  members: ProjectMember[];
  _count: { tasks: number; members: number; groups: number; files: number };
  createdAt: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; avatar?: string; roleType?: string };
}

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'IN_REVIEW' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  position: number;
  projectId: string;
  boardColumnId?: string;
  boardColumn?: BoardColumn;
  assignedTo?: { id: string; name: string; avatar?: string };
  createdBy: { id: string; name: string; avatar?: string };
  comments: TaskComment[];
  histories: TaskHistory[];
  files: FileItem[];
  _count?: { comments: number };
  createdAt: string;
}

export interface TaskComment {
  id: string;
  content: string;
  userId: string;
  user: { id: string; name: string; avatar?: string };
  createdAt: string;
}

export interface TaskHistory {
  id: string;
  field: string;
  oldValue?: string;
  newValue?: string;
  user: { id: string; name: string; avatar?: string };
  createdAt: string;
}

export interface FileItem {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  version: number;
  uploadedBy: { id: string; name: string };
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  projectId: string;
  createdBy: { id: string; name: string };
  members: GroupMember[];
  _count: { members: number; messages: number };
}

export interface GroupMember {
  id: string;
  userId: string;
  user: { id: string; name: string; avatar?: string };
}

export interface Message {
  id: string;
  content?: string;
  userId: string;
  user: { id: string; name: string; avatar?: string };
  file?: FileItem;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  sender?: { id: string; name: string; avatar?: string };
  project?: { id: string; name: string };
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  projectId: string;
  isDefault: boolean;
  order: number;
  columns: BoardColumn[];
  createdAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  color: string;
  status: string;
  order: number;
  boardId: string;
  _count?: { tasks: number };
}

export interface DashboardStats {
  projects: { total: number; active: number; completed: number; archived: number };
  tasks: { total: number; notStarted: number; inProgress: number; paused: number; completed: number };
  recentProjects: any[];
  recentTasks: any[];
  productivity: { completedThisWeek: number; completionRate: number };
}
