import type { ComponentProps } from 'react';
import { cn } from '@/lib/format';
import { Spinner } from './Spinner';

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro';
type Tamano = 'sm' | 'md' | 'lg';

const variantes: Record<Variante, string> = {
  primario: 'bg-barbicide text-white hover:bg-barbicide-dark disabled:bg-barbicide/50',
  secundario: 'bg-white text-ink border border-cromo hover:border-ink-muted hover:bg-cromo-soft/60',
  fantasma: 'text-ink-soft hover:bg-cromo-soft',
  peligro: 'bg-cordoban text-white hover:bg-cordoban/90',
};

const tamanos: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
};

export interface ButtonProps extends ComponentProps<'button'> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
}

export const Button = ({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    disabled={disabled || cargando}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-(--radius-control) font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60',
      variantes[variante],
      tamanos[tamano],
      className,
    )}
    {...props}
  >
    {cargando && <Spinner className="size-4" />}
    {children}
  </button>
);
