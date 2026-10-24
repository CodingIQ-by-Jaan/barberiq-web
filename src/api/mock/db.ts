import { crearSeed, MOCK_VERSION, type MockDb } from './seed';

const KEY = 'barberiq:mock-db';

const cargar = (): MockDb => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as MockDb;
      if (data.version === MOCK_VERSION) return data;
    }
  } catch {
    // localStorage no disponible o corrupto: se regenera
  }
  return crearSeed();
};

let db: MockDb = cargar();

const guardar = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // sin persistencia: la demo sigue funcionando en memoria
  }
};
guardar();

export const getDb = (): MockDb => db;

/** Aplica una mutación y persiste. */
export const mutar = <T,>(fn: (db: MockDb) => T): T => {
  const resultado = fn(db);
  guardar();
  return resultado;
};

/** Regenera los datos de demostración (botón en Configuración). */
export const reiniciarDemo = () => {
  db = crearSeed();
  guardar();
};

/** Latencia simulada para que los estados de carga se vean reales. */
export const latencia = <T,>(valor: T, ms = 180 + Math.random() * 220): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(valor)), ms));

export class MockError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export const falla = (message: string, status = 400, ms = 200): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(new MockError(message, status)), ms));
