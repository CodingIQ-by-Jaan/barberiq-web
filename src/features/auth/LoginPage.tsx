import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { useAuth } from '@/auth/AuthContext';
import { Button, Field, Input, mensajeError } from '@/components/ui';
import { DEMO_PASSWORD } from '@/api/mock/seed';

const schema = z.object({
  usuario: z.string().trim().min(3, 'Escribe tu usuario'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type Datos = z.infer<typeof schema>;

const CUENTAS_DEMO = [
  { usuario: 'dueno', rol: 'Dueño' },
  { usuario: 'recepcion', rol: 'Recepción' },
  { usuario: 'carlos', rol: 'Barbero' },
];

export const LoginPage = () => {
  const { sesion, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Datos>({ resolver: zodResolver(schema) });

  if (sesion) return <Navigate to="/app/agenda" replace />;

  const onSubmit = async ({ usuario, password }: Datos) => {
    setError(null);
    try {
      await login(usuario, password);
      navigate((location.state as { desde?: string } | null)?.desde ?? '/app/agenda', { replace: true });
    } catch (e) {
      setError(mensajeError(e));
    }
  };

  const usarDemo = (usuario: string) => {
    setValue('usuario', usuario, { shouldValidate: true });
    setValue('password', DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="text-sm text-white/50">CodingIQ</p>
        <div>
          <h1 className="font-rotulo text-[clamp(4rem,9vw,8.5rem)] leading-[0.85]">
            Barber
            <br />
            IQ
          </h1>
          <p className="mt-6 max-w-sm text-lg text-white/70">
            La agenda, los clientes y la caja de tu barbería, en un solo lugar.
          </p>
        </div>
        {/* Franjas de silla: detalle gráfico, no informativo */}
        <div aria-hidden className="absolute top-0 right-12 bottom-0 flex gap-3">
          {['#13809C', '#F5F7F7', '#7A2E2B'].map((c) => (
            <span key={c} className="w-3 opacity-80" style={{ backgroundColor: c }} />
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h2 className="font-rotulo text-3xl">Inicia sesión</h2>
          <p className="mt-1 text-sm text-ink-muted">Entra con el usuario y la contraseña que te dio el dueño de la barbería.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <Field label="Usuario" htmlFor="usuario" error={errors.usuario?.message}>
              <Input
                id="usuario"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                aria-invalid={!!errors.usuario}
                {...register('usuario')}
              />
            </Field>
            <Field label="Contraseña" htmlFor="password" error={errors.password?.message}>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...register('password')}
              />
            </Field>
            {error && <p className="rounded-(--radius-control) bg-cordoban-soft px-3 py-2 text-sm text-cordoban">{error}</p>}
            <Button type="submit" tamano="lg" className="w-full" cargando={isSubmitting}>
              Entrar
            </Button>
          </form>

          <div className="mt-10 border-t border-cromo pt-5">
            <p className="text-sm text-ink-muted">Cuentas de demostración</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CUENTAS_DEMO.map((c) => (
                <Button key={c.usuario} variante="secundario" tamano="sm" onClick={() => usarDemo(c.usuario)}>
                  {c.rol}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
