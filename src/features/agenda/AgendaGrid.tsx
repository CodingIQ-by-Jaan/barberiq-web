import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui';
import { ESTADOS_ACTIVOS } from '@/lib/disponibilidad';
import { cn } from '@/lib/format';
import { formatoHora, hhmmToMin, minToHhmm, minutosDelDia } from '@/lib/time';
import type { Barberia, Barbero, Bloqueo, Cita } from '@/types';

const PX_MIN = 1.6; // 1 h = 96 px
const PASO_CLICK = 15;

/** 600 → "10 a. m." (etiqueta corta para el carril de horas) */
const etiquetaHora = (min: number) => {
  const h = min / 60;
  return `${h % 12 || 12} ${h < 12 ? 'a. m.' : 'p. m.'}`;
};

interface AgendaGridProps {
  fecha: Date;
  barberia: Barberia;
  barberos: Barbero[];
  citas: Cita[];
  bloqueos: Bloqueo[];
  esHoy: boolean;
  onSlot?: (barberoId: string, minuto: number) => void;
  onCita: (cita: Cita) => void;
}

interface Rango {
  ini: number;
  fin: number;
}

/** Huecos (no laborables) entre `inicio` y `fin` dado un set de turnos. */
const huecos = (turnos: Rango[], inicio: number, fin: number): Rango[] => {
  const orden = [...turnos].sort((a, b) => a.ini - b.ini);
  const out: Rango[] = [];
  let cursor = inicio;
  orden.forEach((t) => {
    if (t.ini > cursor) out.push({ ini: cursor, fin: Math.min(t.ini, fin) });
    cursor = Math.max(cursor, t.fin);
  });
  if (cursor < fin) out.push({ ini: cursor, fin });
  return out.filter((h) => h.fin > h.ini);
};

const useAhora = () => {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setAhora(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return ahora;
};

export const AgendaGrid = ({ fecha, barberia, barberos, citas, bloqueos, esHoy, onSlot, onCita }: AgendaGridProps) => {
  const ahora = useAhora();
  const dia = fecha.getDay();
  const local = barberia.horarios.find((h) => h.diaSemana === dia)!;
  const inicio = Math.floor(hhmmToMin(local.abre) / 60) * 60;
  const fin = Math.ceil(hhmmToMin(local.cierra) / 60) * 60;
  const alto = (fin - inicio) * PX_MIN;
  const horas = Array.from({ length: (fin - inicio) / 60 + 1 }, (_, i) => inicio + i * 60);

  const columnas = useMemo(
    () =>
      barberos.map((b) => {
        const turnos = b.horarios
          .filter((h) => h.diaSemana === dia)
          .map((h) => ({
            ini: Math.max(hhmmToMin(h.inicio), hhmmToMin(local.abre)),
            fin: Math.min(hhmmToMin(h.fin), hhmmToMin(local.cierra)),
          }))
          .filter((t) => t.ini < t.fin);
        return {
          barbero: b,
          turnos,
          cerrado: huecos(turnos, inicio, fin),
          bloqueos: bloqueos.filter((x) => x.barberoId === b.id),
          citas: citas.filter((c) => c.barberoId === b.id),
        };
      }),
    [barberos, bloqueos, citas, dia, local, inicio, fin],
  );

  const minAhora = minutosDelDia(ahora);
  const mostrarAhora = esHoy && minAhora >= inicio && minAhora <= fin;
  const pos = (min: number) => (min - inicio) * PX_MIN;
  const minDe = (iso: string) => minutosDelDia(new Date(iso));

  return (
    <div className="overflow-x-auto rounded-(--radius-panel) border border-cromo bg-white">
      <div className="grid min-w-fit" style={{ gridTemplateColumns: `4.25rem repeat(${columnas.length}, minmax(11.5rem, 1fr))` }}>
        {/* Encabezados: una columna por silla */}
        <div className="sticky left-0 z-20 border-b border-cromo bg-white" />
        {columnas.map(({ barbero, turnos, citas: cs }) => {
          const activas = cs.filter((c) => c.estado !== 'CANCELADA').length;
          return (
            <div key={barbero.id} className="border-b border-l border-cromo px-4 pt-4 pb-3">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: barbero.colorAgenda }} />
              <div className="mt-3 flex items-center gap-2.5">
                <Avatar nombre={barbero.nombre} color={barbero.colorAgenda} tamano="sm" />
                <p className="font-rotulo min-w-0 flex-1 truncate text-xl leading-tight">{barbero.nombre.split(' ')[0]}</p>
                {turnos.length > 0 && (
                  <span className="text-sm font-semibold tabular" title={`${activas} citas`}>
                    {activas} <span className="font-normal text-ink-muted">{activas === 1 ? 'cita' : 'citas'}</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted tabular">
                {turnos.length ? turnos.map((t) => `${minToHhmm(t.ini)}–${minToHhmm(t.fin)}`).join(' y ') : 'No trabaja hoy'}
              </p>
            </div>
          );
        })}

        {/* Carril de horas */}
        <div className="sticky left-0 z-20 bg-white" style={{ height: alto }}>
          <div className="relative h-full">
            {horas.map((h) => (
              <span
                key={h}
                className="absolute right-2.5 -translate-y-1/2 text-xs whitespace-nowrap text-ink-muted tabular"
                style={{ top: pos(h) }}
              >
                {h === inicio ? '' : etiquetaHora(h)}
              </span>
            ))}
          </div>
        </div>

        {columnas.map(({ barbero, turnos, cerrado, bloqueos: bl, citas: cs }) => (
          <div
            key={barbero.id}
            className="relative border-l border-cromo"
            style={{ height: alto }}
            onClick={(e) => {
              if (!onSlot || e.target !== e.currentTarget) return;
              const y = e.nativeEvent.offsetY;
              const min = inicio + Math.floor(y / PX_MIN / PASO_CLICK) * PASO_CLICK;
              if (turnos.some((t) => min >= t.ini && min < t.fin)) onSlot(barbero.id, min);
            }}
          >
            {/* Líneas de hora y media hora */}
            {horas.slice(1).map((h) => (
              <div key={h} className="pointer-events-none absolute inset-x-0 border-t border-cromo-soft" style={{ top: pos(h) }} />
            ))}
            {horas.slice(0, -1).map((h) => (
              <div
                key={`m${h}`}
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-cromo-soft/70"
                style={{ top: pos(h + 30) }}
              />
            ))}

            {/* Fuera de turno */}
            {cerrado.map((h) => (
              <div
                key={`c${h.ini}`}
                className="franja-cerrada pointer-events-none absolute inset-x-0 bg-porcelana/70"
                style={{ top: pos(h.ini), height: (h.fin - h.ini) * PX_MIN }}
              />
            ))}

            {/* Bloqueos */}
            {bl.map((b) => {
              const ini = Math.max(minDe(b.inicio), inicio);
              const end = Math.min(minDe(b.fin), fin);
              return (
                <div
                  key={b.id}
                  className="franja-cerrada pointer-events-none absolute inset-x-1 rounded-md border border-dashed border-ink-muted/40 bg-cromo-soft/80 px-2 py-1"
                  style={{ top: pos(ini), height: (end - ini) * PX_MIN }}
                >
                  <p className="text-xs font-medium text-ink-muted">{b.motivo ?? 'Bloqueado'}</p>
                </div>
              );
            })}

            {/* Citas */}
            {cs.map((c) => {
              const ini = minDe(c.inicio);
              const dur = (new Date(c.fin).getTime() - new Date(c.inicio).getTime()) / 60_000;
              const h = dur * PX_MIN - 3;
              const activa = ESTADOS_ACTIVOS.includes(c.estado);
              const fallida = c.estado === 'CANCELADA' || c.estado === 'NO_SE_PRESENTO';
              const compacta = h < 44;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onCita(c)}
                  className={cn(
                    'absolute inset-x-1 overflow-hidden rounded-md border-l-[3px] px-2 text-left transition-shadow hover:z-10 hover:shadow-md focus-visible:z-10',
                    compacta ? 'flex items-center gap-2 py-0' : 'py-1.5',
                    activa && 'bg-white shadow-[0_1px_0_rgb(23_33_43/0.08)] ring-1 ring-cromo',
                    c.estado === 'EN_SILLA' && 'ring-2 ring-musgo/50',
                    c.estado === 'COMPLETADA' && 'bg-cromo-soft/70',
                    fallida && 'bg-cordoban-soft/60',
                  )}
                  style={{ top: pos(ini) + 1, height: h, borderLeftColor: fallida ? '#7A2E2B' : barbero.colorAgenda }}
                >
                  <p className={cn('truncate text-sm font-semibold', !activa && 'text-ink-muted', fallida && 'line-through')}>
                    {c.clienteNombre}
                  </p>
                  <p className={cn('truncate text-xs text-ink-muted tabular', compacta && 'shrink-0')}>
                    {compacta ? formatoHora(c.inicio) : `${formatoHora(c.inicio)} · ${c.servicios.map((s) => s.nombre).join(', ')}`}
                  </p>
                  {c.estado === 'EN_SILLA' && !compacta && (
                    <p className="mt-0.5 text-xs font-semibold text-musgo">En silla</p>
                  )}
                </button>
              );
            })}

            {mostrarAhora && (
              <div className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-cordoban" style={{ top: pos(minAhora) }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
