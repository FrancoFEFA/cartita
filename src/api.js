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
      message = res.status === 413 ? "La imagen es demasiado grande para el servidor" : `Error del servidor (${res.status})`;
    }
    throw new Error(message || "Error al crear la carta");
  }
  return res.json();
}

export async function getCard(id) {
  const res = await fetch(`/api/cards/${id}`);
  if (!res.ok) throw new Error("Carta no encontrada");
  return res.json();
}
