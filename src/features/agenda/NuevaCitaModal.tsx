import { format, startOfDay } from 'date-fns';
import { useMemo, useState } from 'react';
import { Button, Field, Input, Modal, Select, Textarea, mensajeError, useToast } from '@/components/ui';
import { ServicioChecklist } from '@/components/ServicioChecklist';
import { SlotPicker } from '@/components/SlotPicker';
import { useCrearCita, useDisponibilidad, useServicios } from '@/hooks/queries';
import { cn, limpiarTelefono, telefonoValido } from '@/lib/format';
import { fechaConMinutos, formatoHora } from '@/lib/time';
import type { Barbero, OrigenCita } from '@/types';

export interface Prefill {
  fecha: Date;
  barberoId?: string;
  minuto?: number;
}

interface Props {
  prefill: Prefill;
  barberos: Barbero[];
  onCerrar: () => void;
}

export const NuevaCitaModal = ({ prefill, barberos, onCerrar }: Props) => {
  const toast = useToast();
  const { data: servicios = [] } = useServicios();
  const crear = useCrearCita();

  const [barberoId, setBarberoId] = useState(prefill.barberoId ?? barberos[0]?.id ?? '');
  const [fecha, setFecha] = useState(format(prefill.fecha, 'yyyy-MM-dd'));
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [inicio, setInicio] = useState<string | null>(
    prefill.minuto != null ? fechaConMinutos(prefill.fecha, prefill.minuto).toISOString() : null,
  );
  const [origen, setOrigen] = useState<OrigenCita>('RECEPCION');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [intentado, setIntentado] = useState(false);

  const barbero = barberos.find((b) => b.id === barberoId);
  const ofrecidos = useMemo(
    () => servicios.filter((s) => barbero?.servicios.some((bs) => bs.servicioId === s.id)),
    [servicios, barbero],
  );

  const { data: slots = [], isFetching } = useDisponibilidad({ fecha, servicioIds, barberoId }, !!barberoId);
  const inicioValido = !!inicio && slots.some((s) => s.inicio === inicio);

  const errores = {
    servicios: servicioIds.length ? undefined : 'Elige al menos un servicio',
    inicio: inicioValido ? undefined : 'Elige un horario disponible',
    nombre: nombre.trim().length >= 2 ? undefined : 'Escribe el nombre del cliente',
    telefono: telefonoValido(telefono) ? undefined : 'Teléfono de 10 dígitos',
  };
  const valido = Object.values(errores).every((e) => !e);

  const guardar = async () => {
    setIntentado(true);
    if (!valido || !inicio) return;
    try {
      const cita = await crear.mutateAsync({
        barberoId,
        inicio,
        servicioIds,
        origen,
        notas: notas.trim() || undefined,
        cliente: { nombre: nombre.trim(), telefono: limpiarTelefono(telefono) },
      });
      toast.exito(`Cita agendada: ${cita.clienteNombre}, ${formatoHora(cita.inicio)}`);
      onCerrar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="Nueva cita"
      ancho="lg"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar} cargando={crear.isPending}>
            Agendar cita
          </Button>
        </>
      }
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Barbero" htmlFor="barbero">
            <Select
              id="barbero"
              value={barberoId}
              onChange={(e) => {
                setBarberoId(e.target.value);
                setServicioIds([]);
                setInicio(null);
              }}
            >
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nombre}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Servicios" error={intentado ? errores.servicios : undefined}>
            <ServicioChecklist
              servicios={ofrecidos}
              seleccion={servicioIds}
              onCambiar={setServicioIds}
              barbero={barbero}
              compacto
            />
          </Field>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-ink-soft">Tipo de cita</legend>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['RECEPCION', 'Agendada'],
                  ['WALK_IN', 'Sin cita (llegó ahora)'],
                ] as const
              ).map(([v, t]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setOrigen(v)}
                  aria-pressed={origen === v}
                  className={cn(
                    'rounded-(--radius-control) border px-3 py-2 text-sm',
                    origen === v ? 'border-barbicide bg-espuma font-semibold text-barbicide-dark' : 'border-cromo hover:border-ink-muted',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="space-y-4">
          <Field label="Fecha" htmlFor="fecha">
            <Input
              id="fecha"
              type="date"
              value={fecha}
              min={format(startOfDay(new Date()), 'yyyy-MM-dd')}
              onChange={(e) => {
                setFecha(e.target.value);
                setInicio(null);
              }}
            />
          </Field>

          <Field label="Hora" error={intentado ? errores.inicio : undefined}>
            {servicioIds.length ? (
              <SlotPicker slots={slots} seleccion={inicio} onElegir={setInicio} cargando={isFetching} compacto />
            ) : (
              <p className="rounded-(--radius-control) bg-porcelana px-3 py-3 text-sm text-ink-muted">
                Elige los servicios para ver los horarios libres.
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cliente" htmlFor="nombre" error={intentado ? errores.nombre : undefined}>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Teléfono" htmlFor="tel" error={intentado ? errores.telefono : undefined}>
              <Input
                id="tel"
                inputMode="numeric"
                placeholder="(555) 123-4567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Notas" htmlFor="notas" hint="Opcional. Ej.: degradado bajo, trae foto de referencia.">
            <Textarea id="notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} />
          </Field>
        </div>
      </div>
    </Modal>
  );
};
