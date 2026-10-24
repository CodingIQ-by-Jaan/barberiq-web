import { cn } from '@/lib/format';

export const Spinner = ({ className }: { className?: string }) => (
  <span
    role="status"
    aria-label="Cargando"
    className={cn('inline-block size-5 animate-spin rounded-full border-2 border-current border-r-transparent', className)}
  />
);

export const Cargando = ({ texto = 'Cargando…' }: { texto?: string }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-ink-muted">
    <Spinner className="text-barbicide" />
    <span>{texto}</span>
  </div>
);
