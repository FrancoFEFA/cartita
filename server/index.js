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
  TEXT_LIMITS, RATE_LIMITS, MAX_FIELDS, MAX_FIELD_SIZE, MAX_PARTS,
} from "./catalog.js";

// Subida de archivos
// Los archivos se guardan en memoria y luego sharp los procesa.
// El tope global es el de la imagen (la más pesada); el audio se
// valida aparte, pero entra completo en RAM antes de rechazarse.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: IMAGE_MAX_SIZE,
    fields: MAX_FIELDS,
    fieldSize: MAX_FIELD_SIZE,
    parts: MAX_PARTS,
  },
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
          if (err.code === "LIMIT_FIELD_SIZE" || err.code === "LIMIT_FIELD_VALUE") {
            return res.status(413).json({ error: "El texto de la carta es demasiado largo." });
          }
          if (err.code === "LIMIT_FIELD_COUNT" || err.code === "LIMIT_PART_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
            return res.status(400).json({ error: "Formulario inesperado." });
          }
          return res.status(400).json({ error: "No se pudo leer el formulario." });
        }
        return res.status(400).json({ error: "No se pudo leer el formulario." });
      }

      // Archivos escritos en disco
      // Todo lo que se escribe queda anotado en writtenFiles, y
      // rollbackUploads() lo borra si algo falla más abajo: sin eso,
      // un fallo a mitad de la creación dejaba huérfanos en uploads/.
      const writtenFiles = [];

      function rollbackUploads() {
        for (const file of writtenFiles) {
          try {
            if (existsSync(file)) unlinkSync(file);
          } catch (unlinkErr) {
            console.warn(`No se pudo revertir ${file}:`, unlinkErr.message);
          }
        }
      }

      try {
        const recipient = String(req.body.recipient || "").trim();
        const sender = String(req.body.sender || "").trim();
        const message = String(req.body.message || "").trim();

        if (!recipient || !message) {
          return res.status(400).json({ error: "recipient y message son requeridos" });
        }

        // Los tres topes están en TEXT_LIMITS (catalog.js), donde ya se
        // explica por qué existen. Acá lo que importa es frenarlos antes
        // de escribir nada en disco.
        if (recipient.length > TEXT_LIMITS.recipient || sender.length > TEXT_LIMITS.sender) {
          return res.status(400).json({ error: "Los nombres son demasiado largos." });
        }
        if (message.length > TEXT_LIMITS.message) {
          return res.status(400).json({ error: `El mensaje no puede superar los ${TEXT_LIMITS.message} caracteres.` });
        }

        const theme = VALID_THEMES.has(req.body.theme) ? req.body.theme : DEFAULT_THEME;
        const song = VALID_SONGS.has(req.body.song) ? req.body.song : DEFAULT_SONG;
        const background = VALID_BACKGROUNDS.has(req.body.background) ? req.body.background : DEFAULT_BACKGROUND;

        const id = randomUUID().slice(0, 8);
        let customBgPath = null;
        let customSongPath = null;

        const customBgFile = req.files?.customBg?.[0];
        const customSongFile = req.files?.customSong?.[0];

        // Validación de los archivos
        // Los dos se revisan antes de escribir nada en disco. El audio
        // va primero a propósito: si se validaba después de subir la
        // imagen, un 400 acá dejaba esa imagen huérfana en uploads/.
        if (customSongFile) {
          if (!AUDIO_MIME.has(customSongFile.mimetype)) {
            return res.status(400).json({ error: "La canción debe ser un archivo MP3." });
          }
          if (customSongFile.size > AUDIO_MAX_SIZE) {
            return res.status(413).json({ error: "La canción es demasiado grande. Máximo 15 MB." });
          }
        }

        if (song === "custom" && !customSongFile) {
          return res.status(400).json({ error: "Seleccionaste una canción propia pero no se recibió el archivo." });
        }

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

          // El tipo y el contenido los manda el cliente, así que acá
          // pueden llegar bytes que no son una imagen: un .png que en
          // realidad es texto, un GIF que sharp no puede decodificar.
          // Sin este catch, ese error caía en el 500 de más abajo y el
          // usuario veía un fallo del servidor por un archivo suyo.
          try {
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
          } catch (imgErr) {
            console.warn(`No se pudo procesar ${filename}:`, imgErr.message);
            return res.status(400).json({ error: "No pudimos leer la imagen. Puede estar dañada o no ser un formato válido." });
          }

          writtenFiles.push(outputPath);
          customBgPath = `/uploads/${filename}`;
        }

        if (customSongFile) {
          const filename = `${id}.mp3`;
          const outputPath = join(UPLOADS_DIR, filename);
          writeFileSync(outputPath, customSongFile.buffer);
          writtenFiles.push(outputPath);
          customSongPath = `/uploads/${filename}`;
        }

        const cards = readCards();
        cards[id] = {
          id,
          recipient,
          sender,
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
        rollbackUploads();
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
