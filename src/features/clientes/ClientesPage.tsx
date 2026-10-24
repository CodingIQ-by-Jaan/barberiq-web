import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Cargando, DataTable, EmptyState, PageHeader, Panel, SearchBar, type Columna } from '@/components/ui';
import { useClientes } from '@/hooks/queries';
import { cn, formatoDinero, formatoTelefono } from '@/lib/format';
import type { Cliente } from '@/types';

const DIAS_SIN_VOLVER = 28;

const diasDesde = (iso?: string | null) => (iso ? (Date.now() - new Date(iso).getTime()) / 86_400_000 : Infinity);

export const ClientesPage = () => {
  const { data, isLoading } = useClientes();
  const [busqueda, setBusqueda] = useState('');

  const filas = useMemo(() => {
    const q = busqueda.toLowerCase().replace(/-/g, '').trim();
    return (data ?? []).filter((c) => c.nombre.toLowerCase().includes(q) || c.telefono.includes(q));
  }, [data, busqueda]);

  const columnas: Columna<Cliente>[] = [
    { key: 'nombre', header: 'Cliente', cell: (c) => <span className="font-semibold text-ink">{c.nombre}</span> },
    { key: 'tel', header: 'Teléfono', cell: (c) => <span className="tabular">{formatoTelefono(c.telefono)}</span> },
    { key: 'visitas', header: 'Visitas', cell: (c) => <span className="tabular">{c.totalVisitas}</span>, align: 'right' },
    {
      key: 'gastado',
      header: 'Total gastado',
      cell: (c) => <span className="tabular">{formatoDinero(c.totalGastado)}</span>,
      align: 'right',
      ocultarEnMovil: true,
    },
    {
      key: 'ultima',
      header: 'Última visita',
      align: 'right',
      cell: (c) => {
        if (!c.ultimaVisita) return <span className="text-ink-muted">Sin visitas</span>;
        const tarde = diasDesde(c.ultimaVisita) > DIAS_SIN_VOLVER;
        return (
          <span className={cn(tarde && 'font-medium text-ambar')}>
            hace {formatDistanceToNowStrict(new Date(c.ultimaVisita), { locale: es })}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Clientes"
        descripcion={`Se registran solos al reservar o agendar. En ámbar, quienes llevan más de ${DIAS_SIN_VOLVER} días sin volver.`}
      />
      <Panel>
        <div className="border-b border-cromo-soft px-4 py-3">
          <SearchBar valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre o teléfono" className="w-full sm:w-80" />
        </div>
        {isLoading ? (
          <Cargando />
        ) : (
          <DataTable
            columnas={columnas}
            filas={filas}
            rowKey={(c) => c.id}
            vacio={
              <EmptyState
                icono={Users}
                titulo={busqueda ? 'Nadie coincide con la búsqueda' : 'Aún no hay clientes'}
                texto={busqueda ? 'Revisa el nombre o el número.' : 'Aparecerán aquí con su primera cita.'}
              />
            }
          />
        )}
        <p className="border-t border-cromo-soft px-4 py-3 text-xs text-ink-muted">
          Historial por cliente, notas y fotos de cortes llegan con la Fase 2.
        </p>
      </Panel>
    </>
  );
};
