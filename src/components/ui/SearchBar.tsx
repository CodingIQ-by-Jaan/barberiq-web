import { Search, X } from 'lucide-react';
import { cn } from '@/lib/format';

interface SearchBarProps {
  valor: string;
  onCambiar: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar = ({ valor, onCambiar, placeholder = 'Buscar', className }: SearchBarProps) => (
  <div className={cn('relative', className)}>
    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
    <input
      type="search"
      value={valor}
      onChange={(e) => onCambiar(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 w-full rounded-(--radius-control) border border-cromo bg-white pr-9 pl-9 text-sm placeholder:text-ink-muted/70 focus:border-barbicide focus:ring-2 focus:ring-barbicide/20 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
    />
    {valor && (
      <button
        type="button"
        onClick={() => onCambiar('')}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-muted hover:text-ink"
        aria-label="Limpiar búsqueda"
      >
        <X className="size-4" />
      </button>
    )}
  </div>
);
