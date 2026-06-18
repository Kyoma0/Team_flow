'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
      toast.success('Instruções enviadas!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao solicitar recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-violet-700 to-purple-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold text-white">TF</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Esqueceu sua senha?</h1>
          <p className="text-xl text-white/80 max-w-md">
            Relaxe, acontece com todo mundo. Enviaremos um link para você redefinir sua senha.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">TF</span>
            </div>
            <h1 className="text-2xl font-bold">TeamFlow</h1>
          </div>

          {sent ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Email enviado!</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Se o email existir, você receberá as instruções para redefinir sua senha.
              </p>
              <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" /> Voltar
              </Link>
              <h2 className="text-2xl font-bold mb-1">Recuperar senha</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-8">Digite seu email para receber instruções</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                      placeholder="seu@email.com" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Enviar instruções'
                  )}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">© 2026 TeamFlow.</p>
        </div>
      </div>
    </div>
  );
}
