import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>
        <h1 className="text-3xl font-bold mb-6">Política de Privacidade</h1>
        <div className="prose dark:prose-invert max-w-none space-y-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">1. Coleta de Dados</h2>
          <p>Coletamos informações que você nos fornece ao criar uma conta: nome, email e senha (criptografada). Também coletamos dados de uso para melhorar nossos serviços.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Uso dos Dados</h2>
          <p>Seus dados são usados para operar o serviço, fornecer suporte e enviar notificações relevantes. Não vendemos seus dados pessoais.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">3. Armazenamento</h2>
          <p>Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">4. Seus Direitos</h2>
          <p>Você pode exportar ou excluir todos os seus dados a qualquer momento através das configurações da sua conta.</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">5. Contato</h2>
          <p>Para questões sobre privacidade, entre em contato pelo email privacidade@teamflow.app.</p>
        </div>
      </div>
    </div>
  );
}
