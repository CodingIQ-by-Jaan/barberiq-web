import {
  BarChart3,
  CalendarDays,
  Gift,
  KeyRound,
  type LucideIcon,
  Package,
  Scissors,
  Settings,
  UserRound,
  Users,
  Wallet,
  WalletCards,
} from 'lucide-react';
import type { Rol } from '@/types';

export interface NavItem {
  to: string;
  texto: string;
  icono: LucideIcon;
  roles: Rol[];
  fase?: 2 | 3; // módulo aún no construido
}

const STAFF: Rol[] = ['DUENO', 'RECEPCION'];

export const NAV_PRINCIPAL: NavItem[] = [
  { to: '/app/agenda', texto: 'Agenda', icono: CalendarDays, roles: ['DUENO', 'RECEPCION', 'BARBERO'] },
  { to: '/app/clientes', texto: 'Clientes', icono: Users, roles: STAFF },
  { to: '/app/servicios', texto: 'Servicios', icono: Scissors, roles: STAFF },
  { to: '/app/barberos', texto: 'Barberos', icono: UserRound, roles: STAFF },
  { to: '/app/usuarios', texto: 'Usuarios', icono: KeyRound, roles: ['DUENO'] },
  { to: '/app/configuracion', texto: 'Configuración', icono: Settings, roles: ['DUENO'] },
];

export const NAV_PROXIMAMENTE: NavItem[] = [
  { to: '/app/caja', texto: 'Caja', icono: Wallet, roles: STAFF, fase: 2 },
  { to: '/app/comisiones', texto: 'Comisiones', icono: WalletCards, roles: ['DUENO', 'BARBERO'], fase: 3 },
  { to: '/app/fidelizacion', texto: 'Fidelización', icono: Gift, roles: ['DUENO'], fase: 3 },
  { to: '/app/inventario', texto: 'Inventario', icono: Package, roles: STAFF, fase: 3 },
  { to: '/app/reportes', texto: 'Reportes', icono: BarChart3, roles: ['DUENO'], fase: 3 },
];
