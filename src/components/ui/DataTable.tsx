import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export interface Columna<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  /** Ocultar en pantallas pequeñas */
  ocultarEnMovil?: boolean;
}

interface DataTableProps<T> {
  columnas: Columna<T>[];
  filas: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  vacio?: ReactNode;
  filaApagada?: (row: T) => boolean;
}

const alineacion = { left: 'text-left', right: 'text-right', center: 'text-center' };

export const DataTable = <T,>({ columnas, filas, rowKey, onRowClick, vacio, filaApagada }: DataTableProps<T>) => {
  if (!filas.length && vacio) return <>{vacio}</>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-cromo">
            {columnas.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'px-4 py-2.5 font-medium whitespace-nowrap text-ink-muted',
                  alineacion[c.align ?? 'left'],
                  c.ocultarEnMovil && 'hidden md:table-cell',
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={cn(
                'border-b border-cromo-soft last:border-0',
                onRowClick && 'cursor-pointer hover:bg-espuma/40 focus-visible:bg-espuma/40',
                filaApagada?.(row) && 'text-ink-muted',
              )}
            >
              {columnas.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-4 py-3 align-middle',
                    alineacion[c.align ?? 'left'],
                    c.ocultarEnMovil && 'hidden md:table-cell',
                    c.className,
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
