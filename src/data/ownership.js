// Claves de gestión en localStorage
// El servidor devuelve manageKey una sola vez, al crear la carta, y
// guarda solo su hash. La clave viva se queda acá: es lo único que
// permite borrar la carta. Si el usuario limpia los datos del
// navegador, pierde el control de su carta (la carta sigue viva).

const STORAGE_KEY = "cartita:managed";

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    // Modo privado o localStorage bloqueado: seguimos sin control,
    // pero sin romper la creación de la carta.
    return {};
  }
}

function writeAll(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function rememberCard(id, manageKey) {
  if (!id || !manageKey) return;
  const all = readAll();
  all[id] = manageKey;
  writeAll(all);
}

export function getManageKey(id) {
  if (!id) return null;
  const all = readAll();
  // Como en findCard(), del lado del servidor: sin hasOwn, un id de
  // "__proto__" o "toString" devuelve un objeto heredado de
  // Object.prototype, siempre verdadero, y el navegador creería que
  // posee una carta que no le corresponde.
  return Object.hasOwn(all, id) ? all[id] : null;
}

export function forgetCard(id) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}
