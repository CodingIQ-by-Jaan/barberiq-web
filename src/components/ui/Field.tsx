import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/format';

const control =
  'w-full rounded-(--radius-control) border border-cromo bg-white px-3 text-sm text-ink placeholder:text-ink-muted/70 transition-colors hover:border-ink-muted/60 focus:border-barbicide focus:outline-none focus:ring-2 focus:ring-barbicide/20 disabled:bg-cromo-soft aria-invalid:border-cordoban';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Etiqueta + control + ayuda/error. Envuelve Input, Select o Textarea. */
export const Field = ({ label, htmlFor, hint, error, children, className }: FieldProps) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    <label htmlFor={htmlFor} className="text-sm font-medium text-ink-soft">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-cordoban">{error}</p>
    ) : hint ? (
      <p className="text-xs text-ink-muted">{hint}</p>
    ) : null}
  </div>
);

export const Input = ({ className, ...props }: ComponentProps<'input'>) => (
  <input className={cn(control, 'h-10', className)} {...props} />
);

export const Select = ({ className, children, ...props }: ComponentProps<'select'>) => (
  <select className={cn(control, 'h-10 pr-8', className)} {...props}>
    {children}
  </select>
);

export const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea className={cn(control, 'min-h-20 py-2', className)} {...props} />
);
