import { CheckCircle2, XCircle } from 'lucide-react';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { cn } from '@/lib/format';

interface Toast {
  id: number;
  texto: string;
  tipo: 'exito' | 'error';
}

interface ToastValue {
  exito: (texto: string) => void;
  error: (texto: string) => void;
}

const ToastContext = createContext<ToastValue | null>(null);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((texto: string, tipo: Toast['tipo']) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, texto, tipo }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const value = {
    exito: useCallback((t: string) => mostrar(t, 'exito'), [mostrar]),
    error: useCallback((t: string) => mostrar(t, 'error'), [mostrar]),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-center gap-2 rounded-(--radius-control) px-4 py-3 text-sm font-medium text-white shadow-lg',
              t.tipo === 'exito' ? 'bg-ink' : 'bg-cordoban',
            )}
          >
            {t.tipo === 'exito' ? <CheckCircle2 className="size-4 text-espuma" /> : <XCircle className="size-4" />}
            {t.texto}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
};

/** Mensaje legible de cualquier error (MockError, Error, desconocido). */
export const mensajeError = (e: unknown): string => (e instanceof Error ? e.message : 'Algo salió mal. Intenta de nuevo.');
