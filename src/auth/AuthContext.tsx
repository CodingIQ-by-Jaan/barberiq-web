import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/api';
import type { Rol, Sesion } from '@/types';

const KEY = 'barberiq:sesion';

interface AuthValue {
  sesion: Sesion | null;
  login: (usuario: string, password: string) => Promise<void>;
  logout: () => void;
  tieneRol: (...roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

const leerSesion = (): Sesion | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Sesion) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [sesion, setSesion] = useState<Sesion | null>(leerSesion);

  const login = useCallback(async (usuario: string, password: string) => {
    const nueva = await api.auth.login(usuario, password);
    try {
      localStorage.setItem(KEY, JSON.stringify(nueva));
    } catch {
      // sesión solo en memoria
    }
    setSesion(nueva);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // nada que limpiar
    }
    setSesion(null);
  }, []);

  const tieneRol = useCallback((...roles: Rol[]) => !!sesion && roles.includes(sesion.usuario.rol), [sesion]);

  const value = useMemo(() => ({ sesion, login, logout, tieneRol }), [sesion, login, logout, tieneRol]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
