import { Copy, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { reiniciarDemo } from '@/api/mock/db';
import { Button, Cargando, ConfirmDialog, Field, Input, PageHeader, Panel, PanelHeader, Select, Toggle, mensajeError, useToast } from '@/components/ui';
import { useActualizarBarberia, useBarberia, useHorarioBarberia } from '@/hooks/queries';
import { DIAS, hhmmToMin, ORDEN_SEMANA } from '@/lib/time';
import type { HorarioDia } from '@/types';

const ZONAS = [
  ['America/New_York', 'Este (Nueva York, Miami)'],
  ['America/Chicago', 'Centro (Chicago, Houston)'],
  ['America/Denver', 'Montaña (Denver)'],
  ['America/Phoenix', 'Arizona (sin horario de verano)'],
  ['America/Los_Angeles', 'Pacífico (Los Ángeles)'],
] as const;

export const ConfiguracionPage = () => {
  const toast = useToast();
  const { data: barberia, isLoading } = useBarberia();
  const actualizar = useActualizarBarberia();
  const guardarHorario = useHorarioBarberia();

  const [datos, setDatos] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    zonaHoraria: 'America/New_York',
    impuestoProductosPct: 0,
    intervaloReservaMin: 15,
    anticipacionMinHoras: 1,
    ventanaReservaDias: 30,
  });
  const [horario, setHorario] = useState<HorarioDia[]>([]);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);

  useEffect(() => {
    if (!barberia) return;
    setDatos({
      nombre: barberia.nombre,
      telefono: barberia.telefono ?? '',
      direccion: barberia.direccion ?? '',
      zonaHoraria: barberia.zonaHoraria,
      impuestoProductosPct: barberia.impuestoProductosPct,
      intervaloReservaMin: barberia.intervaloReservaMin,
      anticipacionMinHoras: barberia.anticipacionMinHoras,
      ventanaReservaDias: barberia.ventanaReservaDias,
    });
    setHorario(barberia.horarios);
  }, [barberia]);

  if (isLoading || !barberia) return <Cargando />;

  const enlace = `${window.location.origin}/b/${barberia.slug}`;
  const set = <K extends keyof typeof datos>(k: K, v: (typeof datos)[K]) => setDatos((d) => ({ ...d, [k]: v }));
  const setDia = (dia: number, cambio: Partial<HorarioDia>) =>
    setHorario((h) => h.map((x) => (x.diaSemana === dia ? { ...x, ...cambio } : x)));

  const onGuardarDatos = async () => {
    if (datos.nombre.trim().length < 2) return toast.error('Escribe el nombre de la barbería');
    try {
      await actualizar.mutateAsync(datos);
      toast.exito('Datos guardados');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const onGuardarHorario = async () => {
    const malo = horario.find((h) => !h.cerrado && hhmmToMin(h.abre) >= hhmmToMin(h.cierra));
    if (malo) return toast.error(`${DIAS[malo.diaSemana]}: la apertura debe ser antes del cierre`);
    try {
      await guardarHorario.mutateAsync(horario);
      toast.exito('Horario del local guardado');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(enlace);
      toast.exito('Enlace copiado');
    } catch {
      toast.error('No se pudo copiar. Selecciona el enlace y cópialo manualmente.');
    }
  };

  return (
    <>
      <PageHeader titulo="Configuración" descripcion="Datos de la barbería, horario del local y reglas de la página de reservas." />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Panel>
            <PanelHeader titulo="Página de reservas" descripcion="Compártelo en Instagram, Facebook o WhatsApp." />
            <div className="flex flex-wrap items-center gap-2 px-5 py-4">
              <code className="min-w-0 flex-1 truncate rounded-(--radius-control) bg-porcelana px-3 py-2.5 text-sm">{enlace}</code>
              <Button variante="secundario" onClick={copiar}>
                <Copy className="size-4" /> Copiar enlace
              </Button>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              titulo="Datos y reservas"
              acciones={
                <Button tamano="sm" onClick={onGuardarDatos} cargando={actualizar.isPending}>
                  Guardar datos
                </Button>
              }
            />
            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              <Field label="Nombre de la barbería" htmlFor="nombre" className="sm:col-span-2">
                <Input id="nombre" value={datos.nombre} onChange={(e) => set('nombre', e.target.value)} />
              </Field>
              <Field label="Teléfono" htmlFor="tel">
                <Input id="tel" value={datos.telefono} onChange={(e) => set('telefono', e.target.value)} />
              </Field>
              <Field label="Dirección" htmlFor="dir">
                <Input id="dir" value={datos.direccion} onChange={(e) => set('direccion', e.target.value)} />
              </Field>
              <Field label="Zona horaria" htmlFor="tz">
                <Select id="tz" value={datos.zonaHoraria} onChange={(e) => set('zonaHoraria', e.target.value)}>
                  {ZONAS.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sales tax en productos (%)" htmlFor="tax" hint="Los cortes suelen estar exentos; depende del estado.">
                <Input
                  id="tax"
                  type="number"
                  inputMode="decimal"
                  step={0.25}
                  min={0}
                  value={datos.impuestoProductosPct}
                  onChange={(e) => set('impuestoProductosPct', Number(e.target.value))}
                />
              </Field>
              <Field label="Horarios cada" htmlFor="int" hint="Separación entre horarios ofrecidos.">
                <Select id="int" value={datos.intervaloReservaMin} onChange={(e) => set('intervaloReservaMin', Number(e.target.value))}>
                  {[10, 15, 20, 30].map((m) => (
                    <option key={m} value={m}>
                      {m} minutos
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Anticipación mínima" htmlFor="ant" hint="Para reservas en línea.">
                <Select id="ant" value={datos.anticipacionMinHoras} onChange={(e) => set('anticipacionMinHoras', Number(e.target.value))}>
                  {[0, 1, 2, 3, 6, 12, 24].map((h) => (
                    <option key={h} value={h}>
                      {h === 0 ? 'Sin mínimo' : `${h} ${h === 1 ? 'hora' : 'horas'}`}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Reservar hasta" htmlFor="ven" hint="Días hacia adelante que se pueden reservar.">
                <Select id="ven" value={datos.ventanaReservaDias} onChange={(e) => set('ventanaReservaDias', Number(e.target.value))}>
                  {[7, 14, 30, 60].map((d) => (
                    <option key={d} value={d}>
                      {d} días
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Panel>
        </div>

        <Panel>
          <PanelHeader
            titulo="Horario del local"
            descripcion="Ningún barbero puede recibir citas fuera de este horario."
            acciones={
              <Button tamano="sm" onClick={onGuardarHorario} cargando={guardarHorario.isPending}>
                Guardar horario
              </Button>
            }
          />
          <ul className="divide-y divide-cromo-soft px-5">
            {ORDEN_SEMANA.map((dia) => {
              const h = horario.find((x) => x.diaSemana === dia);
              if (!h) return null;
              return (
                <li key={dia} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-24 text-sm font-semibold">{DIAS[dia]}</span>
                  <Toggle etiqueta={`Abierto el ${DIAS[dia]}`} activo={!h.cerrado} onCambiar={(v) => setDia(dia, { cerrado: !v })} />
                  {h.cerrado ? (
                    <span className="text-sm text-ink-muted">Cerrado</span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Input type="time" step={900} value={h.abre} onChange={(e) => setDia(dia, { abre: e.target.value })} className="h-9 w-[7.75rem] tabular" aria-label={`${DIAS[dia]}: abre`} />
                      <span className="text-ink-muted">a</span>
                      <Input type="time" step={900} value={h.cierra} onChange={(e) => setDia(dia, { cierra: e.target.value })} className="h-9 w-[7.75rem] tabular" aria-label={`${DIAS[dia]}: cierra`} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-cromo pt-5">
        <p className="text-sm text-ink-muted">Modo demostración: los datos viven en este navegador.</p>
        <Button variante="secundario" onClick={() => setConfirmarReinicio(true)}>
          <RotateCcw className="size-4" /> Reiniciar datos de demostración
        </Button>
      </div>

      <ConfirmDialog
        abierto={confirmarReinicio}
        titulo="Reiniciar datos de demostración"
        mensaje="Se borran los cambios hechos en este navegador y se generan citas nuevas alrededor de hoy."
        textoConfirmar="Reiniciar datos"
        peligro
        onCerrar={() => setConfirmarReinicio(false)}
        onConfirmar={() => {
          reiniciarDemo();
          window.location.reload();
        }}
      />
    </>
  );
};
