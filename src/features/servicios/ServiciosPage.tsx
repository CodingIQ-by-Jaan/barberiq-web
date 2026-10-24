import { Plus, Scissors } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import {
  Badge,
  Button,
  Cargando,
  DataTable,
  EmptyState,
  PageHeader,
  Panel,
  SearchBar,
  Toggle,
  mensajeError,
  useToast,
  type Columna,
} from '@/components/ui';
import { useServicios, useToggleServicio } from '@/hooks/queries';
import { formatoDinero } from '@/lib/format';
import { formatoDuracion } from '@/lib/time';
import type { Servicio } from '@/types';
import { ServicioForm } from './ServicioForm';

export const ServiciosPage = () => {
  const { tieneRol } = useAuth();
  const esDueno = tieneRol('DUENO');
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [verInactivos, setVerInactivos] = useState(false);
  const [editando, setEditando] = useState<Servicio | 'nuevo' | null>(null);
  const { data, isLoading } = useServicios(true);
  const toggle = useToggleServicio();

  const filas = useMemo(
    () =>
      (data ?? [])
        .filter((s) => verInactivos || s.activo)
        .filter((s) => s.nombre.toLowerCase().includes(busqueda.toLowerCase().trim())),
    [data, verInactivos, busqueda],
  );

  const cambiarActivo = async (s: Servicio, activo: boolean) => {
    try {
      await toggle.mutateAsync({ id: s.id, activo });
      toast.exito(activo ? `${s.nombre} activado` : `${s.nombre} desactivado`);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const columnas: Columna<Servicio>[] = [
    {
      key: 'nombre',
      header: 'Servicio',
      cell: (s) => (
        <div>
          <p className="font-semibold text-ink">{s.nombre}</p>
          {s.descripcion && <p className="text-xs text-ink-muted">{s.descripcion}</p>}
        </div>
      ),
    },
    { key: 'cat', header: 'Categoría', cell: (s) => s.categoria ?? '—', ocultarEnMovil: true },
    { key: 'dur', header: 'Duración', cell: (s) => <span className="tabular">{formatoDuracion(s.duracionMin)}</span>, align: 'right' },
    { key: 'precio', header: 'Precio', cell: (s) => <span className="font-semibold tabular">{formatoDinero(s.precio)}</span>, align: 'right' },
    {
      key: 'linea',
      header: 'En línea',
      cell: (s) => (s.visibleEnLinea ? <Badge tono="primario">Sí</Badge> : <Badge>Solo en local</Badge>),
      ocultarEnMovil: true,
    },
    ...(esDueno
      ? [
          {
            key: 'activo',
            header: 'Activo',
            align: 'center' as const,
            cell: (s: Servicio) => (
              <Toggle etiqueta={`Activar ${s.nombre}`} activo={s.activo} onCambiar={(v) => cambiarActivo(s, v)} />
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        titulo="Servicios"
        descripcion="Lo que ofrece la barbería, con su precio y duración. La duración define cuánto espacio ocupa cada cita en la agenda."
        acciones={
          esDueno && (
            <Button onClick={() => setEditando('nuevo')}>
              <Plus className="size-4" /> Nuevo servicio
            </Button>
          )
        }
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cromo-soft px-4 py-3">
          <SearchBar valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar servicio" className="w-full sm:w-72" />
          <Toggle etiqueta="Mostrar inactivos" mostrarEtiqueta activo={verInactivos} onCambiar={setVerInactivos} />
        </div>
        {isLoading ? (
          <Cargando />
        ) : (
          <DataTable
            columnas={columnas}
            filas={filas}
            rowKey={(s) => s.id}
            onRowClick={esDueno ? setEditando : undefined}
            filaApagada={(s) => !s.activo}
            vacio={
              <EmptyState
                icono={Scissors}
                titulo={busqueda ? 'Ningún servicio coincide' : 'Aún no hay servicios'}
                texto={busqueda ? 'Prueba con otro nombre.' : 'Agrega el primero para que los clientes puedan reservar.'}
              />
            }
          />
        )}
      </Panel>

      {editando && (
        <ServicioForm
          servicio={editando === 'nuevo' ? undefined : editando}
          ordenSugerido={(data?.length ?? 0) + 1}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  );
};
