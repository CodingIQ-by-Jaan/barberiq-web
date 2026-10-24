/**
 * Datos de demostración. Se generan una vez y se guardan en localStorage.
 * Las citas se crean alrededor de "hoy" para que la agenda siempre luzca viva.
 */
import { addDays, startOfDay } from 'date-fns';
import { ventanasLibres } from '@/lib/disponibilidad';
import { fechaConMinutos } from '@/lib/time';
import type { Barberia, Barbero, Bloqueo, Cita, Cliente, EstadoCita, Rol, Servicio } from '@/types';

export interface UsuarioMock {
  id: string;
  nombre: string;
  usuario: string;
  password: string; // en claro solo porque es demo; la API guarda hash bcrypt
  activo: boolean;
  ultimoAcceso?: string | null;
  rol: Rol;
  barberoId: string | null;
}

export interface MockDb {
  version: number;
  barberia: Barberia;
  usuarios: UsuarioMock[];
  servicios: Servicio[];
  barberos: Barbero[];
  bloqueos: Bloqueo[];
  clientes: Cliente[];
  citas: Cita[];
}

export const MOCK_VERSION = 3; // v3: login con usuario (sin correo)
export const DEMO_PASSWORD = 'Demo123!';

// PRNG determinista para que la demo sea estable entre recargas del seed
const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const id = (prefijo: string, n: number) => `${prefijo}-${String(n).padStart(4, '0')}`;

const servicios: Servicio[] = [
  { id: id('srv', 1), nombre: 'Corte clásico', categoria: 'Corte', duracionMin: 30, precio: 30, visibleEnLinea: true, orden: 1, activo: true, descripcion: 'Tijera o máquina, lavado y peinado.' },
  { id: id('srv', 2), nombre: 'Corte + barba', categoria: 'Combo', duracionMin: 50, precio: 45, visibleEnLinea: true, orden: 2, activo: true, descripcion: 'Corte completo con perfilado de barba y toalla caliente.' },
  { id: id('srv', 3), nombre: 'Arreglo de barba', categoria: 'Barba', duracionMin: 20, precio: 20, visibleEnLinea: true, orden: 3, activo: true, descripcion: 'Perfilado con navaja.' },
  { id: id('srv', 4), nombre: 'Corte niño', categoria: 'Corte', duracionMin: 25, precio: 25, visibleEnLinea: true, orden: 4, activo: true, descripcion: 'Menores de 12 años.' },
  { id: id('srv', 5), nombre: 'Diseño y líneas', categoria: 'Corte', duracionMin: 15, precio: 10, visibleEnLinea: true, orden: 5, activo: true, descripcion: 'Agregado a cualquier corte.' },
  { id: id('srv', 6), nombre: 'Tinte', categoria: 'Tratamiento', duracionMin: 60, precio: 60, visibleEnLinea: false, orden: 6, activo: true, descripcion: 'Solo agendado en local.' },
];

const todosLosServicios = servicios.map((s) => ({ servicioId: s.id }));
const semana = (dias: number[], inicio: string, fin: string) => dias.map((diaSemana) => ({ diaSemana, inicio, fin }));

const barberos: Barbero[] = [
  {
    id: id('bar', 1),
    nombre: 'Carlos Mejía',
    telefono: '7135550134',
    colorAgenda: '#2F6FB0',
    tipoPago: 'COMISION',
    porcentajeComision: 50,
    aceptaReservas: true,
    orden: 1,
    activo: true,
    usuarioAcceso: 'carlos',
    horarios: [...semana([1, 2, 3, 4, 5, 6], '08:00', '12:00'), ...semana([1, 2, 3, 4, 5, 6], '13:00', '19:00')],
    servicios: todosLosServicios,
  },
  {
    id: id('bar', 2),
    nombre: 'Luis Zelaya',
    telefono: '7135550178',
    colorAgenda: '#2F7A4F',
    tipoPago: 'RENTA_SILLA',
    montoRenta: 250,
    periodoRenta: 'SEMANAL',
    aceptaReservas: true,
    orden: 2,
    activo: true,
    horarios: [...semana([2, 3, 4, 5], '11:00', '19:00'), ...semana([6], '10:00', '20:00')],
    servicios: todosLosServicios.filter((s) => s.servicioId !== id('srv', 4)),
  },
  {
    id: id('bar', 3),
    nombre: 'Mario Castillo',
    telefono: '7135550192',
    colorAgenda: '#A8701A',
    tipoPago: 'MIXTO',
    porcentajeComision: 30,
    montoRenta: 150,
    periodoRenta: 'SEMANAL',
    aceptaReservas: true,
    orden: 3,
    activo: true,
    horarios: [...semana([1, 2, 3, 4, 5], '08:00', '16:00'), ...semana([6], '08:00', '14:00')],
    servicios: [1, 4, 5].map((n) => ({ servicioId: id('srv', n) })),
  },
];

const nombresClientes = [
  ['José Rodríguez', '7135551000'],
  ['Kevin Martínez', '7135551037'],
  ['Andrés Hernández', '7135551074'],
  ['Luis Fernando Paz', '7135551111'],
  ['Erick Flores', '7135551148'],
  ['Josué Banegas', '7135551185'],
  ['Daniel Rivera', '7135551222'],
  ['Marvin Cruz', '7135551259'],
  ['Óscar Ramírez', '7135551296'],
  ['Brayan López', '7135551333'],
  ['Mateo Aguilar', '7135551370'],
  ['Fernando Reyes', '7135551407'],
  ['Allan Sánchez', '7135551444'],
  ['Elvin Turcios', '7135551481'],
];

export const crearSeed = (): MockDb => {
  const rnd = mulberry32(20261005);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
  const hoy = startOfDay(new Date());
  const ahora = new Date();

  const barberia: Barberia = {
    id: 'brb-0001',
    nombre: 'Barbería Demo',
    slug: 'barberia-demo',
    telefono: '7135550100',
    direccion: '123 Main St',
    colorPrimario: '#13809C',
    zonaHoraria: 'America/New_York',
    impuestoProductosPct: 0,
    intervaloReservaMin: 15,
    anticipacionMinHoras: 1,
    ventanaReservaDias: 30,
    maxBarberos: 10,
    horarios: [0, 1, 2, 3, 4, 5, 6].map((diaSemana) => ({
      diaSemana,
      abre: '08:00',
      cierra: diaSemana === 6 ? '20:00' : '19:00',
      cerrado: diaSemana === 0,
    })),
  };

  const clientes: Cliente[] = nombresClientes.map(([nombre, telefono], i) => ({
    id: id('cli', i + 1),
    nombre,
    telefono,
    totalVisitas: 0,
    totalGastado: 0,
  }));

  const bloqueos: Bloqueo[] = [
    {
      id: id('blq', 1),
      barberoId: id('bar', 2),
      inicio: fechaConMinutos(hoy, 15 * 60).toISOString(),
      fin: fechaConMinutos(hoy, 16 * 60).toISOString(),
      motivo: 'Permiso personal',
    },
  ];

  const citas: Cita[] = [];
  let n = 1;

  for (let offset = -4; offset <= 7; offset++) {
    const dia = addDays(hoy, offset);
    barberos.forEach((barbero) => {
      const disponibles = servicios.filter((s) => s.visibleEnLinea && barbero.servicios.some((bs) => bs.servicioId === s.id));
      ventanasLibres(dia, barberia, barbero, bloqueos, []).forEach(({ ini, fin }) => {
        // Más ocupado hoy y días cercanos; huecos aleatorios
        const ocupacion = offset < 0 ? 0.7 : offset === 0 ? 0.65 : Math.max(0.2, 0.55 - offset * 0.05);
        let t = ini;
        while (t < fin) {
          const servicio = pick(disponibles);
          if (t + servicio.duracionMin > fin) break;
          if (rnd() < ocupacion) {
            const inicio = fechaConMinutos(dia, t);
            const finCita = fechaConMinutos(dia, t + servicio.duracionMin);
            const cliente = pick(clientes);
            let estado: EstadoCita;
            if (finCita <= ahora) estado = rnd() < 0.08 ? 'NO_SE_PRESENTO' : rnd() < 0.05 ? 'CANCELADA' : 'COMPLETADA';
            else if (inicio <= ahora) estado = 'EN_SILLA';
            else estado = rnd() < 0.8 ? 'CONFIRMADA' : 'PENDIENTE';

            citas.push({
              id: id('cit', n++),
              barberoId: barbero.id,
              clienteId: cliente.id,
              clienteNombre: cliente.nombre,
              clienteTelefono: cliente.telefono,
              inicio: inicio.toISOString(),
              fin: finCita.toISOString(),
              estado,
              origen: rnd() < 0.55 ? 'EN_LINEA' : rnd() < 0.7 ? 'RECEPCION' : 'WALK_IN',
              servicios: [{ servicioId: servicio.id, nombre: servicio.nombre, precio: servicio.precio, duracionMin: servicio.duracionMin }],
              tokenPublico: crypto.randomUUID(),
            });

            if (estado === 'COMPLETADA') {
              cliente.totalVisitas += 1;
              cliente.totalGastado += servicio.precio;
              if (!cliente.ultimaVisita || cliente.ultimaVisita < inicio.toISOString()) {
                cliente.ultimaVisita = inicio.toISOString();
              }
            }
            t += servicio.duracionMin;
          } else {
            t += barberia.intervaloReservaMin * (1 + Math.floor(rnd() * 3));
          }
        }
      });
    });
  }

  const usuarios: UsuarioMock[] = [
    { id: id('usr', 1), nombre: 'Yiminson', usuario: 'dueno', password: DEMO_PASSWORD, activo: true, rol: 'DUENO', barberoId: null },
    { id: id('usr', 2), nombre: 'Recepción', usuario: 'recepcion', password: DEMO_PASSWORD, activo: true, rol: 'RECEPCION', barberoId: null },
    { id: id('usr', 3), nombre: 'Carlos Mejía', usuario: 'carlos', password: DEMO_PASSWORD, activo: true, rol: 'BARBERO', barberoId: id('bar', 1) },
  ];

  return { version: MOCK_VERSION, barberia, usuarios, servicios, barberos, bloqueos, clientes, citas };
};
