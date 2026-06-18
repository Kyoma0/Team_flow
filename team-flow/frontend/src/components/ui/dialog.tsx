'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const DialogContext = React.createContext<{ open: boolean; onOpenChange: (open: boolean) => void }>({
  open: false,
  onOpenChange: () => {},
});

function Dialog({ open: controlledOpen, onOpenChange, defaultOpen = false, children }: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (!isControlled) setInternalOpen(val);
    onOpenChange?.(val);
  };

  return (
    <DialogContext.Provider value={{ open, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ asChild, onClick, className, children, ...props }: {
  asChild?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
  [key: string]: any;
}) {
  const { onOpenChange } = React.useContext(DialogContext);
  const Comp = asChild ? (props as any).childType || 'button' : 'button';
  return (
    <Comp
      className={className}
      onClick={(e: React.MouseEvent) => {
        onClick?.(e);
        onOpenChange(true);
      }}
      {...props}
    >
      {children}
    </Comp>
  );
}

function DialogContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  const { open, onOpenChange } = React.useContext(DialogContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg mx-4 rounded-xl border bg-background p-6 shadow-lg',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />;
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />;
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4', className)} {...props} />;
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter };
