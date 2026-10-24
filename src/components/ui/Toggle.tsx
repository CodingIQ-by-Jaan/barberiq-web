import { cn } from '@/lib/format';

interface ToggleProps {
  activo: boolean;
  onCambiar: (v: boolean) => void;
  etiqueta: string;
  disabled?: boolean;
  mostrarEtiqueta?: boolean;
}

export const Toggle = ({ activo, onCambiar, etiqueta, disabled, mostrarEtiqueta = false }: ToggleProps) => (
  <label className={cn('inline-flex items-center gap-2', disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer')}>
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCambiar(!activo);
      }}
      className={cn(
        'relative h-5 w-9 shrink-0 rounded-full transition-colors',
        activo ? 'bg-barbicide' : 'bg-cromo',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform',
          activo && 'translate-x-4',
        )}
      />
    </button>
    {mostrarEtiqueta && <span className="text-sm text-ink-soft">{etiqueta}</span>}
  </label>
);
