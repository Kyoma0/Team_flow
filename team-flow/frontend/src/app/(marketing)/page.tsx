import Link from 'next/link';
import { BarChart3, CheckSquare, MessageSquare, Shield, Upload, Clock, ArrowRight, Github } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <CheckSquare className="w-6 h-6 text-primary-600" />
            TeamFlow
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              Entrar
            </Link>
            <Link href="/register"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Gerencie seus projetos{' '}
            <span className="text-primary-600">criativos</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8">
            TeamFlow é a plataforma completa para estúdios de animação, design e equipes criativas.
            Organize tarefas, compartilhe arquivos, acompanhe entregas e colabore em tempo real.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/register"
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-base font-medium inline-flex items-center gap-2">
              Começar grátis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="px-6 py-3 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-base font-medium inline-flex items-center gap-2">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Tudo que sua equipe precisa</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { icon: CheckSquare, title: 'Tarefas & Kanban', desc: 'Quadro visual, lista, dependências, time tracking, campos personalizados e templates.' },
            { icon: Upload, title: 'Arquivos com versões', desc: 'Upload arrastar e soltar, versionamento automático, preview de imagens.' },
            { icon: MessageSquare, title: 'Chat em tempo real', desc: 'Mensagens instantâneas, busca, menções e conversas por projeto.' },
            { icon: BarChart3, title: 'Cronograma & Calendário', desc: 'Gantt chart, calendário mensal e timeline de entregas.' },
            { icon: Shield, title: 'Segurança', desc: 'Autenticação 2FA, API tokens, webhooks com HMAC e rate limiting.' },
            { icon: Clock, title: 'Entregas & Revisões', desc: 'Pipeline completo com aprovação, solicitação de alterações e finalização.' },
          ].map((feature) => (
            <div key={feature.title} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 mb-4">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Planos</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-12">Do gratuitos ao completo para estúdios</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { name: 'Grátis', price: 'R$ 0', tasks: 'Tarefas e Kanban', files: '100MB', members: '3 membros', projects: '1 projeto' },
            { name: 'Profissional', price: 'R$ 49/mês', tasks: 'Tudo + dependências + time tracking', files: '1GB', members: '15 membros', projects: '10 projetos' },
            { name: 'Estúdio', price: 'R$ 149/mês', tasks: 'Tudo + templates + campos personalizados', files: '10GB', members: 'Ilimitados', projects: 'Ilimitados' },
          ].map((plan) => (
            <div key={plan.name} className={`bg-white dark:bg-slate-800 rounded-xl border ${plan.name === 'Profissional' ? 'border-primary-500 ring-1 ring-primary-500' : 'border-gray-200 dark:border-slate-700'} p-6`}>
              <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold mb-4">{plan.price}</p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>• {plan.tasks}</li>
                <li>• {plan.files}</li>
                <li>• {plan.members}</li>
                <li>• {plan.projects}</li>
              </ul>
              <Link href="/register" className="mt-6 block text-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
                Começar
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <CheckSquare className="w-4 h-4 text-primary-600" />
            TeamFlow © {new Date().getFullYear()}
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300">Privacidade</Link>
            <Link href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300">Termos</Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 dark:hover:text-gray-300">
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
