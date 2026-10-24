import type { CuentaUsuario } from '@/types';
import type { Tono } from '@/components/ui';

type RolBarberia = CuentaUsuario['rol'];

export const ROLES_ORDEN: RolBarberia[] = ['BARBERO', 'RECEPCION', 'DUENO'];

export const ROL_INFO: Record<RolBarberia, { texto: string; descripcion: string; tono: Tono }> = {
  BARBERO: { texto: 'Barbero', descripcion: 'Ve solo su agenda y maneja sus propios bloqueos.', tono: 'primario' },
  RECEPCION: { texto: 'Recepción', descripcion: 'Agenda citas para todos y consulta clientes, servicios y barberos.', tono: 'aviso' },
  DUENO: { texto: 'Dueño', descripcion: 'Acceso completo, incluida la configuración y los usuarios.', tono: 'exito' },
};
