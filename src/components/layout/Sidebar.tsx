import { ExternalLink, LogOut } from 'lucide-react';
import { NavLink } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { Avatar } from '@/components/ui';
import { useBarberia } from '@/hooks/queries';
import { cn } from '@/lib/format';
import { NAV_PRINCIPAL, NAV_PROXIMAMENTE, type NavItem } from './nav';

const ROL_TEXTO = { SUPER_ADMIN: 'Administrador', DUENO: 'Dueño', RECEPCION: 'Recepción', BARBERO: 'Barbero' };

const Enlace = ({ item, onNavegar }: { item: NavItem; onNavegar?: () => void }) => (
  <NavLink
    to={item.to}
    onClick={onNavegar}
    className={({ isActive }) =>
      cn(
        'group flex items-center gap-3 rounded-(--radius-control) px-3 py-2 text-sm transition-colors',
        isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/65 hover:bg-white/5 hover:text-white',
        item.fase && !isActive && 'text-white/40',
      )
    }
  >
    {({ isActive }) => (
      <>
        <item.icono className={cn('size-4.5', isActive ? 'text-[#5fc3d9]' : '')} strokeWidth={isActive ? 2.25 : 1.75} />
        <span className="flex-1">{item.texto}</span>
        {item.fase && <span className="text-[11px] text-white/40">Fase {item.fase}</span>}
      </>
    )}
  </NavLink>
);

export const Sidebar = ({ onNavegar }: { onNavegar?: () => void }) => {
  const { sesion, logout, tieneRol } = useAuth();
  const { data: barberia } = useBarberia();
  const visibles = (items: NavItem[]) => items.filter((i) => tieneRol(...i.roles));
  const proximos = visibles(NAV_PROXIMAMENTE);

  return (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className="px-5 pt-6 pb-5">
        <p className="font-rotulo text-2xl leading-none">{barberia?.nombre ?? 'BarberIQ'}</p>
        <p className="mt-1.5 text-xs text-white/45">BarberIQ · CodingIQ</p>
      </div>

      <nav aria-label="Principal" className="flex-1 space-y-6 overflow-y-auto px-3">
        <div className="space-y-0.5">
          {visibles(NAV_PRINCIPAL).map((i) => (
            <Enlace key={i.to} item={i} onNavegar={onNavegar} />
          ))}
        </div>
        {proximos.length > 0 && (
          <div className="space-y-0.5">
            <p className="px-3 pb-1 text-xs text-white/35">En camino</p>
            {proximos.map((i) => (
              <Enlace key={i.to} item={i} onNavegar={onNavegar} />
            ))}
          </div>
        )}
      </nav>

      {barberia && tieneRol('DUENO', 'RECEPCION') && (
        <a
          href={`/b/${barberia.slug}`}
          target="_blank"
          rel="noreferrer"
          className="mx-3 mb-3 flex items-center justify-between rounded-(--radius-control) border border-white/10 px-3 py-2.5 text-sm text-white/75 hover:border-white/25 hover:text-white"
        >
          Ver página de reservas
          <ExternalLink className="size-4" />
        </a>
      )}

      {sesion && (
        <div className="flex items-center gap-3 border-t border-white/10 px-4 py-4">
          <Avatar nombre={sesion.usuario.nombre} color="#13809C" tamano="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{sesion.usuario.nombre}</p>
            <p className="text-xs text-white/45">{ROL_TEXTO[sesion.usuario.rol]}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
};
