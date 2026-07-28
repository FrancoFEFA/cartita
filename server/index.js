import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";
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

import {
  VALID_SONGS, VALID_THEMES, VALID_BACKGROUNDS,
  DEFAULT_SONG, DEFAULT_THEME, DEFAULT_BACKGROUND,
  AUDIO_MIME, AUDIO_MAX_SIZE, IMAGE_MAX_SIZE,
} from "./catalog.js";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: IMAGE_MAX_SIZE },
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

function removeUpload(uploadPath) {
  if (!uploadPath) return;
  const filename = uploadPath.split("/").pop();
  const filePath = join(UPLOADS_DIR, filename);
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
    } catch (err) {
      console.warn(`No se pudo borrar ${filename}:`, err.message);
    }
  }
}

function cleanupOrphanUploads() {
  if (!existsSync(UPLOADS_DIR)) return;
  const cards = readCards();
  const referenced = new Set();
  for (const c of Object.values(cards)) {
    if (c.customBg) referenced.add(c.customBg.split("/").pop());
    if (c.customSong) referenced.add(c.customSong.split("/").pop());
  }
  const files = readdirSync(UPLOADS_DIR);
  let removed = 0;
  for (const file of files) {
    if (!referenced.has(file)) {
      try {
        unlinkSync(join(UPLOADS_DIR, file));
        removed++;
      } catch (err) {
        console.warn(`No se pudo borrar huérfano ${file}:`, err.message);
      }
    }
  }
  if (removed > 0) {
    console.log(`Limpieza: ${removed} archivo(s) huérfano(s) eliminado(s) de uploads/`);
  }
}

app.post("/api/cards", (req, res) => {
  upload.fields([{ name: "customBg", maxCount: 1 }, { name: "customSong", maxCount: 1 }])(
    req,
    res,
    async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            const field = err.field === "customSong"
              ? "La canción es demasiado grande. Máximo 15 MB."
              : "La imagen es demasiado grande. Máximo 50 MB.";
            return res.status(413).json({ error: field });
          }
          return res.status(400).json({ error: err.message });
        }
        return res.status(400).json({ error: err.message });
      }

      try {
        const { recipient, sender, message } = req.body;
        if (!recipient || !message) {
          return res.status(400).json({ error: "recipient y message son requeridos" });
        }

        const theme = VALID_THEMES.has(req.body.theme) ? req.body.theme : DEFAULT_THEME;
        const song = VALID_SONGS.has(req.body.song) ? req.body.song : DEFAULT_SONG;
        const background = VALID_BACKGROUNDS.has(req.body.background) ? req.body.background : DEFAULT_BACKGROUND;

        const id = randomUUID().slice(0, 8);
        let customBgPath = null;
        let customSongPath = null;

        const customBgFile = req.files?.customBg?.[0];
        const customSongFile = req.files?.customSong?.[0];

        if (customBgFile) {
          const formatMap = {
            "image/jpeg": "jpeg",
            "image/png": "png",
            "image/webp": "webp",
            "image/avif": "avif",
          };
          const fmt = formatMap[customBgFile.mimetype] || "jpeg";
          const ext = fmt === "jpeg" ? "jpg" : fmt;
          const filename = `${id}.${ext}`;
          const outputPath = join(UPLOADS_DIR, filename);

          let pipeline = sharp(customBgFile.buffer);
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

        if (customSongFile) {
          if (!AUDIO_MIME.has(customSongFile.mimetype)) {
            return res.status(400).json({ error: "La canción debe ser un archivo MP3." });
          }
          if (customSongFile.size > AUDIO_MAX_SIZE) {
            return res.status(413).json({ error: "La canción es demasiado grande. Máximo 15 MB." });
          }
          const filename = `${id}.mp3`;
          writeFileSync(join(UPLOADS_DIR, filename), customSongFile.buffer);
          customSongPath = `/uploads/${filename}`;
        }

        if (song === "custom" && !customSongPath) {
          return res.status(400).json({ error: "Seleccionaste una canción propia pero no se recibió el archivo." });
        }

        const cards = readCards();
        cards[id] = {
          id,
          recipient,
          sender: sender || "",
          message,
          theme,
          song,
          background,
          customBg: customBgPath,
          customSong: customSongPath,
          createdAt: new Date().toISOString(),
        };
        writeCards(cards);
        res.json({ id, url: `/card/${id}` });
      } catch (err) {
        console.error("Error al crear carta:", err);
        res.status(500).json({ error: "Error al procesar la carta" });
      }
    }
  );
});

app.get("/api/cards/:id", (req, res) => {
  const cards = readCards();
  const card = cards[req.params.id];
  if (!card) return res.status(404).json({ error: "Carta no encontrada" });
  res.json(card);
});

app.delete("/api/cards/:id", (req, res) => {
  const cards = readCards();
  const card = cards[req.params.id];
  if (!card) return res.status(404).json({ error: "Carta no encontrada" });

  removeUpload(card.customBg);
  removeUpload(card.customSong);
  delete cards[req.params.id];
  writeCards(cards);
  res.json({ ok: true });
});

// In dev, Vite proxy handles /api. In prod, serve static files.
if (process.env.NODE_ENV === "production") {
  const distPath = join(__dirname, "..", "dist");
  app.use(express.static(distPath));
  app.get("/{*splat}", (req, res) => {
    if (req.path.startsWith("/api")) return;
    res.sendFile(join(distPath, "index.html"));
  });
}

cleanupOrphanUploads();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
