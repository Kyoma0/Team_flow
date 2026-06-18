import api from './api';

export const favoritesApi = {
  toggleProject: (projectId: string) => api.post(`/api/favorites/projects/${projectId}`),
  toggleTask: (taskId: string) => api.post(`/api/favorites/tasks/${taskId}`),
  getProjects: () => api.get('/api/favorites/projects'),
  getTasks: () => api.get('/api/favorites/tasks'),
  isProjectFavorite: (projectId: string) => api.get(`/api/favorites/projects/${projectId}`),
  isTaskFavorite: (taskId: string) => api.get(`/api/favorites/tasks/${taskId}`),
};
