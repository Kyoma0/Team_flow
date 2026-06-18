'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, FolderKanban, Bell, Sun, Moon, Menu, X, Search, Crown, Link as LinkIcon,
  LogOut, ChevronDown, User, Settings, Users, CalendarDays, Building2, BarChart3, MessageSquare, Layers,
  Shield, Key, Upload, MailPlus, AlertTriangle, Mail, ListTodo, Star,
} from 'lucide-react';
import { OnboardingTour } from '@/components/OnboardingTour';
import KeyboardShortcuts from '@/components/KeyboardShortcuts';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/my-tasks', label: 'Minhas Tarefas', icon: ListTodo },
  { href: '/my-tasks?favorites=true', label: 'Favoritos', icon: Star },
  { href: '/projects', label: 'Projetos', icon: FolderKanban, tour: 'sidebar-projects' },
  { href: '/messages', label: 'Mensagens', icon: MessageSquare, tour: 'sidebar-messages' },
  { href: '/calendar', label: 'Calendário', icon: CalendarDays },
  { href: '/clients', label: 'Clientes', icon: Building2 },
  { href: '/templates', label: 'Modelos', icon: Layers },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/webhooks', label: 'Webhooks', icon: LinkIcon },
  { href: '/tokens', label: 'API Tokens', icon: Key },
  { href: '/import-export', label: 'Importar/Exportar', icon: Upload },
  { href: '/notificacoes', label: 'Notificações', icon: Bell },
  { href: '/plans', label: 'Planos', icon: Crown },
  { href: '/security', label: 'Segurança', icon: Shield },
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/admin', label: 'Admin', icon: Users, adminOnly: true },
  { href: '/invites', label: 'Convites', icon: MailPlus },
  { href: '/account', label: 'Conta', icon: Settings },
];

export function MainLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tourRun, setTourRun] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (user) {
      const done = localStorage.getItem('onboarding_done');
      if (!done) {
        setTourRun(true);
      }
    }
  }, [user]);

  if (!user) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700
        transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-slate-700">
          <Link href="/dashboard" className="text-xl font-bold text-primary-600 dark:text-primary-400">
            TeamFlow
          </Link>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            if (item.adminOnly && user.roleType !== 'ADMIN') return null;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour={item.tour}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
            <ThemeToggle />
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          <div className="relative flex-1 max-w-md mx-4 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text"
              onClick={() => router.push('/search')}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push('/search'); }}
              placeholder="Buscar projetos, tarefas, arquivos..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
              readOnly
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <NotificationBell />

            <Link
              href="/notifications"
              data-tour="sidebar-notifications"
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <Bell className="w-5 h-5" />
            </Link>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.roleType}</p>
                </div>
                <ChevronDown className="w-4 h-4 hidden sm:block" />
              </button>

              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 z-20 py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="w-4 h-4" /> Perfil
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4" /> Configurações
                    </Link>
                    <hr className="my-1 border-gray-200 dark:border-slate-700" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                    >
                      <LogOut className="w-4 h-4" /> Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Email verification banner */}
        {user && !user.emailVerified && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="w-4 h-4" />
              Confirme seu email para ativar todos os recursos
            </div>
            <button onClick={async () => {
              try {
                await api.post(`/api/auth/resend-verification?email=${user.email}`);
                toast.success('Email de verificação reenviado!');
              } catch { toast.error('Erro ao reenviar'); }
            }}
              className="flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 font-medium">
              <Mail className="w-3 h-3" /> Reenviar
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>

      <OnboardingTour
        run={tourRun}
        onFinish={() => {
          setTourRun(false);
          localStorage.setItem('onboarding_done', 'true');
        }}
      />
      <KeyboardShortcuts />
    </div>
  );
}
