import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button, Field, Input, Modal, Textarea, Toggle, mensajeError, useToast } from '@/components/ui';
import { useGuardarServicio } from '@/hooks/queries';
import type { Servicio } from '@/types';

const schema = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre del servicio'),
  descripcion: z.string().trim().max(300).optional(),
  categoria: z.string().trim().max(40).optional(),
  duracionMin: z.coerce.number<number>().int().min(5, 'Mínimo 5 minutos').max(480),
  precio: z.coerce.number<number>().min(0, 'El precio no puede ser negativo'),
  visibleEnLinea: z.boolean(),
  orden: z.coerce.number<number>().int().min(0),
});
type Datos = z.infer<typeof schema>;

interface Props {
  servicio?: Servicio;
  ordenSugerido: number;
  onCerrar: () => void;
}

export const ServicioForm = ({ servicio, ordenSugerido, onCerrar }: Props) => {
  const toast = useToast();
  const guardar = useGuardarServicio();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Datos>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: servicio?.nombre ?? '',
      descripcion: servicio?.descripcion ?? '',
      categoria: servicio?.categoria ?? '',
      duracionMin: servicio?.duracionMin ?? 30,
      precio: servicio?.precio ?? 30,
      visibleEnLinea: servicio?.visibleEnLinea ?? true,
      orden: servicio?.orden ?? ordenSugerido,
    },
  });

  const onSubmit = async (datos: Datos) => {
    try {
      await guardar.mutateAsync({ id: servicio?.id, datos });
      toast.exito(servicio ? 'Servicio actualizado' : 'Servicio creado');
      onCerrar();
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={servicio ? 'Editar servicio' : 'Nuevo servicio'}
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)} cargando={guardar.isPending}>
            {servicio ? 'Guardar cambios' : 'Crear servicio'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Nombre" htmlFor="nombre" error={errors.nombre?.message} className="sm:col-span-2">
          <Input id="nombre" aria-invalid={!!errors.nombre} {...register('nombre')} />
        </Field>
        <Field label="Descripción" htmlFor="desc" hint="Se muestra en la página de reservas." className="sm:col-span-2">
          <Textarea id="desc" rows={2} {...register('descripcion')} />
        </Field>
        <Field label="Duración (minutos)" htmlFor="dur" error={errors.duracionMin?.message}>
          <Input id="dur" type="number" inputMode="numeric" step={5} {...register('duracionMin')} />
        </Field>
        <Field label="Precio ($)" htmlFor="precio" error={errors.precio?.message}>
          <Input id="precio" type="number" inputMode="decimal" step={1} {...register('precio')} />
        </Field>
        <Field label="Categoría" htmlFor="cat" hint="Ej.: Corte, Barba, Combo">
          <Input id="cat" {...register('categoria')} />
        </Field>
        <Field label="Orden en la lista" htmlFor="orden">
          <Input id="orden" type="number" inputMode="numeric" {...register('orden')} />
        </Field>
        <div className="sm:col-span-2">
          <Toggle
            etiqueta="Se puede reservar en línea"
            mostrarEtiqueta
            activo={watch('visibleEnLinea')}
            onCambiar={(v) => setValue('visibleEnLinea', v)}
          />
        </div>
        <button type="submit" hidden />
      </form>
    </Modal>
  );
};
