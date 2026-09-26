import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { randomUUID, randomBytes, createHash, timingSafeEqual } from "crypto";
import multer from "multer";
import sharp from "sharp";
import rateLimit from "express-rate-limit";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "cards.json");
const UPLOADS_DIR = join(__dirname, "uploads");
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

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

// Trust proxy
// express-rate-limit identifica por IP. Si hay un proxy delante
// (Nginx, Cloudflare, Fly...) hay que declararlo con TRUST_PROXY o
// todas las peticiones cuentan como una sola IP.
if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY;
  app.set("trust proxy", value === "true" ? 1 : isNaN(Number(value)) ? value : Number(value));
} else if (IS_PROD) {
  console.warn("AVISO: TRUST_PROXY no está definido. Si hay un proxy delante, el rate limiting contará a todos los visitantes como una sola IP.");
}

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Rate limiting
const RATE_LIMIT_ON = process.env.RATE_LIMIT !== "off";

function limit({ windowMs, max }) {
  if (!RATE_LIMIT_ON) return (req, res, next) => next();
  return rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    // Usamos el keyGenerator por defecto de la librería: ya agrupa
    // los IPv6 por /64, algo que un req.ip "a pelo" no hace.
    message: { error: "Demasiadas peticiones. Reintentá en unos minutos." },
  });
}

const apiLimiter = limit(RATE_LIMITS.api);
const createLimiter = limit(RATE_LIMITS.create);
const removeLimiter = limit(RATE_LIMITS.remove);

app.use("/api", apiLimiter);
app.use("/uploads", express.static(UPLOADS_DIR, {
  maxAge: "7d",
  setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
}));

function readCards() {
  if (!existsSync(DATA_FILE)) return {};
  return JSON.parse(readFileSync(DATA_FILE, "utf-8"));
}

function writeCards(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

// Clave de gestión de cada carta
// Al crear una carta se genera una clave aleatoria que solo recibe
// quien la creó. En el JSON guardamos su hash, nunca la clave:
// si alguien lee cards.json no puede borrar cartas ajenas.
function generateManageKey() {
  return randomBytes(24).toString("base64url");
}

function hashKey(key) {
  return createHash("sha256").update(String(key)).digest("hex");
}

// Compara el hash guardado con el que resulta de la clave que llega.
// timingSafeEqual en vez de ==, que compara a tiempo variable: no
// cuesta nada evitarlo, y la comparación es de hashes, no de claves.
function keysMatch(storedHash, providedKey) {
  if (!storedHash || !providedKey) return false;
  const a = Buffer.from(storedHash, "hex");
  const b = Buffer.from(hashKey(providedKey), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// La clave puede venir en el header, la query o el body,
// para que el cliente no esté atado a una sola forma.
function extractKey(req) {
  return req.get("x-card-key") || req.query.key || req.body?.key || "";
}

// Nunca devolvemos el hash: la respuesta pública de una carta
// no debe filtrar nada que sirva para gestionarla.
function publicCard(card) {
  const { manageKeyHash, ...rest } = card;
  return rest;
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

app.post("/api/cards", createLimiter, (req, res) => {
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
        const manageKey = generateManageKey();
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
          // La clave en claro solo se devuelve una vez, en esta
          // respuesta; acá queda únicamente su hash.
          manageKeyHash: hashKey(manageKey),
        };
        writeCards(cards);
        res.json({ id, url: `/card/${id}`, manageKey });
      } catch (err) {
        rollbackUploads();
        console.error("Error al crear carta:", err);
        res.status(500).json({ error: "Error al procesar la carta" });
      }
    }
  );
});

// Buscamos con hasOwn y no con cards[id]: cards es un objeto plano,
// así que también responde por claves heredadas de Object.prototype.
// /api/cards/toString devolvía 200 con un cuerpo vacío en vez de 404.
function findCard(cards, id) {
  if (!id || !Object.hasOwn(cards, id)) return null;
  const card = cards[id];
  return card && typeof card === "object" ? card : null;
}

app.get("/api/cards/:id", (req, res) => {
  const cards = readCards();
  const card = findCard(cards, req.params.id);
  if (!card) return res.status(404).json({ error: "Carta no encontrada" });
  res.json(publicCard(card));
});

// Borrar exige la clave de gestión que se recibió al crear la carta.
// El ID son 8 hex y es adivinable, pero con eso no alcanza: hay que
// tener la clave, y además el rate limit corta los intentos desde una
// misma IP.
app.delete("/api/cards/:id", removeLimiter, (req, res) => {
  const cards = readCards();
  const card = findCard(cards, req.params.id);
  if (!card) return res.status(404).json({ error: "Carta no encontrada" });

  if (!keysMatch(card.manageKeyHash, extractKey(req))) {
    return res.status(401).json({ error: "No tenés permiso para borrar esta carta." });
  }

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
  if (RATE_LIMIT_ON) {
    console.log(`Rate limiting activo: ${RATE_LIMITS.create.max} cartas/hora por IP.`);
  } else {
    console.log("Rate limiting DESACTIVADO (RATE_LIMIT=off).");
  }
});
