import { Plus, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import {
  Avatar,
  Badge,
  Button,
  Cargando,
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  Toggle,
  mensajeError,
  useToast,
  type Columna,
} from '@/components/ui';
import { useActualizarBarbero, useBarberos } from '@/hooks/queries';
import { DIAS_CORTOS, ORDEN_SEMANA } from '@/lib/time';
import type { Barbero } from '@/types';
import { BarberoForm } from './BarberoForm';
import { resumenPago } from './pago';

const diasQueTrabaja = (b: Barbero) => {
  const dias = ORDEN_SEMANA.filter((d) => b.horarios.some((h) => h.diaSemana === d));
  return dias.length ? dias.map((d) => DIAS_CORTOS[d]).join(' ') : 'Sin horario';
};

export const BarberosPage = () => {
  const { tieneRol } = useAuth();
  const esDueno = tieneRol('DUENO');
  const navigate = useNavigate();
  const toast = useToast();
  const [nuevo, setNuevo] = useState(false);
  const { data, isLoading } = useBarberos(true);
  const actualizar = useActualizarBarbero();

  const toggleReservas = async (b: Barbero, v: boolean) => {
    try {
      await actualizar.mutateAsync({ id: b.id, datos: { aceptaReservas: v } });
      toast.exito(v ? `${b.nombre} aparece en la página de reservas` : `${b.nombre} ya no aparece en la página de reservas`);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const columnas: Columna<Barbero>[] = [
    {
      key: 'nombre',
      header: 'Barbero',
      cell: (b) => (
        <div className="flex items-center gap-3">
          <Avatar nombre={b.nombre} color={b.colorAgenda} />
          <div>
            <p className="font-semibold text-ink">{b.nombre}</p>
            {!b.activo && <Badge>Inactivo</Badge>}
          </div>
        </div>
      ),
    },
    { key: 'pago', header: 'Pago', cell: (b) => resumenPago(b), ocultarEnMovil: true },
    { key: 'dias', header: 'Trabaja', cell: (b) => <span className="text-ink-soft">{diasQueTrabaja(b)}</span>, ocultarEnMovil: true },
    { key: 'serv', header: 'Servicios', cell: (b) => <span className="tabular">{b.servicios.length}</span>, align: 'right' },
    {
      key: 'reservas',
      header: 'Reservas en línea',
      align: 'center',
      cell: (b) => (
        <Toggle
          etiqueta={`Reservas en línea de ${b.nombre}`}
          activo={b.aceptaReservas}
          disabled={!esDueno || !b.activo}
          onCambiar={(v) => toggleReservas(b, v)}
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Barberos"
        descripcion="Cada barbero tiene su columna en la agenda, su horario y su forma de pago."
        acciones={
          esDueno && (
            <Button onClick={() => setNuevo(true)}>
              <Plus className="size-4" /> Agregar barbero
            </Button>
          )
        }
      />
      <Panel>
        {isLoading ? (
          <Cargando />
        ) : (
          <DataTable
            columnas={columnas}
            filas={data ?? []}
            rowKey={(b) => b.id}
            onRowClick={(b) => navigate(`/app/barberos/${b.id}`)}
            filaApagada={(b) => !b.activo}
            vacio={<EmptyState icono={UserRound} titulo="Aún no hay barberos" texto="Agrega al primero para empezar a recibir citas." />}
          />
        )}
      </Panel>
      {nuevo && <BarberoForm ordenSugerido={(data?.length ?? 0) + 1} onCerrar={() => setNuevo(false)} />}
    </>
  );
};
