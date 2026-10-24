/**
 * Cálculo de horarios disponibles — misma lógica que tendrá el módulo
 * `disponibilidad` de la API (ver docs/arquitectura.md). Aquí lo usa el mock.
 */
import type { Barberia, Barbero, Bloqueo, Cita, EstadoCita, Servicio, Slot } from '@/types';
import { fechaConMinutos, hhmmToMin } from './time';

export const ESTADOS_ACTIVOS: EstadoCita[] = ['PENDIENTE', 'CONFIRMADA', 'EN_SILLA'];

interface Intervalo {
  ini: number; // minutos
  fin: number;
}

/** Intersección de dos listas de intervalos. */
const intersectar = (a: Intervalo[], b: Intervalo[]): Intervalo[] =>
  a.flatMap((x) =>
    b
      .map((y) => ({ ini: Math.max(x.ini, y.ini), fin: Math.min(x.fin, y.fin) }))
      .filter((i) => i.ini < i.fin),
  );

/** Resta `ocupados` de `libres`. */
const restar = (libres: Intervalo[], ocupados: Intervalo[]): Intervalo[] =>
  ocupados.reduce(
    (acc, o) =>
      acc.flatMap((l) => {
        if (o.fin <= l.ini || o.ini >= l.fin) return [l];
        return [
          ...(o.ini > l.ini ? [{ ini: l.ini, fin: o.ini }] : []),
          ...(o.fin < l.fin ? [{ ini: o.fin, fin: l.fin }] : []),
        ];
      }),
    libres,
  );

/** Proyecta un rango de fechas sobre el día `fecha` en minutos. */
const aMinutosDelDia = (fecha: Date, inicio: Date, fin: Date): Intervalo | null => {
  const diaIni = fechaConMinutos(fecha, 0).getTime();
  const diaFin = diaIni + 24 * 60 * 60_000;
  const ini = Math.max(inicio.getTime(), diaIni);
  const end = Math.min(fin.getTime(), diaFin);
  if (ini >= end) return null;
  return { ini: Math.round((ini - diaIni) / 60_000), fin: Math.round((end - diaIni) / 60_000) };
};

/** Duración total de los servicios para un barbero (respeta su override). */
export const duracionPara = (barbero: Barbero, servicios: Servicio[]): number =>
  servicios.reduce((total, s) => {
    const override = barbero.servicios.find((bs) => bs.servicioId === s.id)?.duracionMin;
    return total + (override ?? s.duracionMin);
  }, 0);

export const haceTodos = (barbero: Barbero, servicioIds: string[]): boolean =>
  servicioIds.every((id) => barbero.servicios.some((bs) => bs.servicioId === id));

/** Ventanas libres (minutos) de un barbero en una fecha. */
export const ventanasLibres = (
  fecha: Date,
  barberia: Barberia,
  barbero: Barbero,
  bloqueos: Bloqueo[],
  citas: Cita[],
): Intervalo[] => {
  const dia = fecha.getDay();
  const local = barberia.horarios.find((h) => h.diaSemana === dia);
  if (!local || local.cerrado) return [];

  const turnos = barbero.horarios
    .filter((h) => h.diaSemana === dia)
    .map((h) => ({ ini: hhmmToMin(h.inicio), fin: hhmmToMin(h.fin) }));

  const abiertos = intersectar(turnos, [{ ini: hhmmToMin(local.abre), fin: hhmmToMin(local.cierra) }]);

  const ocupados = [
    ...bloqueos.filter((b) => b.barberoId === barbero.id),
    ...citas.filter((c) => c.barberoId === barbero.id && ESTADOS_ACTIVOS.includes(c.estado)),
  ]
    .map((r) => aMinutosDelDia(fecha, new Date(r.inicio), new Date(r.fin)))
    .filter((i): i is Intervalo => i !== null);

  return restar(abiertos, ocupados);
};

interface CalcularParams {
  fecha: Date;
  ahora?: Date;
  barberia: Barberia;
  barberos: Barbero[];
  servicios: Servicio[]; // los elegidos
  bloqueos: Bloqueo[];
  citas: Cita[];
  barberoId?: string;
}

/** Slots disponibles; cada slot indica qué barberos pueden atenderlo. */
export const calcularSlots = ({
  fecha,
  ahora = new Date(),
  barberia,
  barberos,
  servicios,
  bloqueos,
  citas,
  barberoId,
}: CalcularParams): Slot[] => {
  if (!servicios.length) return [];
  const ids = servicios.map((s) => s.id);
  const minimo = ahora.getTime() + barberia.anticipacionMinHoras * 60 * 60_000;
  const paso = barberia.intervaloReservaMin;

  const candidatos = barberos
    .filter((b) => b.activo && b.aceptaReservas && haceTodos(b, ids))
    .filter((b) => !barberoId || b.id === barberoId)
    .sort((a, b) => a.orden - b.orden);

  const porInicio = new Map<number, string[]>();

  candidatos.forEach((barbero) => {
    const duracion = duracionPara(barbero, servicios);
    ventanasLibres(fecha, barberia, barbero, bloqueos, citas).forEach(({ ini, fin }) => {
      // Alinear al intervalo de reserva
      for (let t = Math.ceil(ini / paso) * paso; t + duracion <= fin; t += paso) {
        if (fechaConMinutos(fecha, t).getTime() < minimo) continue;
        porInicio.set(t, [...(porInicio.get(t) ?? []), barbero.id]);
      }
    });
  });

  return [...porInicio.entries()]
    .sort(([a], [b]) => a - b)
    .map(([t, barberoIds]) => ({ inicio: fechaConMinutos(fecha, t).toISOString(), barberoIds }));
};
