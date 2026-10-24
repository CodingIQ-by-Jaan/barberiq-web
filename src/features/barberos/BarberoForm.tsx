import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { Button, Field, Input, Modal, Select, mensajeError, useToast } from '@/components/ui';
import { useCrearBarbero, useActualizarBarbero, useServicios } from '@/hooks/queries';
import type { Barbero } from '@/types';
import { PERIODO, TIPO_PAGO } from './pago';

const COLORES = ['#2F6FB0', '#2F7A4F', '#A8701A', '#7A2E2B', '#6B4FA0', '#13809C', '#B0476A', '#4A5A68'];

const schema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe el nombre'),
    telefono: z.string().trim().optional(),
    colorAgenda: z.string(),
    tipoPago: z.enum(['COMISION', 'RENTA_SILLA', 'MIXTO']),
    porcentajeComision: z.coerce.number<number>().min(0).max(100).optional(),
    montoRenta: z.coerce.number<number>().min(0).optional(),
    periodoRenta: z.enum(['SEMANAL', 'QUINCENAL', 'MENSUAL']).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.tipoPago !== 'RENTA_SILLA' && !d.porcentajeComision)
      ctx.addIssue({ code: 'custom', path: ['porcentajeComision'], message: 'Indica el porcentaje' });
    if (d.tipoPago !== 'COMISION' && !d.montoRenta)
      ctx.addIssue({ code: 'custom', path: ['montoRenta'], message: 'Indica el monto de la renta' });
  });
type Datos = z.infer<typeof schema>;

interface Props {
  barbero?: Barbero;
  ordenSugerido?: number;
  onCerrar: () => void;
}

export const BarberoForm = ({ barbero, ordenSugerido = 1, onCerrar }: Props) => {
  const toast = useToast();
  const navigate = useNavigate();
  const crear = useCrearBarbero();
  const actualizar = useActualizarBarbero();
  const { data: servicios = [] } = useServicios();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Datos>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: barbero?.nombre ?? '',
      telefono: barbero?.telefono ?? '',
      colorAgenda: barbero?.colorAgenda ?? COLORES[ordenSugerido % COLORES.length],
      tipoPago: barbero?.tipoPago ?? 'COMISION',
      porcentajeComision: barbero?.porcentajeComision ?? 50,
      montoRenta: barbero?.montoRenta ?? undefined,
      periodoRenta: barbero?.periodoRenta ?? 'SEMANAL',
    },
  });
  const tipo = watch('tipoPago');
  const color = watch('colorAgenda');

  const onSubmit = async (d: Datos) => {
    const pago = {
      tipoPago: d.tipoPago,
      porcentajeComision: d.tipoPago === 'RENTA_SILLA' ? null : d.porcentajeComision,
      montoRenta: d.tipoPago === 'COMISION' ? null : d.montoRenta,
      periodoRenta: d.tipoPago === 'COMISION' ? null : d.periodoRenta,
    };
    try {
      if (barbero) {
        await actualizar.mutateAsync({ id: barbero.id, datos: { nombre: d.nombre, telefono: d.telefono, colorAgenda: d.colorAgenda, ...pago } });
        toast.exito('Datos actualizados');
        onCerrar();
      } else {
        const nuevo = await crear.mutateAsync({
          nombre: d.nombre,
          telefono: d.telefono,
          colorAgenda: d.colorAgenda,
          ...pago,
          aceptaReservas: true,
          orden: ordenSugerido,
          servicioIds: servicios.map((s) => s.id),
        });
        toast.exito(`${nuevo.nombre} agregado. Ahora define su horario.`);
        navigate(`/app/barberos/${nuevo.id}`);
      }
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={barbero ? 'Editar barbero' : 'Nuevo barbero'}
      descripcion={barbero ? undefined : 'Después podrás definir su horario y los servicios que realiza.'}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} cargando={crear.isPending || actualizar.isPending}>
            {barbero ? 'Guardar cambios' : 'Agregar barbero'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Nombre" htmlFor="nombre" error={errors.nombre?.message}>
          <Input id="nombre" aria-invalid={!!errors.nombre} {...register('nombre')} />
        </Field>
        <Field label="Teléfono" htmlFor="tel">
          <Input id="tel" inputMode="numeric" placeholder="(555) 123-4567" {...register('telefono')} />
        </Field>

        <fieldset className="sm:col-span-2">
          <legend className="mb-1.5 text-sm font-medium text-ink-soft">Color en la agenda</legend>
          <div className="flex flex-wrap gap-2">
            {COLORES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setValue('colorAgenda', c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className="size-8 rounded-full ring-offset-2 aria-pressed:ring-2 aria-pressed:ring-ink"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </fieldset>

        <Field label="Forma de pago" htmlFor="tipo" className="sm:col-span-2">
          <Select id="tipo" {...register('tipoPago')}>
            {Object.entries(TIPO_PAGO).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        {tipo !== 'RENTA_SILLA' && (
          <Field label="Comisión (%)" htmlFor="pct" error={errors.porcentajeComision?.message} hint="Porcentaje de cada servicio que gana el barbero.">
            <Input id="pct" type="number" inputMode="decimal" {...register('porcentajeComision')} />
          </Field>
        )}
        {tipo !== 'COMISION' && (
          <>
            <Field label="Renta de silla ($)" htmlFor="renta" error={errors.montoRenta?.message}>
              <Input id="renta" type="number" inputMode="decimal" {...register('montoRenta')} />
            </Field>
            <Field label="Se paga" htmlFor="periodo">
              <Select id="periodo" {...register('periodoRenta')}>
                {Object.entries(PERIODO).map(([v, t]) => (
                  <option key={v} value={v}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
};
