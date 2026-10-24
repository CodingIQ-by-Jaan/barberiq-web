import { Check } from 'lucide-react';
import { cn, formatoDinero } from '@/lib/format';
import { formatoDuracion } from '@/lib/time';
import type { Barbero, Servicio } from '@/types';

interface Props {
  servicios: Servicio[];
  seleccion: string[];
  onCambiar: (ids: string[]) => void;
  /** Si se indica, aplica precio/duración propios del barbero */
  barbero?: Barbero;
  compacto?: boolean;
}

export const ServicioChecklist = ({ servicios, seleccion, onCambiar, barbero, compacto }: Props) => {
  const alternar = (id: string) =>
    onCambiar(seleccion.includes(id) ? seleccion.filter((x) => x !== id) : [...seleccion, id]);

  if (!servicios.length) {
    return <p className="rounded-(--radius-control) bg-porcelana px-3 py-3 text-sm text-ink-muted">No hay servicios disponibles.</p>;
  }

  return (
    <ul className={cn('divide-y divide-cromo-soft overflow-hidden rounded-(--radius-control) border border-cromo bg-white')}>
      {servicios.map((s) => {
        const o = barbero?.servicios.find((bs) => bs.servicioId === s.id);
        const precio = o?.precio ?? s.precio;
        const duracion = o?.duracionMin ?? s.duracionMin;
        const activo = seleccion.includes(s.id);
        return (
          <li key={s.id}>
            <button
              type="button"
              role="checkbox"
              aria-checked={activo}
              onClick={() => alternar(s.id)}
              className={cn(
                'flex w-full items-start gap-3 px-3 text-left transition-colors',
                compacto ? 'py-2.5' : 'py-4',
                activo ? 'bg-espuma/60' : 'hover:bg-porcelana',
              )}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border',
                  activo ? 'border-barbicide bg-barbicide text-white' : 'border-cromo bg-white',
                )}
              >
                {activo && <Check className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn('block font-semibold', compacto ? 'text-sm' : 'text-base')}>{s.nombre}</span>
                {!compacto && s.descripcion && <span className="mt-0.5 block text-sm text-ink-muted">{s.descripcion}</span>}
                <span className="mt-0.5 block text-xs text-ink-muted tabular">{formatoDuracion(duracion)}</span>
              </span>
              <span className={cn('font-semibold tabular', compacto ? 'text-sm' : 'text-base')}>{formatoDinero(precio)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
