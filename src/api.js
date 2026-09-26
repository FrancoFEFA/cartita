export async function createCard(data) {
  const res = await fetch("/api/cards", {
    method: "POST",
    body: data,
  });
  if (!res.ok) {
    let message;
    try {
      const body = await res.json();
      message = body.error;
    } catch {
      message = res.status === 413 ? "El archivo es demasiado grande para el servidor" : `Error del servidor (${res.status})`;
    }
    throw new Error(message || "Error al crear la carta");
  }
  return res.json();
}

export async function getCard(id) {
  const res = await fetch(`/api/cards/${encodeURIComponent(id)}`);
  // Distinguimos 404 de fallo de red: antes un error de conexión
  // se mostraba como "Carta no encontrada", que miente.
  if (res.status === 404) {
    const err = new Error("Carta no encontrada");
    err.notFound = true;
    throw err;
  }
  if (!res.ok) throw new Error(`Error del servidor (${res.status})`);
  return res.json();
}

export async function deleteCard(id, manageKey) {
  const res = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "x-card-key": manageKey },
  });
  if (!res.ok) {
    let message = "No se pudo eliminar la carta";
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}
