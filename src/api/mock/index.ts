import { calcularSlots, haceTodos, ventanasLibres } from '@/lib/disponibilidad';
import { uid } from '@/lib/format';
import { hhmmToMin, minutosDelDia } from '@/lib/time';
import type { Barbero, Cita, CrearCitaInput, CuentaUsuario, DisponibilidadQuery } from '@/types';
import type { Api } from '../types';
import { falla, getDb, latencia, mutar } from './db';
import type { MockDb, UsuarioMock } from './seed';

const USUARIO_REGEX = /^[a-z0-9._-]{3,30}$/;
const MENSAJE_USUARIO = 'El usuario debe tener de 3 a 30 caracteres: letras, números, punto, guion o guion bajo, sin espacios';
export const normalizarUsuario = (u: string) => u.trim().toLowerCase();

const aCuenta = (u: UsuarioMock): CuentaUsuario => {
  const barbero = getDb().barberos.find((b) => b.id === u.barberoId);
  return {
    id: u.id,
    nombre: u.nombre,
    usuario: u.usuario,
    rol: u.rol as CuentaUsuario['rol'],
    activo: u.activo,
    ultimoAcceso: u.ultimoAcceso ?? null,
    barbero: barbero ? { id: barbero.id, nombre: barbero.nombre } : null,
  };
};

const fechaLocal = (yyyyMMdd: string) => {
  const [y, m, d] = yyyyMMdd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Público: respeta la anticipación mínima.
 * Interno (recepción): permite agendar desde el bloque actual (walk-ins).
 */
const slotsPara = (db: MockDb, q: DisponibilidadQuery, publico: boolean) =>
  calcularSlots({
    fecha: fechaLocal(q.fecha),
    ahora: publico
      ? new Date()
      : new Date(Date.now() - (db.barberia.anticipacionMinHoras * 60 + db.barberia.intervaloReservaMin) * 60_000),
    barberia: db.barberia,
    barberos: db.barberos,
    servicios: db.servicios.filter((s) => q.servicioIds.includes(s.id) && s.activo && (!publico || s.visibleEnLinea)),
    bloqueos: db.bloqueos,
    citas: db.citas,
    barberoId: q.barberoId,
  });

/** Crea la cita validando que el hueco siga libre (como hará la API en transacción). */
const crearCita = (datos: CrearCitaInput, validarAnticipacion: boolean): Promise<Cita> => {
  const db = getDb();
  const barbero = db.barberos.find((b) => b.id === datos.barberoId && b.activo);
  if (!barbero) return falla('Barbero no encontrado', 404);
  if (!haceTodos(barbero, datos.servicioIds)) return falla(`${barbero.nombre} no realiza todos los servicios elegidos`);

  const servicios = db.servicios.filter((s) => datos.servicioIds.includes(s.id));
  const items = servicios.map((s) => {
    const o = barbero.servicios.find((bs) => bs.servicioId === s.id);
    return { servicioId: s.id, nombre: s.nombre, precio: o?.precio ?? s.precio, duracionMin: o?.duracionMin ?? s.duracionMin };
  });
  const duracion = items.reduce((t, s) => t + s.duracionMin, 0);
  const inicio = new Date(datos.inicio);
  const fin = new Date(inicio.getTime() + duracion * 60_000);

  if (validarAnticipacion && inicio.getTime() < Date.now() + db.barberia.anticipacionMinHoras * 3_600_000) {
    return falla(`Las reservas en línea requieren ${db.barberia.anticipacionMinHoras} h de anticipación`);
  }

  const ini = minutosDelDia(inicio);
  const cabe = ventanasLibres(inicio, db.barberia, barbero, db.bloqueos, db.citas).some(
    (v) => v.ini <= ini && ini + duracion <= v.fin,
  );
  if (!cabe) return falla('Ese horario ya no está disponible. Elige otro.', 409);

  const cita = mutar((db) => {
    const tel = datos.cliente.telefono.replace(/\D/g, '');
    let cliente = db.clientes.find((c) => c.telefono === tel);
    if (!cliente) {
      cliente = { id: uid(), nombre: datos.cliente.nombre.trim(), telefono: tel, totalVisitas: 0, totalGastado: 0 };
      db.clientes.push(cliente);
    }
    const nueva: Cita = {
      id: uid(),
      barberoId: barbero.id,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      clienteTelefono: cliente.telefono,
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      estado: datos.origen === 'WALK_IN' ? 'EN_SILLA' : 'CONFIRMADA',
      origen: datos.origen,
      notas: datos.notas,
      servicios: items,
      tokenPublico: uid(),
    };
    db.citas.push(nueva);
    return nueva;
  });
  return latencia(cita);
};

const validarHorario = (bloques: Barbero['horarios']) =>
  [0, 1, 2, 3, 4, 5, 6].some((dia) => {
    const del = bloques
      .filter((b) => b.diaSemana === dia)
      .map((b) => ({ ini: hhmmToMin(b.inicio), fin: hhmmToMin(b.fin) }))
      .sort((a, b) => a.ini - b.ini);
    return del.some((b, i) => b.ini >= b.fin || (i > 0 && b.ini < del[i - 1].fin));
  });

export const mockApi: Api = {
  auth: {
    login: (usuario, password) => {
      const u = getDb().usuarios.find((x) => x.usuario === normalizarUsuario(usuario) && x.password === password && x.activo);
      if (!u) return falla('Usuario o contraseña incorrectos', 401);
      mutar(() => Object.assign(u, { ultimoAcceso: new Date().toISOString() }));
      return latencia({
        accessToken: `mock.${btoa(u.id)}`,
        usuario: {
          id: u.id,
          nombre: u.nombre,
          usuario: u.usuario,
          rol: u.rol,
          barberiaId: getDb().barberia.id,
          barbero: u.barberoId ? { id: u.barberoId } : null,
        },
      });
    },
  },

  usuarios: {
    listar: () => latencia(getDb().usuarios.map(aCuenta).sort((a, b) => Number(b.activo) - Number(a.activo) || a.nombre.localeCompare(b.nombre))),
    crear: ({ password, barberoId, ...datos }) => {
      const db = getDb();
      const usuario = normalizarUsuario(datos.usuario);
      if (!USUARIO_REGEX.test(usuario)) return falla(MENSAJE_USUARIO);
      if (db.usuarios.some((u) => u.usuario === usuario)) return falla('Ese nombre de usuario ya está en uso', 409);
      if (password.length < 6) return falla('La contraseña debe tener al menos 6 caracteres');
      const barbero = datos.rol === 'BARBERO' ? db.barberos.find((b) => b.id === barberoId) : undefined;
      if (datos.rol === 'BARBERO') {
        if (!barbero) return falla('Elige el barbero al que pertenece este usuario');
        if (db.usuarios.some((u) => u.barberoId === barbero.id)) return falla(`${barbero.nombre} ya tiene un usuario`);
      }
      return latencia(
        mutar((db) => {
          const nuevo: UsuarioMock = { id: uid(), ...datos, usuario, password, activo: true, barberoId: barbero?.id ?? null };
          db.usuarios.push(nuevo);
          if (barbero) barbero.usuarioAcceso = usuario;
          return aCuenta(nuevo);
        }),
      );
    },
    actualizar: (id, datos) => {
      const db = getDb();
      const u = db.usuarios.find((x) => x.id === id);
      if (!u) return falla('Usuario no encontrado', 404);
      const usuario = datos.usuario !== undefined ? normalizarUsuario(datos.usuario) : undefined;
      if (usuario !== undefined && !USUARIO_REGEX.test(usuario)) return falla(MENSAJE_USUARIO);
      if (usuario && db.usuarios.some((x) => x.usuario === usuario && x.id !== id)) return falla('Ese nombre de usuario ya está en uso', 409);
      if (u.rol === 'BARBERO' && datos.rol) return falla('El rol de un usuario de barbero no se puede cambiar');
      if (u.rol === 'DUENO' && (datos.activo === false || (datos.rol && datos.rol !== 'DUENO'))) {
        const otrosDuenos = db.usuarios.filter((x) => x.rol === 'DUENO' && x.activo && x.id !== id).length;
        if (!otrosDuenos) return falla('Debe quedar al menos un dueño activo');
      }
      return latencia(
        mutar((db) => {
          Object.assign(u, { ...datos, ...(usuario ? { usuario } : {}) });
          const barbero = db.barberos.find((b) => b.id === u.barberoId);
          if (barbero) barbero.usuarioAcceso = u.activo ? u.usuario : null;
          return aCuenta(u);
        }),
      );
    },
    resetPassword: (id, password) => {
      const u = getDb().usuarios.find((x) => x.id === id);
      if (!u) return falla('Usuario no encontrado', 404);
      if (password.length < 6) return falla('La contraseña debe tener al menos 6 caracteres');
      return latencia(mutar(() => void Object.assign(u, { password })));
    },
  },

  barberia: {
    obtener: () => latencia(getDb().barberia),
    actualizar: (datos) => latencia(mutar((db) => Object.assign(db.barberia, datos))),
    actualizarHorario: (dias) =>
      latencia(
        mutar((db) => {
          dias.forEach((d) => {
            const i = db.barberia.horarios.findIndex((h) => h.diaSemana === d.diaSemana);
            if (i >= 0) db.barberia.horarios[i] = d;
            else db.barberia.horarios.push(d);
          });
          return db.barberia;
        }),
      ),
  },

  servicios: {
    listar: (incluirInactivos) =>
      latencia(getDb().servicios.filter((s) => incluirInactivos || s.activo).sort((a, b) => a.orden - b.orden)),
    crear: (datos) => latencia(mutar((db) => {
      const s = { ...datos, id: uid(), activo: true };
      db.servicios.push(s);
      return s;
    })),
    actualizar: (id, datos) => {
      const s = getDb().servicios.find((x) => x.id === id);
      if (!s) return falla('Servicio no encontrado', 404);
      return latencia(mutar(() => Object.assign(s, datos)));
    },
    desactivar: (id) => mockApi.servicios.actualizar(id, { activo: false }),
  },

  barberos: {
    listar: (incluirInactivos) =>
      latencia(getDb().barberos.filter((b) => incluirInactivos || b.activo).sort((a, b) => a.orden - b.orden)),
    obtener: (id) => {
      const b = getDb().barberos.find((x) => x.id === id);
      return b ? latencia(b) : falla('Barbero no encontrado', 404);
    },
    crear: ({ servicioIds, ...datos }) => {
      const db = getDb();
      if (db.barberos.filter((b) => b.activo).length >= db.barberia.maxBarberos) {
        return falla(`Tu plan permite hasta ${db.barberia.maxBarberos} barberos activos`);
      }
      return latencia(mutar((db) => {
        const b: Barbero = { ...datos, id: uid(), activo: true, horarios: [], servicios: servicioIds.map((servicioId) => ({ servicioId })) };
        db.barberos.push(b);
        return b;
      }));
    },
    actualizar: (id, datos) => {
      const b = getDb().barberos.find((x) => x.id === id);
      if (!b) return falla('Barbero no encontrado', 404);
      return latencia(mutar(() => Object.assign(b, datos)));
    },
    reemplazarHorarios: (id, bloques) => {
      if (validarHorario(bloques)) return falla('Hay bloques de horario inválidos o que se traslapan');
      return mockApi.barberos.actualizar(id, { horarios: bloques.map((b) => ({ ...b, id: b.id ?? uid() })) });
    },
    reemplazarServicios: (id, servicios) => mockApi.barberos.actualizar(id, { servicios }),
    listarBloqueos: (desde, hasta) =>
      latencia(getDb().bloqueos.filter((b) => b.inicio < hasta && b.fin > desde)),
  },

  clientes: {
    listar: () => latencia([...getDb().clientes].sort((a, b) => a.nombre.localeCompare(b.nombre))),
  },

  citas: {
    listar: (desde, hasta) =>
      latencia(getDb().citas.filter((c) => c.inicio < hasta && c.fin > desde).sort((a, b) => a.inicio.localeCompare(b.inicio))),
    crear: (datos) => crearCita(datos, false),
    cambiarEstado: (id, estado) => {
      const c = getDb().citas.find((x) => x.id === id);
      if (!c) return falla('Cita no encontrada', 404);
      return latencia(mutar(() => Object.assign(c, { estado })));
    },
    disponibilidad: (q) => latencia(slotsPara(getDb(), q, false)),
  },

  publico: {
    barberia: (slug) => {
      const { barberia } = getDb();
      if (barberia.slug !== slug) return falla('Barbería no encontrada', 404);
      const { nombre, telefono, direccion, horarios } = barberia;
      return latencia({ nombre, slug, telefono, direccion, horarios });
    },
    servicios: (slug) =>
      getDb().barberia.slug !== slug
        ? falla('Barbería no encontrada', 404)
        : latencia(getDb().servicios.filter((s) => s.activo && s.visibleEnLinea).sort((a, b) => a.orden - b.orden)),
    barberos: (slug) =>
      getDb().barberia.slug !== slug
        ? falla('Barbería no encontrada', 404)
        : latencia(
            getDb()
              .barberos.filter((b) => b.activo && b.aceptaReservas)
              .sort((a, b) => a.orden - b.orden)
              .map(({ id, nombre, colorAgenda, fotoUrl, servicios }) => ({ id, nombre, colorAgenda, fotoUrl, servicios })),
          ),
    disponibilidad: (_slug, q) => latencia(slotsPara(getDb(), q, true)),
    reservar: (_slug, datos) => crearCita({ ...datos, origen: 'EN_LINEA' }, true),
  },
};
