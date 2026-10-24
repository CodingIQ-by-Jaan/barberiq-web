import { createBrowserRouter, Navigate } from 'react-router';
import { RequireAuth, RequireRol } from '@/auth/guards';
import { AppLayout } from '@/components/layout/AppLayout';
import { AgendaPage } from '@/features/agenda/AgendaPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { BarberoDetallePage } from '@/features/barberos/BarberoDetallePage';
import { BarberosPage } from '@/features/barberos/BarberosPage';
import { ClientesPage } from '@/features/clientes/ClientesPage';
import { ConfiguracionPage } from '@/features/configuracion/ConfiguracionPage';
import { ProximamentePage } from '@/features/proximamente/ProximamentePage';
import { ReservaPage } from '@/features/reserva/ReservaPage';
import { ServiciosPage } from '@/features/servicios/ServiciosPage';
import { UsuariosPage } from '@/features/usuarios/UsuariosPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/agenda" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/b/:slug', element: <ReservaPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="agenda" replace /> },
          { path: 'agenda', element: <AgendaPage /> },
          {
            element: <RequireRol roles={['DUENO', 'RECEPCION']} />,
            children: [
              { path: 'clientes', element: <ClientesPage /> },
              { path: 'servicios', element: <ServiciosPage /> },
              { path: 'barberos', element: <BarberosPage /> },
              { path: 'barberos/:id', element: <BarberoDetallePage /> },
            ],
          },
          {
            element: <RequireRol roles={['DUENO']} />,
            children: [
              { path: 'usuarios', element: <UsuariosPage /> },
              { path: 'configuracion', element: <ConfiguracionPage /> },
            ],
          },
          { path: ':modulo', element: <ProximamentePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/app/agenda" replace /> },
]);
