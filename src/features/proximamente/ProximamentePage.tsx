import { Navigate, useParams } from 'react-router';
import { NAV_PROXIMAMENTE } from '@/components/layout/nav';
import { PageHeader, Panel } from '@/components/ui';

const DETALLE: Record<string, string[]> = {
  caja: [
    'Cobro de servicios y productos desde la cita',
    'Efectivo, tarjeta, Zelle, Cash App y Venmo, incluso combinados',
    'Propinas por barbero, también con tarjeta',
    'Sales tax en la venta de productos',
    'Apertura y cierre de caja con diferencia contada',
  ],
  comisiones: [
    'Cálculo semanal o quincenal automático por barbero',
    'Comisión, renta de silla o mixto',
    'Adelantos y bonos antes de cerrar el periodo',
    'Reporte de pago en PDF',
  ],
  fidelizacion: ['Tarjeta de sellos digital', 'Membresías mensuales', 'Cupones y descuentos', 'Seguimiento de clientes frecuentes'],
  inventario: ['Productos de venta y de uso interno', 'Entradas, salidas y ajustes', 'Alerta de existencias bajas'],
  reportes: ['Ventas por día, semana y mes', 'Rendimiento por barbero y servicio', 'Citas completadas contra no presentadas', 'Exportación a PDF'],
};

export const ProximamentePage = () => {
  const { modulo = '' } = useParams();
  const item = NAV_PROXIMAMENTE.find((i) => i.to.endsWith(`/${modulo}`));
  if (!item) return <Navigate to="/app/agenda" replace />;

  return (
    <>
      <PageHeader titulo={item.texto} descripcion={`Este módulo se entrega en la Fase ${item.fase}.`} />
      <Panel className="max-w-2xl">
        <div className="flex items-start gap-4 px-6 py-6">
          <item.icono className="mt-1 size-8 shrink-0 text-barbicide" strokeWidth={1.5} />
          <div>
            <h2 className="font-semibold">Qué vas a poder hacer</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {(DETALLE[modulo] ?? []).map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-barbicide" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </>
  );
};
