'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface DropdownMenuContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextType>({
  open: false,
  setOpen: () => {},
});

function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

function DropdownMenuTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { setOpen } = React.useContext(DropdownMenuContext);
  return (
    <button
      className={cn('inline-flex items-center justify-center', className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({ className, align = 'end', children, ...props }: React.HTMLAttributes<HTMLDivElement> & { align?: 'start' | 'end'; children: React.ReactNode }) {
  const { open, setOpen } = React.useContext(DropdownMenuContext);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        className={cn(
          'absolute z-50 mt-1 min-w-[8rem] rounded-md border bg-popover p-1 shadow-md',
          align === 'end' ? 'right-0' : 'left-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

function DropdownMenuItem({ className, onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) {
  const { setOpen } = React.useContext(DropdownMenuContext);
  return (
    <button
      className={cn(
        'relative flex w-full cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
