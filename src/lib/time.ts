/** "09:30" → 570 */
export const hhmmToMin = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** 570 → "09:30" */
export const minToHhmm = (min: number): string =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Minutos desde medianoche de una fecha local. */
export const minutosDelDia = (d: Date): number => d.getHours() * 60 + d.getMinutes();

/** Fecha local a las HH:mm (a partir de minutos). */
export const fechaConMinutos = (base: Date, min: number): Date => {
  const d = new Date(base);
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
};

/** "1:30 p. m." para la UI */
export const formatoHora = (iso: string | Date): string =>
  new Date(iso).toLocaleTimeString('es-US', { hour: 'numeric', minute: '2-digit' });

export const formatoDuracion = (min: number): string => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
};

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
/** Orden de semana laboral para mostrar (lunes primero). */
export const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];
