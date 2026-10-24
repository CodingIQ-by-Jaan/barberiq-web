import { cn, iniciales } from '@/lib/format';

interface AvatarProps {
  nombre: string;
  color?: string;
  tamano?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tamanos = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-14 text-lg' };

export const Avatar = ({ nombre, color = '#5B6875', tamano = 'md', className }: AvatarProps) => (
  <span
    aria-hidden
    className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', tamanos[tamano], className)}
    style={{ backgroundColor: color }}
  >
    {iniciales(nombre)}
  </span>
);
