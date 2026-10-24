import { useMutation, useQuery } from '@tanstack/react-query';
import { addDays, format, isSameDay, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, CalendarCheck, Check, MapPin, Phone, Store } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { api } from '@/api';
import { ServicioChecklist } from '@/components/ServicioChecklist';
import { SlotPicker } from '@/components/SlotPicker';
import { Avatar, Button, Cargando, EmptyState, Field, Input, Textarea, mensajeError } from '@/components/ui';
import { cn, enlaceTelefono, formatoDinero, formatoTelefono, limpiarTelefono, telefonoValido } from '@/lib/format';
import { formatoDuracion, formatoHora } from '@/lib/time';
import type { Cita } from '@/types';

const PASOS = ['Servicios', 'Barbero', 'Fecha y hora', 'Tus datos'] as const;
const DIAS_VISIBLES = 14;

export const ReservaPage = () => {
  const { slug = '' } = useParams();
  const [paso, setPaso] = useState(0);
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [barberoId, setBarberoId] = useState<string | undefined>(undefined);
  const [fecha, setFecha] = useState(() => startOfDay(new Date()));
  const [inicio, setInicio] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [confirmada, setConfirmada] = useState<Cita | null>(null);

  const barberia = useQuery({ queryKey: ['pub', slug], queryFn: () => api.publico.barberia(slug), retry: false });
  const servicios = useQuery({ queryKey: ['pub', slug, 'servicios'], queryFn: () => api.publico.servicios(slug), enabled: barberia.isSuccess });
  const barberos = useQuery({ queryKey: ['pub', slug, 'barberos'], queryFn: () => api.publico.barberos(slug), enabled: barberia.isSuccess });

  const q = { fecha: format(fecha, 'yyyy-MM-dd'), servicioIds, barberoId };
  const slots = useQuery({
    queryKey: ['pub', slug, 'slots', q],
    queryFn: () => api.publico.disponibilidad(slug, q),
    enabled: paso === 2 && servicioIds.length > 0,
  });

  const reservar = useMutation({
    mutationFn: () => {
      // "Primero disponible": asignar el primer barbero libre en ese horario
      const asignado = barberoId ?? slots.data?.find((s) => s.inicio === inicio)?.barberoIds[0];
      return api.publico.reservar(slug, {
        barberoId: asignado!,
        inicio: inicio!,
        servicioIds,
        notas: notas.trim() || undefined,
        cliente: { nombre: nombre.trim(), telefono: limpiarTelefono(telefono) },
      });
    },
    onSuccess: setConfirmada,
  });

  const elegidos = useMemo(() => (servicios.data ?? []).filter((s) => servicioIds.includes(s.id)), [servicios.data, servicioIds]);
  const barberoSel = barberos.data?.find((b) => b.id === barberoId);
  const precioDe = (servicioId: string, base: number) =>
    barberoSel?.servicios.find((x) => x.servicioId === servicioId)?.precio ?? base;
  const total = elegidos.reduce((t, s) => t + precioDe(s.id, s.precio), 0);
  const duracion = elegidos.reduce((t, s) => t + s.duracionMin, 0);
  const capaces = (barberos.data ?? []).filter((b) => servicioIds.every((id) => b.servicios.some((x) => x.servicioId === id)));

  const dias = useMemo(() => {
    const hoy = startOfDay(new Date());
    return Array.from({ length: DIAS_VISIBLES }, (_, i) => addDays(hoy, i));
  }, []);
  const abierto = (d: Date) => !barberia.data?.horarios.find((h) => h.diaSemana === d.getDay())?.cerrado;

  const errores = {
    nombre: nombre.trim().length >= 2 ? undefined : 'Escribe tu nombre',
    telefono: telefonoValido(telefono) ? undefined : 'Escribe un número de 10 dígitos',
  };

  const puedeSeguir = [servicioIds.length > 0, true, !!inicio, !errores.nombre && !errores.telefono][paso];

  const siguiente = () => {
    if (paso === 3) {
      setIntentado(true);
      if (!errores.nombre && !errores.telefono) reservar.mutate();
      return;
    }
    if (paso === 0 && barberoId && !capaces.some((b) => b.id === barberoId)) setBarberoId(undefined);
    setPaso((p) => p + 1);
  };

  // ---- Estados de carga / error ------------------------------------------------

  if (barberia.isLoading) return <Cargando texto="Cargando barbería…" />;
  if (barberia.isError || !barberia.data) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <EmptyState icono={Store} titulo="No encontramos esta barbería" texto="Revisa el enlace que te compartieron." />
      </div>
    );
  }

  const b = barberia.data;

  // ---- Confirmación --------------------------------------------------------------

  if (confirmada) {
    const barbero = barberos.data?.find((x) => x.id === confirmada.barberoId);
    return (
      <div className="min-h-dvh bg-porcelana">
        <Encabezado nombre={b.nombre} direccion={b.direccion} telefono={b.telefono} />
        <main className="mx-auto max-w-xl px-4 py-10">
          <div className="flex size-14 items-center justify-center rounded-full bg-musgo text-white">
            <Check className="size-7" strokeWidth={3} />
          </div>
          <h2 className="font-rotulo mt-5 text-4xl leading-none">Tu cita está confirmada</h2>
          <p className="mt-2 text-ink-muted">Te esperamos. Si no puedes llegar, avísale a la barbería.</p>

          <dl className="mt-8 divide-y divide-cromo rounded-(--radius-panel) border border-cromo bg-white">
            {[
              ['Cuándo', `${format(new Date(confirmada.inicio), "EEEE d 'de' MMMM", { locale: es })}, ${formatoHora(confirmada.inicio)}`],
              ['Con', barbero?.nombre ?? ''],
              ['Servicios', confirmada.servicios.map((s) => s.nombre).join(', ')],
              ['Total', formatoDinero(confirmada.servicios.reduce((t, s) => t + s.precio, 0))],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3 text-sm">
                <dt className="text-ink-muted">{k}</dt>
                <dd className="text-right font-medium first-letter:uppercase">{v}</dd>
              </div>
            ))}
          </dl>

          <Button
            variante="secundario"
            className="mt-6"
            onClick={() => {
              setConfirmada(null);
              setPaso(0);
              setServicioIds([]);
              setInicio(null);
              setIntentado(false);
            }}
          >
            Reservar otra cita
          </Button>
        </main>
      </div>
    );
  }

  // ---- Wizard ----------------------------------------------------------------------

  return (
    <div className="min-h-dvh bg-porcelana pb-32">
      <Encabezado nombre={b.nombre} direccion={b.direccion} telefono={b.telefono} />

      <main className="mx-auto max-w-xl px-4 pt-6">
        <nav aria-label="Pasos de la reserva" className="mb-6">
          <ol className="flex gap-1.5">
            {PASOS.map((p, i) => (
              <li key={p} className="flex-1">
                <span className={cn('block h-1 rounded-full', i <= paso ? 'bg-barbicide' : 'bg-cromo')} />
              </li>
            ))}
          </ol>
          <div className="mt-4 flex items-center gap-3">
            {paso > 0 && (
              <button
                type="button"
                onClick={() => setPaso((p) => p - 1)}
                className="-ml-1 rounded-md p-1 text-ink-muted hover:bg-cromo-soft hover:text-ink"
                aria-label="Paso anterior"
              >
                <ArrowLeft className="size-5" />
              </button>
            )}
            <div>
              <p className="text-xs text-ink-muted">
                Paso {paso + 1} de {PASOS.length}
              </p>
              <h2 className="font-rotulo text-3xl leading-tight">{PASOS[paso]}</h2>
            </div>
          </div>
        </nav>

        {paso === 0 &&
          (servicios.isLoading ? (
            <Cargando />
          ) : (
            <ServicioChecklist servicios={servicios.data ?? []} seleccion={servicioIds} onCambiar={setServicioIds} />
          ))}

        {paso === 1 && (
          <ul className="divide-y divide-cromo-soft overflow-hidden rounded-(--radius-control) border border-cromo bg-white">
            {[{ id: undefined, nombre: 'El primero disponible', colorAgenda: '#5B6875' }, ...capaces].map((x) => {
              const activo = barberoId === x.id;
              return (
                <li key={x.id ?? 'cualquiera'}>
                  <button
                    type="button"
                    onClick={() => {
                      setBarberoId(x.id);
                      setInicio(null);
                    }}
                    aria-pressed={activo}
                    className={cn('flex w-full items-center gap-3 px-4 py-4 text-left', activo ? 'bg-espuma/60' : 'hover:bg-porcelana')}
                  >
                    {x.id ? (
                      <Avatar nombre={x.nombre} color={x.colorAgenda} />
                    ) : (
                      <span className="flex size-9 items-center justify-center rounded-full border border-dashed border-ink-muted text-ink-muted">
                        <CalendarCheck className="size-4" />
                      </span>
                    )}
                    <span className="flex-1">
                      <span className="block font-semibold">{x.nombre}</span>
                      {!x.id && <span className="block text-sm text-ink-muted">Te mostramos todos los horarios libres</span>}
                    </span>
                    <span
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full border',
                        activo ? 'border-barbicide bg-barbicide text-white' : 'border-cromo',
                      )}
                    >
                      {activo && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {paso === 2 && (
          <div className="space-y-6">
            <div className="-mx-4 overflow-x-auto px-4 pb-1">
              <div className="flex gap-2">
                {dias.map((d) => {
                  const activo = isSameDay(d, fecha);
                  const disponible = abierto(d);
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      disabled={!disponible}
                      onClick={() => {
                        setFecha(d);
                        setInicio(null);
                      }}
                      aria-pressed={activo}
                      className={cn(
                        'flex w-16 shrink-0 flex-col items-center rounded-(--radius-control) border py-2.5 transition-colors',
                        activo ? 'border-ink bg-ink text-white' : 'border-cromo bg-white hover:border-ink-muted',
                        !disponible && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <span className={cn('text-xs capitalize', activo ? 'text-white/70' : 'text-ink-muted')}>
                        {format(d, 'EEE', { locale: es }).replace('.', '')}
                      </span>
                      <span className="font-rotulo text-2xl leading-tight tabular">{format(d, 'd')}</span>
                      <span className={cn('text-[11px] capitalize', activo ? 'text-white/70' : 'text-ink-muted')}>
                        {format(d, 'MMM', { locale: es }).replace('.', '')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {abierto(fecha) ? (
              <SlotPicker slots={slots.data ?? []} seleccion={inicio} onElegir={setInicio} cargando={slots.isFetching} />
            ) : (
              <p className="rounded-(--radius-control) bg-white px-4 py-3 text-sm text-ink-muted">La barbería no abre este día.</p>
            )}
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-4">
            <Field label="Nombre" htmlFor="nombre" error={intentado ? errores.nombre : undefined}>
              <Input id="nombre" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className="h-12 text-base" />
            </Field>
            <Field
              label="Teléfono"
              htmlFor="tel"
              error={intentado ? errores.telefono : undefined}
              hint="La barbería lo usará solo para avisarte sobre tu cita."
            >
              <Input
                id="tel"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(555) 123-4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="h-12 text-base"
              />
            </Field>
            <Field label="¿Algo que deba saber tu barbero?" htmlFor="notas" hint="Opcional">
              <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
            </Field>

            {inicio && (
              <div className="rounded-(--radius-panel) border border-cromo bg-white px-4 py-3 text-sm">
                <p className="font-semibold first-letter:uppercase">
                  {format(new Date(inicio), "EEEE d 'de' MMMM", { locale: es })}, {formatoHora(inicio)}
                </p>
                <p className="text-ink-muted">
                  {elegidos.map((s) => s.nombre).join(', ')} con {barberoSel?.nombre ?? 'el primer barbero disponible'}
                </p>
              </div>
            )}
            {reservar.isError && (
              <p className="rounded-(--radius-control) bg-cordoban-soft px-3 py-2 text-sm text-cordoban">{mensajeError(reservar.error)}</p>
            )}
          </div>
        )}
      </main>

      {/* Resumen fijo */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-cromo bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            {servicioIds.length ? (
              <>
                <p className="font-rotulo text-2xl leading-none tabular">{formatoDinero(total)}</p>
                <p className="mt-0.5 truncate text-xs text-ink-muted">
                  {servicioIds.length} {servicioIds.length === 1 ? 'servicio' : 'servicios'}, {formatoDuracion(duracion)}
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-muted">Elige uno o más servicios</p>
            )}
          </div>
          <Button tamano="lg" onClick={siguiente} disabled={paso < 3 && !puedeSeguir} cargando={reservar.isPending}>
            {paso === 3 ? 'Confirmar cita' : 'Continuar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const Encabezado = ({ nombre, direccion, telefono }: { nombre: string; direccion?: string | null; telefono?: string | null }) => (
  <header className="bg-ink text-white">
    <div className="mx-auto max-w-xl px-4 pt-8 pb-6">
      <h1 className="font-rotulo text-[2.75rem] leading-[0.9]">{nombre}</h1>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/65">
        {direccion && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {direccion}
          </span>
        )}
        {telefono && (
          <a href={enlaceTelefono(telefono)} className="inline-flex items-center gap-1.5 hover:text-white">
            <Phone className="size-3.5" /> {formatoTelefono(telefono)}
          </a>
        )}
      </div>
    </div>
  </header>
);
