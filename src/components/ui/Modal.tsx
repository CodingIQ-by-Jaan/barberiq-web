import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/format';

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg';
}

const anchos = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

/** Basado en <dialog>: foco atrapado y Esc nativos. */
export const Modal = ({ abierto, onCerrar, titulo, descripcion, children, pie, ancho = 'md' }: ModalProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-(--radius-panel) bg-white p-0 text-ink shadow-[0_24px_60px_-20px_rgb(23_33_43/0.45)] backdrop:bg-ink/45',
        anchos[ancho],
      )}
    >
      {abierto && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-cromo-soft px-5 pt-5 pb-4">
            <div>
              <h2 className="font-rotulo text-xl">{titulo}</h2>
              {descripcion && <p className="mt-0.5 text-sm text-ink-muted">{descripcion}</p>}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="-m-1 rounded-md p-1 text-ink-muted hover:bg-cromo-soft hover:text-ink"
              aria-label="Cerrar"
            >
              <X className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {pie && <footer className="flex justify-end gap-2 border-t border-cromo-soft bg-porcelana/60 px-5 py-3">{pie}</footer>}
        </div>
      )}
    </dialog>
  );
};
