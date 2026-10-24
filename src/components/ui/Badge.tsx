import type { ReactNode } from 'react';
import { cn } from '@/lib/format';
import type { EstadoCita } from '@/types';

export type Tono = 'neutro' | 'primario' | 'exito' | 'aviso' | 'peligro';

const tonos: Record<Tono, string> = {
  neutro: 'bg-cromo-soft text-ink-soft',
  primario: 'bg-espuma text-barbicide-dark',
  exito: 'bg-musgo-soft text-musgo',
  aviso: 'bg-ambar-soft text-ambar',
  peligro: 'bg-cordoban-soft text-cordoban',
};

export const Badge = ({ tono = 'neutro', children, className }: { tono?: Tono; children: ReactNode; className?: string }) => (
  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', tonos[tono], className)}>
    {children}
  </span>
);

export const ESTADO_CITA: Record<EstadoCita, { texto: string; tono: Tono }> = {
  PENDIENTE: { texto: 'Por confirmar', tono: 'aviso' },
  CONFIRMADA: { texto: 'Confirmada', tono: 'primario' },
  EN_SILLA: { texto: 'En silla', tono: 'exito' },
  COMPLETADA: { texto: 'Completada', tono: 'neutro' },
  CANCELADA: { texto: 'Cancelada', tono: 'peligro' },
  NO_SE_PRESENTO: { texto: 'No se presentó', tono: 'peligro' },
};

export const EstadoCitaBadge = ({ estado }: { estado: EstadoCita }) => (
  <Badge tono={ESTADO_CITA[estado].tono}>{ESTADO_CITA[estado].texto}</Badge>
);
