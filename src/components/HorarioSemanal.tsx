import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/format';
import { DIAS, hhmmToMin, ORDEN_SEMANA } from '@/lib/time';
import type { BloqueHorario } from '@/types';

interface Props {
  bloques: BloqueHorario[];
  onCambiar: (bloques: BloqueHorario[]) => void;
  disabled?: boolean;
  /** Días en que el local cierra: se muestran deshabilitados */
  diasCerrados?: number[];
}

const inputHora =
  'h-9 w-[7.75rem] rounded-(--radius-control) border border-cromo bg-white px-2 text-sm tabular focus:border-barbicide focus:ring-2 focus:ring-barbicide/20 focus:outline-none disabled:bg-cromo-soft';

/** Editor de turnos por día. Varios bloques por día = turno partido. */
export const HorarioSemanal = ({ bloques, onCambiar, disabled, diasCerrados = [] }: Props) => {
  const delDia = (d: number) => bloques.map((b, i) => ({ ...b, i })).filter((b) => b.diaSemana === d);

  const actualizar = (i: number, campo: 'inicio' | 'fin', valor: string) =>
    onCambiar(bloques.map((b, j) => (j === i ? { ...b, [campo]: valor } : b)));

  const agregar = (dia: number) => {
    const existentes = delDia(dia);
    const ultimo = existentes.at(-1);
    const nuevo = ultimo ? { diaSemana: dia, inicio: ultimo.fin, fin: '19:00' } : { diaSemana: dia, inicio: '08:00', fin: '17:00' };
    onCambiar([...bloques, nuevo]);
  };

  const quitar = (i: number) => onCambiar(bloques.filter((_, j) => j !== i));

  return (
    <ul className="divide-y divide-cromo-soft">
      {ORDEN_SEMANA.map((dia) => {
        const lista = delDia(dia);
        const cerradoLocal = diasCerrados.includes(dia);
        return (
          <li key={dia} className="grid gap-2 py-3 sm:grid-cols-[8rem_1fr] sm:items-start">
            <p className={cn('pt-2 text-sm font-semibold', !lista.length && 'text-ink-muted')}>{DIAS[dia]}</p>
            <div className="flex flex-col gap-2">
              {cerradoLocal ? (
                <p className="pt-2 text-sm text-ink-muted">La barbería cierra este día</p>
              ) : (
                <>
                  {!lista.length && <p className="pt-2 text-sm text-ink-muted">Libre</p>}
                  {lista.map((b) => {
                    const invalido = hhmmToMin(b.inicio) >= hhmmToMin(b.fin);
                    return (
                      <div key={b.i} className="flex flex-wrap items-center gap-2">
                        <input
                          type="time"
                          step={900}
                          value={b.inicio}
                          disabled={disabled}
                          onChange={(e) => actualizar(b.i, 'inicio', e.target.value)}
                          className={cn(inputHora, invalido && 'border-cordoban')}
                          aria-label={`${DIAS[dia]}: inicio`}
                        />
                        <span className="text-ink-muted">a</span>
                        <input
                          type="time"
                          step={900}
                          value={b.fin}
                          disabled={disabled}
                          onChange={(e) => actualizar(b.i, 'fin', e.target.value)}
                          className={cn(inputHora, invalido && 'border-cordoban')}
                          aria-label={`${DIAS[dia]}: fin`}
                        />
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => quitar(b.i)}
                            className="rounded-md p-1.5 text-ink-muted hover:bg-cordoban-soft hover:text-cordoban"
                            aria-label={`Quitar turno del ${DIAS[dia]}`}
                          >
                            <X className="size-4" />
                          </button>
                        )}
                        {invalido && <span className="text-xs text-cordoban">El inicio debe ser antes del fin</span>}
                      </div>
                    );
                  })}
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => agregar(dia)}
                      className="inline-flex w-fit items-center gap-1 text-sm font-medium text-barbicide-dark hover:underline"
                    >
                      <Plus className="size-3.5" />
                      {lista.length ? 'Agregar turno (ej. después de almuerzo)' : 'Agregar turno'}
                    </button>
                  )}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};
