import { describe, expect, it } from 'vitest';
import { calcularSlots } from '@/lib/disponibilidad';
import { fechaConMinutos, minToHhmm, minutosDelDia } from '@/lib/time';
import type { Barberia, Barbero, Cita, Servicio } from '@/types';

// Mismos casos que barberiq-mobile/__tests__/logica.test.ts: lib/disponibilidad.ts es idéntico en ambos repos.

// Lunes 12 de octubre de 2026 (fecha fija, lejos de "ahora")
const LUNES = new Date(2026, 9, 12);
const AYER = new Date(2026, 9, 1);

const barberia: Barberia = {
  id: 'b1',
  nombre: 'Test',
  slug: 'test',
  zonaHoraria: 'America/New_York',
  impuestoProductosPct: 0,
  intervaloReservaMin: 15,
  anticipacionMinHoras: 0,
  ventanaReservaDias: 30,
  maxBarberos: 5,
  horarios: [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({ diaSemana, abre: '08:00', cierra: '19:00', cerrado: diaSemana === 0 })),
};

const corte: Servicio = { id: 's1', nombre: 'Corte', duracionMin: 30, precio: 30, visibleEnLinea: true, orden: 1, activo: true };

const barbero: Barbero = {
  id: 'x1',
  nombre: 'Carlos',
  colorAgenda: '#000',
  tipoPago: 'COMISION',
  porcentajeComision: 50,
  aceptaReservas: true,
  orden: 1,
  activo: true,
  horarios: [
    { diaSemana: 1, inicio: '09:00', fin: '12:00' },
    { diaSemana: 1, inicio: '13:00', fin: '15:00' },
  ],
  servicios: [{ servicioId: 's1' }],
};

const cita = (iniMin: number, finMin: number, estado: Cita['estado'] = 'CONFIRMADA'): Cita => ({
  id: `c${iniMin}`,
  barberoId: 'x1',
  clienteId: 'k',
  clienteNombre: 'Cliente',
  clienteTelefono: '7135550100',
  inicio: fechaConMinutos(LUNES, iniMin).toISOString(),
  fin: fechaConMinutos(LUNES, finMin).toISOString(),
  estado,
  origen: 'EN_LINEA',
  servicios: [],
  tokenPublico: 't',
});

// Formato 24 h: formatoHora usa Intl y su salida varía según la versión de Node.
const horas = (slots: { inicio: string }[]) => slots.map((s) => minToHhmm(minutosDelDia(new Date(s.inicio))));

describe('disponibilidad', () => {
  const base = { fecha: LUNES, ahora: AYER, barberia, barberos: [barbero], servicios: [corte], bloqueos: [] };

  it('respeta turnos partidos y la duración del servicio', () => {
    const slots = horas(calcularSlots({ ...base, citas: [] }));
    expect(slots[0]).toBe('09:00');
    expect(slots).toContain('11:30'); // 11:30–12:00 cabe
    expect(slots).not.toContain('11:45'); // se pasaría del turno
    expect(slots).not.toContain('12:00'); // descanso
    expect(slots).toContain('13:00');
  });

  it('excluye horarios ocupados por citas activas', () => {
    const slots = horas(calcularSlots({ ...base, citas: [cita(10 * 60, 10 * 60 + 30)] }));
    expect(slots).not.toContain('09:45'); // chocaría con la cita de 10:00
    expect(slots).not.toContain('10:00');
    expect(slots).toContain('10:30');
  });

  it('una cita cancelada libera su horario', () => {
    const slots = horas(calcularSlots({ ...base, citas: [cita(10 * 60, 10 * 60 + 30, 'CANCELADA')] }));
    expect(slots).toContain('10:00');
  });

  it('no ofrece nada en domingo (local cerrado)', () => {
    expect(calcularSlots({ ...base, fecha: new Date(2026, 9, 11), citas: [] })).toHaveLength(0);
  });
});
