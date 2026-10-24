// Tipos de dominio — reflejan las respuestas de barberiq-api.
// Horas recurrentes como "HH:mm"; fechas puntuales como ISO string.

export type Rol = 'SUPER_ADMIN' | 'DUENO' | 'RECEPCION' | 'BARBERO';
export type TipoPagoBarbero = 'COMISION' | 'RENTA_SILLA' | 'MIXTO';
export type PeriodoRenta = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
export type EstadoCita = 'PENDIENTE' | 'CONFIRMADA' | 'EN_SILLA' | 'COMPLETADA' | 'CANCELADA' | 'NO_SE_PRESENTO';
export type OrigenCita = 'EN_LINEA' | 'RECEPCION' | 'WALK_IN';

export interface HorarioDia {
  diaSemana: number; // 0 = domingo
  abre: string;
  cierra: string;
  cerrado: boolean;
}

export interface Barberia {
  id: string;
  nombre: string;
  slug: string;
  telefono?: string | null;
  direccion?: string | null;
  logoUrl?: string | null;
  colorPrimario?: string | null;
  zonaHoraria: string; // IANA, ej. America/New_York
  impuestoProductosPct: number; // sales tax sobre productos
  intervaloReservaMin: number;
  anticipacionMinHoras: number;
  ventanaReservaDias: number;
  maxBarberos: number;
  horarios: HorarioDia[];
}

export interface Usuario {
  id: string;
  nombre: string;
  usuario: string; // nombre de usuario para iniciar sesión
  rol: Rol;
  barberiaId: string | null;
  barbero: { id: string } | null;
}

/** Usuario tal como lo ve el dueño en la pantalla de Usuarios. */
export interface CuentaUsuario {
  id: string;
  nombre: string;
  usuario: string;
  rol: Exclude<Rol, 'SUPER_ADMIN'>;
  activo: boolean;
  ultimoAcceso?: string | null;
  barbero: { id: string; nombre: string } | null;
}

export interface CrearUsuarioInput {
  nombre: string;
  usuario: string;
  password: string;
  rol: CuentaUsuario['rol'];
  barberoId?: string; // requerido si rol = BARBERO
}

export type ActualizarUsuarioInput = Partial<Pick<CuentaUsuario, 'nombre' | 'usuario' | 'activo'>> & {
  rol?: 'DUENO' | 'RECEPCION';
};

export interface Sesion {
  accessToken: string;
  usuario: Usuario;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  duracionMin: number;
  precio: number;
  visibleEnLinea: boolean;
  orden: number;
  activo: boolean;
}

export interface BloqueHorario {
  id?: string;
  diaSemana: number;
  inicio: string;
  fin: string;
}

export interface BarberoServicio {
  servicioId: string;
  precio?: number | null;
  duracionMin?: number | null;
  porcentajeComision?: number | null;
}

export interface Barbero {
  id: string;
  nombre: string;
  telefono?: string | null;
  fotoUrl?: string | null;
  colorAgenda: string;
  tipoPago: TipoPagoBarbero;
  porcentajeComision?: number | null;
  montoRenta?: number | null;
  periodoRenta?: PeriodoRenta | null;
  aceptaReservas: boolean;
  orden: number;
  activo: boolean;
  usuarioAcceso?: string | null; // nombre de usuario si el barbero tiene cuenta
  horarios: BloqueHorario[];
  servicios: BarberoServicio[];
}

export interface Bloqueo {
  id: string;
  barberoId: string;
  inicio: string;
  fin: string;
  motivo?: string | null;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email?: string | null;
  notas?: string | null;
  ultimaVisita?: string | null;
  totalVisitas: number;
  totalGastado: number;
}

export interface CitaServicio {
  servicioId: string;
  nombre: string;
  precio: number;
  duracionMin: number;
}

export interface Cita {
  id: string;
  barberoId: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  inicio: string;
  fin: string;
  estado: EstadoCita;
  origen: OrigenCita;
  notas?: string | null;
  servicios: CitaServicio[];
  tokenPublico: string;
}

export interface Slot {
  inicio: string; // ISO
  barberoIds: string[]; // barberos libres en ese horario
}

// ---- Inputs ---------------------------------------------------------------

export type ServicioInput = Omit<Servicio, 'id' | 'activo'>;

export type BarberoInput = Omit<Barbero, 'id' | 'activo' | 'horarios' | 'servicios' | 'usuarioAcceso'> & {
  servicioIds: string[];
};

export interface CrearCitaInput {
  barberoId: string;
  inicio: string;
  servicioIds: string[];
  cliente: { nombre: string; telefono: string };
  origen: OrigenCita;
  notas?: string;
}

export interface DisponibilidadQuery {
  fecha: string; // yyyy-MM-dd
  servicioIds: string[];
  barberoId?: string; // undefined = cualquiera
}
