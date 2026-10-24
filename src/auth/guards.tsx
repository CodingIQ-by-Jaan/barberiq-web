import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import type { Rol } from '@/types';
import { useAuth } from './AuthContext';

/** Requiere sesión; si no, manda a /login recordando a dónde iba. */
export const RequireAuth = () => {
  const { sesion } = useAuth();
  const location = useLocation();
  if (!sesion) return <Navigate to="/login" replace state={{ desde: location.pathname }} />;
  return <Outlet />;
};

/** Muestra el contenido solo a los roles indicados. */
export const RoleGate = ({ roles, children, fallback = null }: { roles: Rol[]; children: ReactNode; fallback?: ReactNode }) => {
  const { tieneRol } = useAuth();
  return tieneRol(...roles) ? <>{children}</> : <>{fallback}</>;
};

/** Ruta solo para ciertos roles; los demás vuelven a la agenda. */
export const RequireRol = ({ roles }: { roles: Rol[] }) => {
  const { tieneRol } = useAuth();
  return tieneRol(...roles) ? <Outlet /> : <Navigate to="/app/agenda" replace />;
};
