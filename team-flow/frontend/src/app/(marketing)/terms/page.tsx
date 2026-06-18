import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold mb-6">Termos de Serviço</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Aceitação dos Termos</h2>
          <p>Ao criar uma conta no TeamFlow, você concorda com estes termos de serviço.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Uso do Serviço</h2>
          <p>Você é responsável por manter a confidencialidade de sua conta e senha. O serviço é fornecido "como está".</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Limitações</h2>
          <p>Não nos responsabilizamos por danos indiretos decorrentes do uso do serviço. Reservamo-nos o direito de modificar ou descontinuar o serviço a qualquer momento.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Cancelamento</h2>
          <p>Você pode cancelar sua conta a qualquer momento. Seus dados serão excluídos em até 30 dias após o cancelamento.</p>
        </div>
      </div>
    </div>
  );
}
