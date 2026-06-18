'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      toast.success('Senha alterada!');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mb-4">
        <ShieldCheck className="w-7 h-7 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold mb-1">Redefinir senha</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Digite sua nova senha</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nova senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={6}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
              placeholder="Mínimo 6 caracteres" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Redefinir senha'
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">TF</span>
          </div>
          <h1 className="text-2xl font-bold">TeamFlow</h1>
        </div>
        <Suspense fallback={<div className="text-center py-8">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
        <p className="text-center text-xs text-gray-400 mt-6">© 2026 TeamFlow.</p>
      </div>
    </div>
  );
}
