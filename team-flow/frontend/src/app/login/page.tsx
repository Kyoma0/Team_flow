'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, Eye, EyeOff, Shield, Github } from 'lucide-react';

export default function LoginPage() {
  const { login, completeTwoFactorLogin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      router.push('/dashboard');
    }
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data?.requiresTwoFactor) {
        setTwoFactorRequired(true);
      } else {
        toast.success('Login realizado!');
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorToken.length < 6) return;
    setTwoFactorLoading(true);
    try {
      await completeTwoFactorLogin(email, twoFactorToken);
      toast.success('Login realizado!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Código 2FA inválido');
    } finally {
      setTwoFactorLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-8">
            <span className="text-4xl font-bold text-white">TF</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">TeamFlow</h1>
          <p className="text-xl text-white/80 max-w-md">
            Gerencie projetos, organize tarefas, compartilhe arquivos e converse em equipe — tudo em um só lugar.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {['Projetos', 'Tarefas', 'Chat', 'Arquivos', 'Equipe', 'Metas'].map((item) => (
              <div key={item} className="bg-white/10 backdrop-blur rounded-lg px-3 py-2 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-slate-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-white">TF</span>
            </div>
            <h1 className="text-2xl font-bold">TeamFlow</h1>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-2xl p-8">
            {!twoFactorRequired ? (
              <>
                <h2 className="text-2xl font-bold mb-1">Bem-vindo de volta</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Faça login para continuar</p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Senha</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-12 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                        placeholder="********"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                      Criar conta
                    </Link>
                    <Link href="/forgot-password" className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                      Esqueceu a senha?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><LogIn className="w-5 h-5" /> Entrar</>
                    )}
                  </button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-slate-600" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-slate-900 px-2 text-gray-500">ou</span></div>
                </div>

                <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/github`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                  <Github className="w-5 h-5" />
                  Entrar com GitHub
                </a>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-1">Autenticação de dois fatores</h2>
                  <p className="text-gray-500 dark:text-gray-400">Insira o código do seu app autenticador</p>
                  <p className="text-sm text-gray-400 mt-1">{email}</p>
                </div>

                <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                  <div>
                    <input
                      type="text"
                      value={twoFactorToken}
                      onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={twoFactorToken.length < 6 || twoFactorLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25"
                  >
                    {twoFactorLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Shield className="w-5 h-5" /> Verificar</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTwoFactorRequired(false); setTwoFactorToken(''); }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Voltar ao login
                  </button>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2026 TeamFlow. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
