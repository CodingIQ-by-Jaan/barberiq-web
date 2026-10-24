import { CalendarX } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/format';
import { formatoHora } from '@/lib/time';
import type { Slot } from '@/types';

interface Props {
  slots: Slot[];
  seleccion: string | null;
  onElegir: (inicio: string) => void;
  cargando?: boolean;
  compacto?: boolean;
}

const FRANJAS = [
  { nombre: 'Mañana', desde: 0, hasta: 12 },
  { nombre: 'Tarde', desde: 12, hasta: 17 },
  { nombre: 'Noche', desde: 17, hasta: 24 },
];

/** Horarios libres agrupados por franja del día. */
export const SlotPicker = ({ slots, seleccion, onElegir, cargando, compacto }: Props) => {
  if (cargando && !slots.length) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-ink-muted">
        <Spinner className="size-4 text-barbicide" /> Buscando horarios…
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="flex items-center gap-3 rounded-(--radius-control) bg-porcelana px-3 py-3 text-sm text-ink-muted">
        <CalendarX className="size-5 shrink-0" />
        No quedan horarios libres este día. Prueba con otra fecha.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', compacto && 'max-h-56 overflow-y-auto pr-1')}>
      {FRANJAS.map((f) => {
        const delGrupo = slots.filter((s) => {
          const h = new Date(s.inicio).getHours();
          return h >= f.desde && h < f.hasta;
        });
        if (!delGrupo.length) return null;
        return (
          <div key={f.nombre}>
            <p className="mb-2 text-xs font-medium text-ink-muted">{f.nombre}</p>
            <div className={cn('grid gap-2', compacto ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4')}>
              {delGrupo.map((s) => {
                const activo = s.inicio === seleccion;
                return (
                  <button
                    key={s.inicio}
                    type="button"
                    onClick={() => onElegir(s.inicio)}
                    aria-pressed={activo}
                    className={cn(
                      'rounded-(--radius-control) border text-sm font-semibold tabular transition-colors',
                      compacto ? 'h-9' : 'h-11',
                      activo
                        ? 'border-barbicide bg-barbicide text-white'
                        : 'border-cromo bg-white text-ink hover:border-barbicide hover:text-barbicide-dark',
                    )}
                  >
                    {formatoHora(s.inicio)}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
