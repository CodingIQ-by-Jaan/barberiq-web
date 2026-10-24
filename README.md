# barberiq-web

Web de BarberIQ — React 19 · TypeScript · Vite 7 · Tailwind 4 · React Router 7 · TanStack Query.

Por ahora corre **100% local con datos mock** (no necesita la API).

## Correr en local

```bash
cp .env.example .env
npm install
npm run dev          # http://localhost:5173
```

### Qué probar

| Ruta | Qué es |
|------|--------|
| `/login` | Usuario y contraseña. Botones demo: `dueno`, `recepcion`, `carlos` (contraseña `Demo123!`) |
| `/app/agenda` | Agenda del día por barbero. Toca un espacio libre para agendar; toca una cita para cambiar su estado |
| `/app/servicios` | Catálogo con precio, duración y si se reserva en línea |
| `/app/barberos` · `/app/barberos/:id` | Forma de pago, horario semanal (turno partido) y servicios con precio propio |
| `/app/clientes` | Se crean solos al agendar; en ámbar los que no vuelven hace +28 días |
| `/app/usuarios` | El dueño crea usuarios para barberos, recepción u otros dueños; cambia contraseñas y quita accesos |
| `/app/configuracion` | Datos del local, horario, reglas de reserva, enlace público y **reiniciar datos demo** |
| `/b/barberia-demo` | Página pública de reservas (pensada para celular) |

Inicia como **Barbero** para ver que solo aparece su propia columna en la agenda.

## Datos mock

- Viven en `localStorage` del navegador (`barberiq:mock-db`) y se generan alrededor de **hoy**, así la agenda siempre tiene movimiento.
- La disponibilidad usa el mismo algoritmo que tendrá la API (`src/lib/disponibilidad.ts`): horario del local ∩ turnos del barbero − bloqueos − citas activas, con anticipación mínima solo para reservas públicas.
- Configuración → *Reiniciar datos de demostración* regenera todo.

## Estructura

```
src/
├── api/
│   ├── types.ts          contrato Api (mismas firmas que barberiq-api)
│   ├── mock/             implementación en el navegador (seed + localStorage)
│   └── index.ts          punto único: hoy exporta mockApi
├── auth/                 AuthContext, RequireAuth, RequireRol, RoleGate
├── hooks/queries.ts      hooks de TanStack Query (lecturas y mutaciones)
├── components/
│   ├── ui/               Button, Field/Input/Select/Textarea, Modal, ConfirmDialog,
│   │                     DataTable, SearchBar, Toggle, Badge, Avatar, Panel,
│   │                     PageHeader, EmptyState, Spinner, Toast
│   ├── layout/           AppLayout, Sidebar, nav (roles + módulos "en camino")
│   ├── ServicioChecklist.tsx   selector de servicios (agenda y reserva pública)
│   ├── SlotPicker.tsx          horarios libres por franja (agenda y reserva pública)
│   └── HorarioSemanal.tsx      editor de turnos por día
├── features/             una carpeta por pantalla
├── lib/                  disponibilidad, tiempo, formato (L, teléfono), cn
└── types/                tipos de dominio
```

## Conectar con la API (siguiente paso)

1. Crear `src/api/http/` implementando la interfaz `Api` con `fetch` a `VITE_API_URL`.
2. En `src/api/index.ts`: `export const api = USE_MOCK ? mockApi : httpApi;`
3. Poner `VITE_USE_MOCK=false` en `.env`.

Las pantallas no cambian: solo consumen `api` a través de `hooks/queries.ts`.

## Diseño

- **Paleta** tomada del oficio: azul *Barbicide* (primario), *cordobán* del cuero de las sillas (alertas, no-shows, línea de "ahora"), *porcelana* de azulejo (fondo), *cromo* (líneas).
- **Tipografía:** Archivo variable empaquetada (sin CDN). Títulos en ancho condensado tipo rótulo (`font-rotulo`), cuerpo en ancho normal, números tabulares para horas y montos.
- Tokens en `src/index.css` (`@theme`).
