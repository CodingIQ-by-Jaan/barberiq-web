import type { ReactNode } from 'react';

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  acciones?: ReactNode;
}

export const PageHeader = ({ titulo, descripcion, acciones }: PageHeaderProps) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="font-rotulo text-3xl leading-none md:text-4xl">{titulo}</h1>
      {descripcion && <p className="mt-2 max-w-prose text-sm text-ink-muted">{descripcion}</p>}
    </div>
    {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
  </div>
);
