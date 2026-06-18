'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Link de verificação inválido');
      return;
    }

    api.get(`/api/auth/verify-email?token=${token}`)
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message);
        setTimeout(() => router.push('/login'), 3000);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Erro ao verificar email');
      });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center max-w-md mx-auto px-4">
        {status === 'loading' && (
          <div>
            <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary-600" />
            <p className="text-lg font-medium">Verificando seu email...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-xl font-bold mb-2">Email verificado!</h1>
            <p className="text-gray-500 mb-4">{message}</p>
            <p className="text-sm text-gray-400">Redirecionando para o login...</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-bold mb-2">Erro na verificação</h1>
            <p className="text-gray-500 mb-4">{message}</p>
            <Link href="/login" className="text-primary-600 hover:text-primary-700 text-sm">
              Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="w-16 h-16 animate-spin text-primary-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
