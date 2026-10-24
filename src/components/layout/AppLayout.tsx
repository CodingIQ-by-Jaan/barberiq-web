import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router';
import { useBarberia } from '@/hooks/queries';
import { cn } from '@/lib/format';
import { Sidebar } from './Sidebar';

export const AppLayout = () => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { data: barberia } = useBarberia();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_1fr]">
      {/* Escritorio */}
      <aside className="sticky top-0 hidden h-dvh lg:block">
        <Sidebar />
      </aside>

      {/* Móvil */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-ink px-4 text-white lg:hidden">
        <button type="button" onClick={() => setMenuAbierto(true)} className="-ml-1 rounded-md p-1.5" aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
        <span className="font-rotulo text-lg">{barberia?.nombre ?? 'BarberIQ'}</span>
        <span className="w-7" />
      </header>
      <div
        className={cn('fixed inset-0 z-40 bg-ink/50 transition-opacity lg:hidden', menuAbierto ? 'opacity-100' : 'pointer-events-none opacity-0')}
        onClick={() => setMenuAbierto(false)}
        aria-hidden
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 transition-transform lg:hidden',
          menuAbierto ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-hidden={!menuAbierto}
      >
        <button
          type="button"
          onClick={() => setMenuAbierto(false)}
          className="absolute top-5 right-3 z-10 rounded-md p-1.5 text-white/60 hover:text-white"
          aria-label="Cerrar menú"
        >
          <X className="size-5" />
        </button>
        <Sidebar onNavegar={() => setMenuAbierto(false)} />
      </aside>

      <main className="min-w-0 px-4 py-6 md:px-8 md:py-8">
        <Outlet />
      </main>
    </div>
  );
};
