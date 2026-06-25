'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  completeTwoFactorLogin: (email: string, token: string) => Promise<void>;
  register: (name: string, email: string, password: string, username?: string, roleType?: string, companyName?: string, companyId?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser?: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const storeSession = (data: { user: User; accessToken: string; refreshToken: string }) => {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    if (data.requiresTwoFactor) {
      return data;
    }
    storeSession(data);
    return data;
  };

  const completeTwoFactorLogin = async (email: string, token: string) => {
    const { data } = await api.post('/api/2fa/challenge', { email, token });
    storeSession(data);
  };

  const register = async (name: string, email: string, password: string, username?: string, roleType?: string, companyName?: string, companyId?: string) => {
    const { data } = await api.post('/api/auth/register', { name, email, password, username, roleType, companyName, companyId });
    storeSession(data);
  };

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return;
    try {
      const { data } = await api.post('/api/auth/refresh', { refreshToken });
      storeSession(data);
    } catch {
      logout();
    }
  }, [logout]);

  const updateUser = (data: Partial<User>) => {
    const updated = { ...user, ...data } as User;
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/api/profile');
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch {}
  }, []);

  return (
      <AuthContext.Provider value={{ user, token, loading, login, completeTwoFactorLogin, register, logout, updateUser, refreshUser, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
