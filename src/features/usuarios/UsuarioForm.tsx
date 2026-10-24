import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button, Field, Input, Modal, Select, Toggle, mensajeError, useToast } from '@/components/ui';
import { useActualizarUsuario, useBarberos, useCrearUsuario, useResetPassword, useUsuarios } from '@/hooks/queries';
import { cn } from '@/lib/format';
import type { CuentaUsuario } from '@/types';
import { ROL_INFO, ROLES_ORDEN } from './roles';

const USUARIO_REGEX = /^[a-z0-9._-]{3,30}$/;

/** "Carlos Mejía" → "carlos.mejia" */
const sugerirUsuario = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('.')
    .replace(/[^a-z0-9._-]/g, '');

/** Contraseña fácil de dictar: 4 letras + 4 números (sin caracteres ambiguos). */
const generarPassword = () => {
  const letras = 'abcdefghjkmnpqrstuvwxyz';
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  return `${Array.from({ length: 4 }, () => pick(letras)).join('')}${Math.floor(1000 + Math.random() * 9000)}`;
};

interface Props {
  /** Si viene, se edita; si no, se crea. */
  cuenta?: CuentaUsuario;
  /** Preseleccionar rol barbero y su perfil (desde el detalle del barbero). */
  barberoId?: string;
  propio?: boolean;
  onCerrar: () => void;
}

export const UsuarioForm = ({ cuenta, barberoId: barberoInicial, propio = false, onCerrar }: Props) => {
  const toast = useToast();
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const reset = useResetPassword();
  const { data: barberos = [] } = useBarberos();
  const { data: cuentas = [] } = useUsuarios();
  const editando = !!cuenta;

  const barberoPre = barberos.find((b) => b.id === barberoInicial);
  const [nombre, setNombre] = useState(cuenta?.nombre ?? barberoPre?.nombre ?? '');
  const [usuario, setUsuario] = useState(cuenta?.usuario ?? (barberoPre ? sugerirUsuario(barberoPre.nombre) : ''));
  const [usuarioTocado, setUsuarioTocado] = useState(editando || !!barberoPre);
  const [rol, setRol] = useState<CuentaUsuario['rol']>(cuenta?.rol ?? (barberoInicial ? 'BARBERO' : 'RECEPCION'));
  const [barberoId, setBarberoId] = useState(barberoInicial ?? '');
  const [password, setPassword] = useState(editando ? '' : generarPassword());
  const [verPassword, setVerPassword] = useState(!editando);
  const [activo, setActivo] = useState(cuenta?.activo ?? true);
  const [intentado, setIntentado] = useState(false);

  // Si se abrió desde el detalle del barbero y la lista llegó después, completar datos
  useEffect(() => {
    if (!barberoPre || editando) return;
    setNombre((n) => n || barberoPre.nombre);
    setUsuario((u) => u || sugerirUsuario(barberoPre.nombre));
  }, [barberoPre, editando]);

  // Barberos que todavía no tienen usuario
  const sinCuenta = useMemo(
    () => barberos.filter((b) => !cuentas.some((c) => c.barbero?.id === b.id)),
    [barberos, cuentas],
  );

  const usuarioNorm = usuario.trim().toLowerCase();
  const errores = {
    nombre: nombre.trim().length >= 2 ? undefined : 'Escribe el nombre',
    usuario: !USUARIO_REGEX.test(usuarioNorm)
      ? 'De 3 a 30 caracteres: letras, números, punto o guion, sin espacios'
      : cuentas.some((c) => c.usuario === usuarioNorm && c.id !== cuenta?.id)
        ? 'Ese usuario ya está en uso'
        : undefined,
    password: editando
      ? password && password.length < 6
        ? 'Mínimo 6 caracteres'
        : undefined
      : password.length >= 6
        ? undefined
        : 'Mínimo 6 caracteres',
    barbero: !editando && rol === 'BARBERO' && !barberoId ? 'Elige a qué barbero pertenece' : undefined,
  };
  const valido = Object.values(errores).every((e) => !e);

  const elegirBarbero = (id: string) => {
    setBarberoId(id);
    const b = barberos.find((x) => x.id === id);
    if (b && !nombre.trim()) setNombre(b.nombre);
    if (b && !usuarioTocado) setUsuario(sugerirUsuario(b.nombre));
  };

  const guardar = async () => {
    setIntentado(true);
    if (!valido) return;
    try {
      if (cuenta) {
        await actualizar.mutateAsync({
          id: cuenta.id,
          datos: {
            nombre: nombre.trim(),
            usuario: usuarioNorm,
            activo,
            ...(cuenta.rol !== 'BARBERO' && rol !== 'BARBERO' ? { rol } : {}),
          },
        });
        if (password) await reset.mutateAsync({ id: cuenta.id, password });
        toast.exito(password ? 'Usuario actualizado y contraseña cambiada' : 'Usuario actualizado');
      } else {
        await crear.mutateAsync({
          nombre: nombre.trim(),
          usuario: usuarioNorm,
          password,
          rol,
          ...(rol === 'BARBERO' ? { barberoId } : {}),
        });
        toast.exito(`Usuario ${usuarioNorm} creado`);
      }
      onCerrar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const ocupado = crear.isPending || actualizar.isPending || reset.isPending;

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={editando ? `Editar a ${cuenta.nombre}` : 'Nuevo usuario'}
      descripcion={editando ? `Usuario: ${cuenta.usuario}` : 'Comparte el usuario y la contraseña con la persona para que pueda entrar.'}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar} cargando={ocupado}>
            {editando ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Rol */}
        {(!editando || cuenta.rol !== 'BARBERO') && (
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-ink-soft">Qué puede hacer</legend>
            <div className="grid gap-2">
              {ROLES_ORDEN.filter((r) => !editando || r !== 'BARBERO').map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={rol === r}
                  disabled={propio && r !== 'DUENO'}
                  onClick={() => setRol(r)}
                  className={cn(
                    'rounded-(--radius-control) border px-3 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    rol === r ? 'border-barbicide bg-espuma/60' : 'border-cromo hover:border-ink-muted',
                  )}
                >
                  <span className="block text-sm font-semibold">{ROL_INFO[r].texto}</span>
                  <span className="block text-xs text-ink-muted">{ROL_INFO[r].descripcion}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {!editando && rol === 'BARBERO' && (
          <Field
            label="Barbero"
            htmlFor="barbero"
            error={intentado ? errores.barbero : undefined}
            hint={sinCuenta.length ? 'Solo aparecen los barberos que aún no tienen usuario.' : undefined}
          >
            {sinCuenta.length ? (
              <Select id="barbero" value={barberoId} onChange={(e) => elegirBarbero(e.target.value)}>
                <option value="">Elige un barbero</option>
                {sinCuenta.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="rounded-(--radius-control) bg-porcelana px-3 py-2.5 text-sm text-ink-muted">
                Todos los barberos ya tienen usuario. Agrega primero al barbero en la pantalla Barberos.
              </p>
            )}
          </Field>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" htmlFor="nombre" error={intentado ? errores.nombre : undefined}>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                if (!usuarioTocado) setUsuario(sugerirUsuario(e.target.value));
              }}
            />
          </Field>
          <Field label="Usuario" htmlFor="usuario" error={intentado || usuarioTocado ? errores.usuario : undefined}>
            <Input
              id="usuario"
              value={usuario}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={(e) => {
                setUsuarioTocado(true);
                setUsuario(e.target.value.toLowerCase().replace(/\s/g, ''));
              }}
            />
          </Field>
        </div>

        <Field
          label={editando ? 'Nueva contraseña' : 'Contraseña'}
          htmlFor="password"
          error={intentado ? errores.password : undefined}
          hint={editando ? 'Déjala vacía para no cambiarla.' : 'Generada automáticamente; puedes cambiarla.'}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="password"
                type={verPassword ? 'text' : 'password'}
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 tabular"
              />
              <button
                type="button"
                onClick={() => setVerPassword((v) => !v)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink"
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {verPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <Button
              variante="secundario"
              onClick={() => {
                setPassword(generarPassword());
                setVerPassword(true);
              }}
            >
              <RefreshCw className="size-4" /> Generar
            </Button>
          </div>
        </Field>

        {editando && !propio && <Toggle etiqueta="Puede entrar al sistema" mostrarEtiqueta activo={activo} onCambiar={setActivo} />}
      </div>
    </Modal>
  );
};
