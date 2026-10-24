import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { KeyRound, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { Badge, Button, Cargando, DataTable, EmptyState, PageHeader, Panel, type Columna } from '@/components/ui';
import { useUsuarios } from '@/hooks/queries';
import type { CuentaUsuario } from '@/types';
import { ROL_INFO } from './roles';
import { UsuarioForm } from './UsuarioForm';

export const UsuariosPage = () => {
  const { sesion } = useAuth();
  const { data, isLoading } = useUsuarios();
  const [editando, setEditando] = useState<CuentaUsuario | 'nuevo' | null>(null);

  const columnas: Columna<CuentaUsuario>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (u) => (
        <div>
          <p className="font-semibold text-ink">
            {u.nombre}
            {u.id === sesion?.usuario.id && <span className="ml-2 text-xs font-normal text-ink-muted">(tú)</span>}
          </p>
          {u.barbero && u.barbero.nombre !== u.nombre && <p className="text-xs text-ink-muted">Barbero: {u.barbero.nombre}</p>}
        </div>
      ),
    },
    { key: 'usuario', header: 'Usuario', cell: (u) => <code className="text-sm">{u.usuario}</code> },
    { key: 'rol', header: 'Rol', cell: (u) => <Badge tono={ROL_INFO[u.rol].tono}>{ROL_INFO[u.rol].texto}</Badge> },
    {
      key: 'acceso',
      header: 'Último acceso',
      ocultarEnMovil: true,
      cell: (u) =>
        u.ultimoAcceso ? (
          `hace ${formatDistanceToNowStrict(new Date(u.ultimoAcceso), { locale: es })}`
        ) : (
          <span className="text-ink-muted">Nunca</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      align: 'right',
      cell: (u) => (u.activo ? <Badge tono="exito">Activo</Badge> : <Badge>Sin acceso</Badge>),
    },
  ];

  return (
    <>
      <PageHeader
        titulo="Usuarios"
        descripcion="Quién puede entrar al sistema y qué puede hacer. Cada persona entra con su usuario y contraseña."
        acciones={
          <Button onClick={() => setEditando('nuevo')}>
            <Plus className="size-4" /> Nuevo usuario
          </Button>
        }
      />
      <Panel>
        {isLoading ? (
          <Cargando />
        ) : (
          <DataTable
            columnas={columnas}
            filas={data ?? []}
            rowKey={(u) => u.id}
            onRowClick={setEditando}
            filaApagada={(u) => !u.activo}
            vacio={<EmptyState icono={KeyRound} titulo="Aún no hay usuarios" texto="Crea uno para cada barbero y para recepción." />}
          />
        )}
      </Panel>

      {editando && (
        <UsuarioForm
          cuenta={editando === 'nuevo' ? undefined : editando}
          propio={editando !== 'nuevo' && editando.id === sesion?.usuario.id}
          onCerrar={() => setEditando(null)}
        />
      )}
    </>
  );
};
