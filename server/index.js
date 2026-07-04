import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import multer from "multer";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "cards.json");
const UPLOADS_DIR = join(__dirname, "uploads");
const PORT = process.env.PORT || 3001;

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOADS_DIR));

function readCards() {
  if (!existsSync(DATA_FILE)) return {};
  return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function writeCards(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

app.post("/api/cards", (req, res) => {
  upload.single("customBg")(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ error: "La imagen es demasiado grande. Máximo 50 MB." });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { recipient, sender, message, theme, song, background } = req.body;
      if (!recipient || !message) {
        return res.status(400).json({ error: "recipient y message son requeridos" });
      }

      const id = randomUUID().slice(0, 8);
      let customBgPath = null;

      if (req.file) {
        const formatMap = {
          "image/jpeg": "jpeg",
          "image/png": "png",
          "image/webp": "webp",
          "image/avif": "avif",
        };
        const fmt = formatMap[req.file.mimetype] || "jpeg";
        const ext = fmt === "jpeg" ? "jpg" : fmt;
        const filename = `${id}.${ext}`;
        const outputPath = join(UPLOADS_DIR, filename);

        let pipeline = sharp(req.file.buffer);
        const metadata = await pipeline.metadata();

        if (metadata.width > 1920) {
          pipeline = pipeline.resize(1920, null, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        const formatOptions = fmt === "png" ? { compressionLevel: 9 }
          : fmt === "webp" ? { quality: 95 }
          : fmt === "avif" ? { quality: 85 }
          : { quality: 95, mozjpeg: true };

        await pipeline.toFormat(fmt, formatOptions).toFile(outputPath);
        customBgPath = `/uploads/${filename}`;
      }

      const cards = readCards();
      cards[id] = {
        id,
        recipient,
        sender: sender || "",
        message,
        theme: theme || "romantic",
        song: song || "romantic",
        background: background || "default",
        customBg: customBgPath,
        createdAt: new Date().toISOString(),
      };
      writeCards(cards);
      res.json({ id, url: `/card/${id}` });
    } catch (err) {
      console.error("Error al crear carta:", err);
      res.status(500).json({ error: "Error al procesar la carta" });
    }
  });
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
