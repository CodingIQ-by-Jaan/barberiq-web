import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

/** Superficie blanca para tablas y formularios. */
export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <section className={cn('rounded-(--radius-panel) border border-cromo bg-white', className)}>{children}</section>
);

export const PanelHeader = ({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cromo-soft px-5 py-4">
    <div>
      <h2 className="font-semibold">{titulo}</h2>
      {descripcion && <p className="text-sm text-ink-muted">{descripcion}</p>}
    </div>
    {acciones}
  </div>
);
