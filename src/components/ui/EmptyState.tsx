import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icono: LucideIcon;
  titulo: string;
  texto?: string;
  accion?: ReactNode;
}

export const EmptyState = ({ icono: Icono, titulo, texto, accion }: EmptyStateProps) => (
  <div className="flex flex-col items-center px-6 py-14 text-center">
    <Icono className="size-9 text-cromo" strokeWidth={1.5} />
    <h3 className="mt-3 font-semibold text-ink">{titulo}</h3>
    {texto && <p className="mt-1 max-w-sm text-sm text-ink-muted">{texto}</p>}
    {accion && <div className="mt-5">{accion}</div>}
  </div>
);
