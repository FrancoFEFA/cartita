import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "cards.json");
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

function readCards() {
  if (!existsSync(DATA_FILE)) return {};
  return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function writeCards(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.post("/api/cards", (req, res) => {
  const { recipient, sender, message, theme, song, background, customBg } = req.body;
  if (!recipient || !message) {
    return res.status(400).json({ error: "recipient y message son requeridos" });
  }
  const id = randomUUID().slice(0, 8);
  const cards = readCards();
  cards[id] = {
    id,
    recipient,
    sender: sender || "",
    message,
    theme: theme || "romantic",
    song: song || "romantic",
    background: background || "default",
    customBg: customBg || null,
    createdAt: new Date().toISOString(),
  };
  writeCards(cards);
  res.json({ id, url: `/card/${id}` });
});

app.get("/api/cards/:id", (req, res) => {
  const cards = readCards();
  const card = cards[req.params.id];
  if (!card) return res.status(404).json({ error: "Carta no encontrada" });
  res.json(card);
});

// In dev, Vite proxy handles /api. In prod, serve static files.
if (process.env.NODE_ENV === "production") {
  const distPath = join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api")) return;
    res.sendFile(join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
