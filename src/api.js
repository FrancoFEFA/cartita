export async function createCard(data) {
  const res = await fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear la carta");
  return res.json();
}

export async function getCard(id) {
  const res = await fetch(`/api/cards/${id}`);
  if (!res.ok) throw new Error("Carta no encontrada");
  return res.json();
}
