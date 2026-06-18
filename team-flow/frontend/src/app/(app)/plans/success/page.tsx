'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';

export default function PlanSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { updateUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const subscriptionId = searchParams.get('subscription');
    if (!subscriptionId) {
      setStatus('error');
      setMessage('Nenhuma assinatura encontrada.');
      return;
    }

    api.get('/api/plans/user/me')
      .then(({ data }) => {
        if (data.plan) {
          updateUser({ planId: data.plan.id });
          setStatus('success');
          setMessage(`Plano ${data.plan.name} ativado com sucesso!`);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Não foi possível verificar sua assinatura. Entre em contato com o suporte.');
      });
  }, [searchParams, updateUser]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto" />
            <h1 className="text-2xl font-bold">Verificando pagamento...</h1>
            <p className="text-gray-500">Aguarde enquanto confirmamos sua assinatura.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Pagamento confirmado!</h1>
            <p className="text-gray-500">{message}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              Ir para o Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="text-gray-500">{message}</p>
            <div className="flex gap-3 justify-center mt-4">
              <button
                onClick={() => router.push('/plans')}
                className="px-6 py-2.5 bg-gray-200 dark:bg-slate-600 rounded-xl hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors font-medium"
              >
                Ver planos
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
