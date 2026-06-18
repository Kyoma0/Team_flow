'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Crown, Zap, Building2, Sparkles, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const PLAN_ICONS: Record<string, any> = {
  Grátis: Zap,
  Gratuito: Zap,
  Profissional: Crown,
  Equipe: Crown,
  Empresa: Building2,
  Corporativo: Sparkles,
  Estúdio: Sparkles,
};

const PLAN_COLORS: Record<string, string> = {
  Grátis: 'border-gray-300 dark:border-slate-600',
  Gratuito: 'border-gray-300 dark:border-slate-600',
  Profissional: 'border-blue-400 dark:border-blue-600',
  Equipe: 'border-blue-400 dark:border-blue-600',
  Empresa: 'border-purple-400 dark:border-purple-600',
  Corporativo: 'border-yellow-400 dark:border-yellow-600',
  Estúdio: 'border-purple-400 dark:border-purple-600',
};

const FEATURE_LABELS: Record<string, string> = {
  tasks: 'Gestão de tarefas',
  chat: 'Chat em tempo real',
  files: 'Armazenamento de arquivos',
  deliveries: 'Sistema de entregas',
  'time-tracking': 'Time tracking',
  'custom-fields': 'Campos personalizados',
  webhooks: 'Webhooks',
  'api-tokens': 'API Tokens',
  'audit-log': 'Auditoria',
  export: 'Exportação de relatórios',
  '3d-viewer': 'Visualizador 3D',
  all: 'Todos os recursos',
};

export default function PlansPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/plans').then(({ data }) => {
      setPlans(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => { setLoading(false); });
  }, []);

  const handleSelectPlan = async (plan: any) => {
    const isFree = plan.priceMonthly === 0;
    const isCurrent = user?.planId === plan.id;

    if (isCurrent) return;
    setActionLoading(plan.id);

    try {
      if (isFree) {
        const { data } = await api.post('/api/plans/assign', { planId: plan.id });
        updateUser({ planId: plan.id });
        toast.success(data.message || 'Plano alterado!');
      } else {
        const { data } = await api.post('/api/plans/checkout', {
          planId: plan.id,
          billingCycle,
        });

        if (data.checkoutUrl && !data.mockMode) {
          window.open(data.checkoutUrl, '_blank');
          toast.success('Redirecionando para o pagamento...');
        }

        if (data.mockMode) {
          updateUser({ planId: plan.id });
          toast.success(`Plano ${plan.name} ativado (modo demonstração)!`);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao processar plano';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Planos e Preços</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Escolha o plano ideal para sua equipe
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingCycle === 'monthly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
          }`}>
          Mensal
        </button>
        <button onClick={() => setBillingCycle('yearly')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            billingCycle === 'yearly'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
          }`}>
          Anual (2 meses grátis)
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.name] || Zap;
          const isCurrentPlan = user?.planId === plan.id;
          const features: string[] = plan.features || (typeof plan.features === 'string' ? JSON.parse(plan.features) : []);
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

          return (
            <div key={plan.id}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 ${PLAN_COLORS[plan.name] || 'border-gray-200 dark:border-slate-700'} p-6 flex flex-col`}>
              {plan.name === 'Equipe' || plan.name === 'Profissional' ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                  MAIS POPULAR
                </div>
              ) : null}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isFree(plan) ? 'bg-gray-100 dark:bg-slate-700' :
                  plan.name === 'Equipe' || plan.name === 'Profissional' ? 'bg-blue-100 dark:bg-blue-900/50' :
                  plan.name === 'Empresa' || plan.name === 'Estúdio' ? 'bg-purple-100 dark:bg-purple-900/50' :
                  'bg-yellow-100 dark:bg-yellow-900/50'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isFree(plan) ? 'text-gray-600' :
                    plan.name === 'Equipe' || plan.name === 'Profissional' ? 'text-blue-600' :
                    plan.name === 'Empresa' || plan.name === 'Estúdio' ? 'text-purple-600' :
                    'text-yellow-600'
                  }`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                {isFree(plan) ? (
                  <p className="text-2xl font-bold">Grátis</p>
                ) : (
                  <>
                    <span className="text-3xl font-bold">R${price}</span>
                    <span className="text-gray-500 text-sm">/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                  </>
                )}
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{plan.maxUsers >= 999 ? 'Usuários ilimitados' : `Até ${plan.maxUsers} usuários`}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{plan.maxStorage >= 10737418240 ? 'Armazenamento ilimitado' : formatStorage(plan.maxStorage)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{plan.maxProjects >= 999 ? 'Projetos ilimitados' : `Até ${plan.maxProjects} projetos`}</span>
                </div>
                {features.map((f: string) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                    <span>{FEATURE_LABELS[f] || f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrentPlan || actionLoading === plan.id}
                className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-gray-100 dark:bg-slate-700 text-gray-500 cursor-default'
                    : isFree(plan)
                    ? 'bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-800 dark:text-gray-200'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                }`}>
                {actionLoading === plan.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                ) : isCurrentPlan ? (
                  'Plano atual'
                ) : isFree(plan) ? (
                  'Ativar plano gratuito'
                ) : (
                  <><ExternalLink className="w-4 h-4" /> Assinar agora</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {plans.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>Nenhum plano disponível no momento.</p>
        </div>
      )}
    </div>
  );
}

function isFree(plan: any) {
  return plan.priceMonthly === 0;
}

function formatStorage(bytes: number) {
  const gb = Number(bytes) / (1024 * 1024 * 1024);
  if (gb >= 1000) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(gb >= 1 ? 1 : 0)} GB`;
}
