import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline">
              {children}
            </a>
          ),
          code: ({ className: codeClass, children, ...props }) => {
            const isInline = !codeClass?.startsWith('language-');
            if (isInline) {
              return (
                <code className="bg-gray-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-100 dark:bg-slate-700 rounded-lg p-3 overflow-x-auto text-sm">
                <code className={codeClass} {...props}>{children}</code>
              </pre>
            );
          },
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-sm">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-3 italic text-gray-600 dark:text-gray-400">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse border border-gray-200 dark:border-slate-700">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => <th className="border border-gray-200 dark:border-slate-700 px-2 py-1 bg-gray-50 dark:bg-slate-800 font-medium text-left">{children}</th>,
          td: ({ children }) => <td className="border border-gray-200 dark:border-slate-700 px-2 py-1">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
