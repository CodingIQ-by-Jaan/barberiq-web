import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api';
import type { Api } from '@/api/types';
import type { ActualizarUsuarioInput, DisponibilidadQuery, EstadoCita } from '@/types';

export const qk = {
  barberia: ['barberia'] as const,
  servicios: (inactivos = false) => ['servicios', { inactivos }] as const,
  barberos: (inactivos = false) => ['barberos', { inactivos }] as const,
  barbero: (id: string) => ['barberos', id] as const,
  clientes: ['clientes'] as const,
  usuarios: ['usuarios'] as const,
  citas: (desde: string, hasta: string) => ['citas', desde, hasta] as const,
  bloqueos: (desde: string, hasta: string) => ['bloqueos', desde, hasta] as const,
  disponibilidad: (q: DisponibilidadQuery) => ['disponibilidad', q] as const,
};

// ---- Lecturas ---------------------------------------------------------------

export const useBarberia = () => useQuery({ queryKey: qk.barberia, queryFn: api.barberia.obtener });

export const useServicios = (incluirInactivos = false) =>
  useQuery({ queryKey: qk.servicios(incluirInactivos), queryFn: () => api.servicios.listar(incluirInactivos) });

export const useBarberos = (incluirInactivos = false) =>
  useQuery({ queryKey: qk.barberos(incluirInactivos), queryFn: () => api.barberos.listar(incluirInactivos) });

export const useBarbero = (id: string) =>
  useQuery({ queryKey: qk.barbero(id), queryFn: () => api.barberos.obtener(id), enabled: !!id });

export const useUsuarios = () => useQuery({ queryKey: qk.usuarios, queryFn: api.usuarios.listar });

export const useClientes = () => useQuery({ queryKey: qk.clientes, queryFn: api.clientes.listar });

export const useCitas = (desde: string, hasta: string) =>
  useQuery({ queryKey: qk.citas(desde, hasta), queryFn: () => api.citas.listar(desde, hasta) });

export const useBloqueos = (desde: string, hasta: string) =>
  useQuery({ queryKey: qk.bloqueos(desde, hasta), queryFn: () => api.barberos.listarBloqueos(desde, hasta) });

export const useDisponibilidad = (q: DisponibilidadQuery, enabled = true) =>
  useQuery({
    queryKey: qk.disponibilidad(q),
    queryFn: () => api.citas.disponibilidad(q),
    enabled: enabled && q.servicioIds.length > 0,
  });

// ---- Escrituras -------------------------------------------------------------

/** Mutación que invalida las claves indicadas al terminar. */
const useMutacion = <TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>, invalidar: string[]) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => Promise.all(invalidar.map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
};

type Args<F extends (...a: never[]) => unknown> = Parameters<F>;

export const useGuardarServicio = () =>
  useMutacion(
    ({ id, datos }: { id?: string; datos: Args<Api['servicios']['crear']>[0] }) =>
      id ? api.servicios.actualizar(id, datos) : api.servicios.crear(datos),
    ['servicios', 'barberos'],
  );

export const useToggleServicio = () =>
  useMutacion(({ id, activo }: { id: string; activo: boolean }) => api.servicios.actualizar(id, { activo }), ['servicios']);

export const useCrearBarbero = () => useMutacion(api.barberos.crear, ['barberos']);

export const useActualizarBarbero = () =>
  useMutacion(
    ({ id, datos }: { id: string; datos: Args<Api['barberos']['actualizar']>[1] }) => api.barberos.actualizar(id, datos),
    ['barberos', 'disponibilidad'],
  );

export const useHorariosBarbero = () =>
  useMutacion(
    ({ id, bloques }: { id: string; bloques: Args<Api['barberos']['reemplazarHorarios']>[1] }) =>
      api.barberos.reemplazarHorarios(id, bloques),
    ['barberos', 'disponibilidad'],
  );

export const useServiciosBarbero = () =>
  useMutacion(
    ({ id, servicios }: { id: string; servicios: Args<Api['barberos']['reemplazarServicios']>[1] }) =>
      api.barberos.reemplazarServicios(id, servicios),
    ['barberos', 'disponibilidad'],
  );

export const useActualizarBarberia = () => useMutacion(api.barberia.actualizar, ['barberia', 'disponibilidad']);
export const useHorarioBarberia = () => useMutacion(api.barberia.actualizarHorario, ['barberia', 'disponibilidad']);

export const useCrearCita = () => useMutacion(api.citas.crear, ['citas', 'clientes', 'disponibilidad']);

export const useEstadoCita = () =>
  useMutacion(
    ({ id, estado }: { id: string; estado: EstadoCita }) => api.citas.cambiarEstado(id, estado),
    ['citas', 'disponibilidad'],
  );

export const useCrearUsuario = () => useMutacion(api.usuarios.crear, ['usuarios', 'barberos']);

export const useActualizarUsuario = () =>
  useMutacion(
    ({ id, datos }: { id: string; datos: ActualizarUsuarioInput }) => api.usuarios.actualizar(id, datos),
    ['usuarios', 'barberos'],
  );

export const useResetPassword = () =>
  useMutacion(({ id, password }: { id: string; password: string }) => api.usuarios.resetPassword(id, password), []);
