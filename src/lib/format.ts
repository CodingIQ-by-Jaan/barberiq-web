import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: { classGroups: { 'font-family': ['font-rotulo', 'font-condensada'] } },
});

/** Une clases y resuelve conflictos de Tailwind (la última gana). */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const dolares = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 30 → "$30", 27.5 → "$27.50" (sin centavos si es exacto) */
export const formatoDinero = (monto: number): string => {
  const texto = dolares.format(monto);
  return texto.endsWith('.00') ? texto.slice(0, -3) : texto;
};

/** Solo los 10 dígitos de un número de EE. UU. (quita +1 / 1 inicial). */
export const limpiarTelefono = (tel: string): string => {
  const d = tel.replace(/\D/g, '');
  return d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
};

export const telefonoValido = (tel: string): boolean => /^\d{10}$/.test(limpiarTelefono(tel));

/** "5551234567" → "(555) 123-4567" */
export const formatoTelefono = (tel: string): string => {
  const d = limpiarTelefono(tel);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : tel;
};

/** Enlace tel: con código de país */
export const enlaceTelefono = (tel: string): string => `tel:+1${limpiarTelefono(tel)}`;

export const iniciales = (nombre: string): string =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const uid = (): string => crypto.randomUUID();
