import { mockApi } from './mock';
import type { Api } from './types';

/**
 * Punto único de acceso a datos.
 * VITE_USE_MOCK=true  → datos en el navegador (demo / desarrollo sin API).
 * VITE_USE_MOCK=false → cliente HTTP contra barberiq-api (pendiente: httpApi).
 */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

if (!USE_MOCK) {
  console.warn('[BarberIQ] httpApi aún no está implementado; usando datos mock.');
}

export const api: Api = mockApi;
export const usandoMock = true;
export type { Api };
