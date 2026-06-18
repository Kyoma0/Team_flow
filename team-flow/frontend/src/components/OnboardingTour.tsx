'use client';

import { useCallback } from 'react';
import { Joyride, type Step, type TooltipRenderProps, type EventData } from 'react-joyride';

interface OnboardingTourProps {
  run: boolean;
  onFinish?: () => void;
}

function Tooltip({
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
  step,
  index,
  size,
  isLastStep,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-6 max-w-md w-full"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          {index + 1} de {size}
        </span>
        <button
          {...closeProps}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {step.title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{step.title}</h3>
      )}
      <div className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
        {step.content}
      </div>
      <div className="flex items-center justify-between">
        <button
          {...skipProps}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Pular tour
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Voltar
            </button>
          )}
          <button
            {...primaryProps}
            className="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 font-medium transition-colors"
          >
            {isLastStep ? 'Finalizar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}

const steps: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Bem-vindo ao TeamFlow!',
    content:
      'Vamos fazer um tour rápido pelas principais funcionalidades da plataforma. Em poucos passos você estará pronto para começar.',
  },
  {
    target: '[data-tour="sidebar-projects"]',
    placement: 'right',
    title: 'Projetos',
    content:
      'Gerencie todos os seus projetos em um só lugar. Crie, edite e organize projetos com sua equipe de forma colaborativa.',
  },
  {
    target: 'body',
    placement: 'center',
    title: 'Tarefas',
    content:
      'Organize suas atividades no quadro de tarefas. Use colunas para representar estágios e arraste e solte cartões para movê-los entre colunas.',
  },
  {
    target: '[data-tour="sidebar-messages"]',
    placement: 'right',
    title: 'Mensagens',
    content:
      'Converse com sua equipe através de mensagens em grupo ou conversas privadas. Tudo centralizado na plataforma.',
  },
  {
    target: 'body',
    placement: 'center',
    title: 'Arquivos',
    content:
      'Faça upload de arquivos e visualize modelos 3D diretamente no navegador. Compartilhe documentos e mantenha tudo organizado.',
  },
  {
    target: 'body',
    placement: 'center',
    title: 'Entregas',
    content:
      'Acompanhe o fluxo de revisão de entregas. Solicite revisões, aprove trabalhos ou peça alterações de forma simples.',
  },
  {
    target: 'body',
    placement: 'center',
    title: 'Pronto! 🎉',
    content:
      'Você já conhece os principais recursos do TeamFlow. Comece a explorar e personalize sua experiência!',
  },
];

export function OnboardingTour({ run, onFinish }: OnboardingTourProps) {
  const handleEvent = useCallback(
    (data: EventData) => {
      if (data.status === 'finished' || data.status === 'skipped') {
        onFinish?.();
      }
    },
    [onFinish],
  );

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      scrollToFirstStep
      tooltipComponent={Tooltip}
      options={{
        buttons: ['back', 'close', 'primary', 'skip'],
        zIndex: 10000,
        overlayColor: 'rgba(0, 0, 0, 0.5)',
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
        open: 'Abrir diálogo',
      }}
      onEvent={handleEvent}
    />
  );
}
