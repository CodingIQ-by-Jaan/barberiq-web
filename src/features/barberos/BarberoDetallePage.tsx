import { ArrowLeft, KeyRound, Pencil } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { HorarioSemanal } from '@/components/HorarioSemanal';
import { Avatar, Badge, Button, Cargando, Input, Panel, PanelHeader, Toggle, mensajeError, useToast } from '@/components/ui';
import { useActualizarBarbero, useBarberia, useBarbero, useHorariosBarbero, useServicios, useServiciosBarbero } from '@/hooks/queries';
import { formatoDinero, formatoTelefono } from '@/lib/format';
import { formatoDuracion } from '@/lib/time';
import type { BarberoServicio, BloqueHorario } from '@/types';
import { UsuarioForm } from '@/features/usuarios/UsuarioForm';
import { BarberoForm } from './BarberoForm';
import { resumenPago } from './pago';

export const BarberoDetallePage = () => {
  const { id = '' } = useParams();
  const { tieneRol } = useAuth();
  const esDueno = tieneRol('DUENO');
  const toast = useToast();
  const { data: barbero, isLoading } = useBarbero(id);
  const { data: barberia } = useBarberia();
  const { data: servicios = [] } = useServicios();
  const guardarHorario = useHorariosBarbero();
  const guardarServicios = useServiciosBarbero();
  const actualizar = useActualizarBarbero();

  const [editando, setEditando] = useState(false);
  const [creandoUsuario, setCreandoUsuario] = useState(false);
  const [bloques, setBloques] = useState<BloqueHorario[]>([]);
  const [asignados, setAsignados] = useState<BarberoServicio[]>([]);

  useEffect(() => {
    if (!barbero) return;
    setBloques(barbero.horarios);
    setAsignados(barbero.servicios);
  }, [barbero]);

  const horarioCambio = useMemo(() => JSON.stringify(bloques) !== JSON.stringify(barbero?.horarios ?? []), [bloques, barbero]);
  const serviciosCambio = useMemo(() => JSON.stringify(asignados) !== JSON.stringify(barbero?.servicios ?? []), [asignados, barbero]);

  if (isLoading || !barbero) return <Cargando />;

  const diasCerrados = barberia?.horarios.filter((h) => h.cerrado).map((h) => h.diaSemana) ?? [];

  const onGuardarHorario = async () => {
    try {
      await guardarHorario.mutateAsync({ id, bloques });
      toast.exito('Horario guardado');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const onGuardarServicios = async () => {
    try {
      await guardarServicios.mutateAsync({ id, servicios: asignados });
      toast.exito('Servicios guardados');
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  const alternarServicio = (servicioId: string) =>
    setAsignados((a) => (a.some((x) => x.servicioId === servicioId) ? a.filter((x) => x.servicioId !== servicioId) : [...a, { servicioId }]));

  const precioPropio = (servicioId: string, valor: string) =>
    setAsignados((a) => a.map((x) => (x.servicioId === servicioId ? { ...x, precio: valor === '' ? null : Number(valor) } : x)));

  const cambiarActivo = async (activo: boolean) => {
    try {
      await actualizar.mutateAsync({ id, datos: { activo } });
      toast.exito(activo ? `${barbero.nombre} reactivado` : `${barbero.nombre} desactivado`);
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <>
      <Link to="/app/barberos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Barberos
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar nombre={barbero.nombre} color={barbero.colorAgenda} tamano="lg" />
          <div>
            <h1 className="font-rotulo text-4xl leading-none">{barbero.nombre}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-ink-muted">
              {resumenPago(barbero)}
              {barbero.telefono && <span>{formatoTelefono(barbero.telefono)}</span>}
              {!barbero.activo && <Badge tono="peligro">Inactivo</Badge>}
            </p>
          </div>
        </div>
        {esDueno && (
          <div className="flex items-center gap-4">
            <Toggle etiqueta="Activo" mostrarEtiqueta activo={barbero.activo} onCambiar={cambiarActivo} />
            <Button variante="secundario" onClick={() => setEditando(true)}>
              <Pencil className="size-4" /> Editar datos
            </Button>
          </div>
        )}
      </div>

      <Panel className="mb-6">
        <div className="flex flex-wrap items-center gap-4 px-5 py-4">
          <KeyRound className="size-5 shrink-0 text-barbicide" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Acceso al sistema</p>
            <p className="text-sm text-ink-muted">
              {barbero.usuarioAcceso ? (
                <>
                  Entra con el usuario <code className="font-semibold text-ink">{barbero.usuarioAcceso}</code> y ve solo su agenda.
                </>
              ) : (
                'Aún no tiene usuario. Créale uno para que vea su agenda desde su celular.'
              )}
            </p>
          </div>
          {esDueno &&
            (barbero.usuarioAcceso ? (
              <Link to="/app/usuarios" className="text-sm font-medium text-barbicide-dark hover:underline">
                Administrar en Usuarios
              </Link>
            ) : (
              <Button tamano="sm" onClick={() => setCreandoUsuario(true)}>
                Crear usuario
              </Button>
            ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <Panel>
          <PanelHeader
            titulo="Horario semanal"
            descripcion="Las reservas solo se ofrecen dentro de estos turnos."
            acciones={
              esDueno &&
              horarioCambio && (
                <Button tamano="sm" onClick={onGuardarHorario} cargando={guardarHorario.isPending}>
                  Guardar horario
                </Button>
              )
            }
          />
          <div className="px-5 py-2">
            <HorarioSemanal bloques={bloques} onCambiar={setBloques} disabled={!esDueno} diasCerrados={diasCerrados} />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            titulo="Servicios que realiza"
            descripcion="Deja el precio vacío para usar el del catálogo."
            acciones={
              esDueno &&
              serviciosCambio && (
                <Button tamano="sm" onClick={onGuardarServicios} cargando={guardarServicios.isPending}>
                  Guardar servicios
                </Button>
              )
            }
          />
          <ul className="divide-y divide-cromo-soft">
            {servicios.map((s) => {
              const asignado = asignados.find((a) => a.servicioId === s.id);
              return (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <Toggle etiqueta={`${barbero.nombre} realiza ${s.nombre}`} activo={!!asignado} disabled={!esDueno} onCambiar={() => alternarServicio(s.id)} />
                  <div className="min-w-0 flex-1">
                    <p className={asignado ? 'font-medium' : 'text-ink-muted'}>{s.nombre}</p>
                    <p className="text-xs text-ink-muted tabular">
                      {formatoDuracion(s.duracionMin)}, catálogo {formatoDinero(s.precio)}
                    </p>
                  </div>
                  {asignado && (
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder={String(s.precio)}
                      value={asignado.precio ?? ''}
                      disabled={!esDueno}
                      onChange={(e) => precioPropio(s.id, e.target.value)}
                      className="h-9 w-24 text-right tabular"
                      aria-label={`Precio de ${s.nombre} con ${barbero.nombre}`}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      {editando && <BarberoForm barbero={barbero} onCerrar={() => setEditando(false)} />}
      {creandoUsuario && <UsuarioForm barberoId={barbero.id} onCerrar={() => setCreandoUsuario(false)} />}
    </>
  );
};
