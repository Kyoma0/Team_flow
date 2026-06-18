import { useState, useEffect, useCallback } from 'react';
import { favoritesApi } from '@/lib/favorites';

export function useFavorites() {
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<string>>(new Set());
  const [favoriteTaskIds, setFavoriteTaskIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        favoritesApi.getProjects(),
        favoritesApi.getTasks(),
      ]);
      setFavoriteProjectIds(new Set((projectsRes.data as any[]).map((p) => p.id)));
      const tasks = tasksRes.data as any[];
      setFavoriteTaskIds(new Set(tasks.map((t: any) => t.id)));
    } catch {
      // Favorites unavailable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);

  const toggleProject = useCallback(async (projectId: string) => {
    setFavoriteProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
      return next;
    });
    try {
      await favoritesApi.toggleProject(projectId);
    } catch {
      setFavoriteProjectIds((prev) => {
        const next = new Set(prev);
        if (next.has(projectId)) next.delete(projectId); else next.add(projectId);
        return next;
      });
    }
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    setFavoriteTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
    try {
      await favoritesApi.toggleTask(taskId);
    } catch {
      setFavoriteTaskIds((prev) => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
        return next;
      });
    }
  }, []);

  const isProjectFavorite = useCallback(
    (id: string) => favoriteProjectIds.has(id),
    [favoriteProjectIds],
  );

  const isTaskFavorite = useCallback(
    (id: string) => favoriteTaskIds.has(id),
    [favoriteTaskIds],
  );

  return {
    favoriteProjectIds,
    favoriteTaskIds,
    loading,
    toggleProject,
    toggleTask,
    isProjectFavorite,
    isTaskFavorite,
    refetch: fetchFavorites,
  };
}
