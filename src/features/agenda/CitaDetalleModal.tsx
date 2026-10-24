import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Phone } from 'lucide-react';
import { Avatar, Button, EstadoCitaBadge, Modal, mensajeError, useToast } from '@/components/ui';
import { useEstadoCita } from '@/hooks/queries';
import { enlaceTelefono, formatoDinero, formatoTelefono } from '@/lib/format';
import { formatoDuracion, formatoHora } from '@/lib/time';
import type { Barbero, Cita, EstadoCita } from '@/types';

const ORIGEN = { EN_LINEA: 'Reservó en línea', RECEPCION: 'Agendada en local', WALK_IN: 'Llegó sin cita' };

type Accion = { estado: EstadoCita; texto: string; variante: 'primario' | 'secundario' | 'peligro'; toast: string };

const ACCIONES: Partial<Record<EstadoCita, Accion[]>> = {
  PENDIENTE: [
    { estado: 'CANCELADA', texto: 'Cancelar cita', variante: 'secundario', toast: 'Cita cancelada' },
    { estado: 'CONFIRMADA', texto: 'Confirmar', variante: 'primario', toast: 'Cita confirmada' },
  ],
  CONFIRMADA: [
    { estado: 'CANCELADA', texto: 'Cancelar cita', variante: 'secundario', toast: 'Cita cancelada' },
    { estado: 'NO_SE_PRESENTO', texto: 'No se presentó', variante: 'secundario', toast: 'Marcada como no se presentó' },
    { estado: 'EN_SILLA', texto: 'Pasar a silla', variante: 'primario', toast: 'Cliente en silla' },
  ],
  EN_SILLA: [{ estado: 'COMPLETADA', texto: 'Terminar servicio', variante: 'primario', toast: 'Servicio terminado' }],
};

interface Props {
  cita: Cita;
  barbero?: Barbero;
  puedeGestionar: boolean;
  onCerrar: () => void;
}

export const CitaDetalleModal = ({ cita, barbero, puedeGestionar, onCerrar }: Props) => {
  const toast = useToast();
  const cambiar = useEstadoCita();
  const total = cita.servicios.reduce((t, s) => t + s.precio, 0);
  const duracion = cita.servicios.reduce((t, s) => t + s.duracionMin, 0);
  const acciones = puedeGestionar ? (ACCIONES[cita.estado] ?? []) : [];

  const ejecutar = async (a: Accion) => {
    try {
      await cambiar.mutateAsync({ id: cita.id, estado: a.estado });
      toast.exito(a.toast);
      onCerrar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={cita.clienteNombre}
      descripcion={format(new Date(cita.inicio), "EEEE d 'de' MMMM", { locale: es })}
      pie={
        acciones.length ? (
          <div className="flex w-full flex-wrap justify-end gap-2">
            {acciones.map((a) => (
              <Button
                key={a.estado}
                variante={a.variante}
                onClick={() => ejecutar(a)}
                cargando={cambiar.isPending && cambiar.variables?.estado === a.estado}
                disabled={cambiar.isPending}
              >
                {a.texto}
              </Button>
            ))}
          </div>
        ) : undefined
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-rotulo text-3xl tabular">
          {formatoHora(cita.inicio)} – {formatoHora(cita.fin)}
        </p>
        <EstadoCitaBadge estado={cita.estado} />
      </div>

      <dl className="mt-5 grid grid-cols-[7rem_1fr] gap-y-3 text-sm">
        <dt className="text-ink-muted">Barbero</dt>
        <dd className="flex items-center gap-2">
          {barbero && <Avatar nombre={barbero.nombre} color={barbero.colorAgenda} tamano="sm" />}
          {barbero?.nombre ?? '—'}
        </dd>

        <dt className="text-ink-muted">Teléfono</dt>
        <dd>
          <a href={enlaceTelefono(cita.clienteTelefono)} className="inline-flex items-center gap-1.5 text-barbicide-dark hover:underline">
            <Phone className="size-3.5" />
            {formatoTelefono(cita.clienteTelefono)}
          </a>
        </dd>

        <dt className="text-ink-muted">Origen</dt>
        <dd>{ORIGEN[cita.origen]}</dd>

        {cita.notas && (
          <>
            <dt className="text-ink-muted">Notas</dt>
            <dd>{cita.notas}</dd>
          </>
        )}
      </dl>

      <table className="mt-5 w-full text-sm">
        <tbody>
          {cita.servicios.map((s) => (
            <tr key={s.servicioId} className="border-t border-cromo-soft">
              <td className="py-2">{s.nombre}</td>
              <td className="py-2 text-right text-ink-muted tabular">{formatoDuracion(s.duracionMin)}</td>
              <td className="w-24 py-2 text-right tabular">{formatoDinero(s.precio)}</td>
            </tr>
          ))}
          <tr className="border-t border-cromo font-semibold">
            <td className="py-2">Total</td>
            <td className="py-2 text-right text-ink-muted tabular">{formatoDuracion(duracion)}</td>
            <td className="py-2 text-right tabular">{formatoDinero(total)}</td>
          </tr>
        </tbody>
      </table>

      {cita.estado === 'EN_SILLA' && (
        <p className="mt-4 rounded-(--radius-control) bg-porcelana px-3 py-2 text-xs text-ink-muted">
          El cobro de la cita se registrará desde Caja cuando esté disponible (Fase 2).
        </p>
      )}
    </Modal>
  );
};
