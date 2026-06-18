import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-xl font-semibold mb-2">Página não encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">A página que você procura não existe ou foi movida.</p>
        <Link href="/" className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
