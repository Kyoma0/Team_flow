import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import ErrorBoundary from '@/components/ErrorBoundary';
import InstallPrompt from '@/components/InstallPrompt';
import { MonitoringInit } from '@/components/MonitoringInit';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'TeamFlow - Gestão de Projetos para Equipes Criativas',
    template: '%s | TeamFlow',
  },
  description: 'Plataforma completa de gestão de projetos para estúdios de animação, design e equipes criativas.',
  keywords: ['gestão de projetos', 'teamflow', 'kanban', 'tarefas', 'animação', 'design', 'equipes criativas'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TeamFlow',
  },
  openGraph: {
    title: 'TeamFlow',
    description: 'Plataforma de gestão de projetos para equipes criativas',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
        <InstallPrompt />
        <MonitoringInit />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
