import { addDays, differenceInCalendarDays, endOfDay, format, isToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarOff, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Button, Cargando, EmptyState, Panel } from '@/components/ui';
import { useBarberia, useBarberos, useBloqueos, useCitas } from '@/hooks/queries';
import { cn } from '@/lib/format';
import { DIAS } from '@/lib/time';
import type { Cita } from '@/types';
import { AgendaGrid } from './AgendaGrid';
import { CitaDetalleModal } from './CitaDetalleModal';
import { NuevaCitaModal, type Prefill } from './NuevaCitaModal';

const aInputFecha = (d: Date) => format(d, 'yyyy-MM-dd');

/** "Mañana", "Ayer", "Dentro de 3 días"… */
const relativo = (d: Date) => {
  const n = differenceInCalendarDays(d, new Date());
  if (n === 1) return 'Mañana';
  if (n === -1) return 'Ayer';
  return n > 0 ? `Dentro de ${n} días` : `Hace ${-n} días`;
};

export const AgendaPage = () => {
  const { sesion, tieneRol } = useAuth();
  const [fecha, setFecha] = useState(() => startOfDay(new Date()));
  const [nueva, setNueva] = useState<Prefill | null>(null);
  const [citaSel, setCitaSel] = useState<Cita | null>(null);

  const desde = fecha.toISOString();
  const hasta = endOfDay(fecha).toISOString();
  const { data: barberia } = useBarberia();
  const { data: barberos } = useBarberos();
  const { data: citas, isFetching } = useCitas(desde, hasta);
  const { data: bloqueos } = useBloqueos(desde, hasta);

  const puedeAgendar = tieneRol('DUENO', 'RECEPCION');
  const miBarberoId = sesion?.usuario.barbero?.id;

  // El barbero solo ve su silla
  const columnas = useMemo(
    () => (barberos ?? []).filter((b) => !tieneRol('BARBERO') || b.id === miBarberoId),
    [barberos, tieneRol, miBarberoId],
  );

  const resumen = useMemo(() => {
    const lista = (citas ?? []).filter((c) => columnas.some((b) => b.id === c.barberoId));
    return {
      total: lista.filter((c) => c.estado !== 'CANCELADA').length,
      enSilla: lista.filter((c) => c.estado === 'EN_SILLA').length,
      pendientes: lista.filter((c) => c.estado === 'PENDIENTE').length,
      noShow: lista.filter((c) => c.estado === 'NO_SE_PRESENTO').length,
    };
  }, [citas, columnas]);

  if (!barberia || !barberos) return <Cargando texto="Cargando agenda…" />;

  const local = barberia.horarios.find((h) => h.diaSemana === fecha.getDay());
  const hoy = isToday(fecha);
  const titulo = hoy ? 'Hoy' : format(fecha, "EEEE d 'de' MMMM", { locale: es });

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted first-letter:uppercase">
            {hoy ? format(fecha, "EEEE d 'de' MMMM", { locale: es }) : relativo(fecha)}
          </p>
          <h1 className="font-rotulo mt-1 text-4xl leading-none first-letter:uppercase md:text-5xl">{titulo}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-(--radius-control) border border-cromo bg-white">
            <button
              type="button"
              onClick={() => setFecha((f) => addDays(f, -1))}
              className="flex size-10 items-center justify-center text-ink-soft hover:bg-cromo-soft"
              aria-label="Día anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <input
              type="date"
              value={aInputFecha(fecha)}
              onChange={(e) => e.target.value && setFecha(startOfDay(new Date(`${e.target.value}T00:00`)))}
              className="h-10 border-x border-cromo bg-transparent px-2 text-sm tabular focus:outline-none"
              aria-label="Elegir fecha"
            />
            <button
              type="button"
              onClick={() => setFecha((f) => addDays(f, 1))}
              className="flex size-10 items-center justify-center text-ink-soft hover:bg-cromo-soft"
              aria-label="Día siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
          {!hoy && (
            <Button variante="secundario" onClick={() => setFecha(startOfDay(new Date()))}>
              Hoy
            </Button>
          )}
          {puedeAgendar && (
            <Button onClick={() => setNueva({ fecha })}>
              <Plus className="size-4" />
              Nueva cita
            </Button>
          )}
        </div>
      </div>

      {local && !local.cerrado && (
        <dl className="mb-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {[
            { k: 'Citas', v: resumen.total },
            { k: 'En silla ahora', v: resumen.enSilla, tono: resumen.enSilla ? 'text-musgo' : '' },
            { k: 'Por confirmar', v: resumen.pendientes, tono: resumen.pendientes ? 'text-ambar' : '' },
            { k: 'No se presentaron', v: resumen.noShow, tono: resumen.noShow ? 'text-cordoban' : '' },
          ].map(({ k, v, tono }) => (
            <div key={k} className="flex items-baseline gap-2">
              <dd className={cn('font-rotulo text-2xl tabular', tono)}>{v}</dd>
              <dt className="text-ink-muted">{k}</dt>
            </div>
          ))}
          {isFetching && <span className="text-xs text-ink-muted">Actualizando…</span>}
        </dl>
      )}

      {!local || local.cerrado ? (
        <Panel>
          <EmptyState
            icono={CalendarOff}
            titulo={`La barbería cierra los ${DIAS[fecha.getDay()].toLowerCase()}`}
            texto="Cambia de día o ajusta el horario del local en Configuración."
            accion={
              <Button variante="secundario" onClick={() => setFecha((f) => addDays(f, 1))}>
                Ver el día siguiente
              </Button>
            }
          />
        </Panel>
      ) : (
        <AgendaGrid
          fecha={fecha}
          barberia={barberia}
          barberos={columnas}
          citas={citas ?? []}
          bloqueos={bloqueos ?? []}
          esHoy={hoy}
          onSlot={puedeAgendar ? (barberoId, minuto) => setNueva({ fecha, barberoId, minuto }) : undefined}
          onCita={setCitaSel}
        />
      )}

      {puedeAgendar && (
        <p className="mt-3 text-xs text-ink-muted">Toca un espacio libre en la columna de un barbero para agendar a esa hora.</p>
      )}

      {nueva && <NuevaCitaModal prefill={nueva} barberos={barberos} onCerrar={() => setNueva(null)} />}
      {citaSel && (
        <CitaDetalleModal
          cita={citaSel}
          barbero={barberos.find((b) => b.id === citaSel.barberoId)}
          puedeGestionar={puedeAgendar || citaSel.barberoId === miBarberoId}
          onCerrar={() => setCitaSel(null)}
        />
      )}
    </>
  );
};
