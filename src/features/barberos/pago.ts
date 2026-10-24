import { formatoDinero } from '@/lib/format';
import type { Barbero, PeriodoRenta, TipoPagoBarbero } from '@/types';

export const TIPO_PAGO: Record<TipoPagoBarbero, string> = {
  COMISION: 'Comisión',
  RENTA_SILLA: 'Renta de silla',
  MIXTO: 'Mixto',
};

export const PERIODO: Record<PeriodoRenta, string> = {
  SEMANAL: 'semanal',
  QUINCENAL: 'quincenal',
  MENSUAL: 'mensual',
};

/** "Comisión 50%" | "Renta $250 semanal" | "30% + renta $150 semanal" */
export const resumenPago = (b: Pick<Barbero, 'tipoPago' | 'porcentajeComision' | 'montoRenta' | 'periodoRenta'>): string => {
  const renta = b.montoRenta != null && b.periodoRenta ? `${formatoDinero(b.montoRenta)} ${PERIODO[b.periodoRenta]}` : '';
  if (b.tipoPago === 'COMISION') return `Comisión ${b.porcentajeComision ?? 0}%`;
  if (b.tipoPago === 'RENTA_SILLA') return `Renta ${renta}`;
  return `${b.porcentajeComision ?? 0}% + renta ${renta}`;
};
