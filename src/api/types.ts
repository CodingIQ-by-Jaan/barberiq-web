import type {
  ActualizarUsuarioInput,
  Barberia,
  Barbero,
  BarberoInput,
  BarberoServicio,
  BloqueHorario,
  Bloqueo,
  Cita,
  Cliente,
  CrearCitaInput,
  CrearUsuarioInput,
  CuentaUsuario,
  DisponibilidadQuery,
  EstadoCita,
  HorarioDia,
  Servicio,
  ServicioInput,
  Sesion,
  Slot,
} from '@/types';

/**
 * Contrato de datos de la web. Hoy lo implementa el mock (`mock/`);
 * mañana un cliente HTTP contra barberiq-api con las mismas firmas.
 */
export interface Api {
  auth: {
    login: (usuario: string, password: string) => Promise<Sesion>;
  };
  usuarios: {
    listar: () => Promise<CuentaUsuario[]>;
    crear: (datos: CrearUsuarioInput) => Promise<CuentaUsuario>;
    actualizar: (id: string, datos: ActualizarUsuarioInput) => Promise<CuentaUsuario>;
    resetPassword: (id: string, password: string) => Promise<void>;
  };
  barberia: {
    obtener: () => Promise<Barberia>;
    actualizar: (datos: Partial<Omit<Barberia, 'id' | 'slug' | 'horarios' | 'maxBarberos'>>) => Promise<Barberia>;
    actualizarHorario: (dias: HorarioDia[]) => Promise<Barberia>;
  };
  servicios: {
    listar: (incluirInactivos?: boolean) => Promise<Servicio[]>;
    crear: (datos: ServicioInput) => Promise<Servicio>;
    actualizar: (id: string, datos: Partial<Servicio>) => Promise<Servicio>;
    desactivar: (id: string) => Promise<Servicio>;
  };
  barberos: {
    listar: (incluirInactivos?: boolean) => Promise<Barbero[]>;
    obtener: (id: string) => Promise<Barbero>;
    crear: (datos: BarberoInput) => Promise<Barbero>;
    actualizar: (id: string, datos: Partial<Barbero>) => Promise<Barbero>;
    reemplazarHorarios: (id: string, bloques: BloqueHorario[]) => Promise<Barbero>;
    reemplazarServicios: (id: string, servicios: BarberoServicio[]) => Promise<Barbero>;
    listarBloqueos: (desde: string, hasta: string) => Promise<Bloqueo[]>;
  };
  clientes: {
    listar: () => Promise<Cliente[]>;
  };
  citas: {
    listar: (desde: string, hasta: string) => Promise<Cita[]>;
    crear: (datos: CrearCitaInput) => Promise<Cita>;
    cambiarEstado: (id: string, estado: EstadoCita) => Promise<Cita>;
    disponibilidad: (q: DisponibilidadQuery) => Promise<Slot[]>;
  };
  publico: {
    barberia: (slug: string) => Promise<Pick<Barberia, 'nombre' | 'slug' | 'telefono' | 'direccion' | 'horarios'>>;
    servicios: (slug: string) => Promise<Servicio[]>;
    barberos: (slug: string) => Promise<Pick<Barbero, 'id' | 'nombre' | 'colorAgenda' | 'fotoUrl' | 'servicios'>[]>;
    disponibilidad: (slug: string, q: DisponibilidadQuery) => Promise<Slot[]>;
    reservar: (slug: string, datos: Omit<CrearCitaInput, 'origen'>) => Promise<Cita>;
  };
}
