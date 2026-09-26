export const VALID_SONGS = new Set(["romantic", "custom", "none"]);
export const VALID_THEMES = new Set(["romantic", "none"]);
export const VALID_BACKGROUNDS = new Set(["default", "custom"]);

export const DEFAULT_SONG = "romantic";
export const DEFAULT_THEME = "romantic";
export const DEFAULT_BACKGROUND = "default";

export const AUDIO_MIME = new Set(["audio/mpeg", "audio/mp3"]);
export const AUDIO_MAX_SIZE = 15 * 1024 * 1024;
export const IMAGE_MAX_SIZE = 50 * 1024 * 1024;

// Límites de texto
// Sin tope, un mensaje enorme deja al destinatario esperando minutos
// con la máquina de escribir (15 ms por carácter).
export const TEXT_LIMITS = {
  recipient: 80,
  sender: 80,
  message: 4000,
};

// Límites de peticiones
// windowMs en ms, max = peticiones por IP por ventana. Se desactivan
// con RATE_LIMIT=off (solo para desarrollo).
export const RATE_LIMITS = {
  // Trámite normal de la API (leer cartas, etc.)
  api: { windowMs: 15 * 60 * 1000, max: 300 },
  // Crear cartas: es la ruta cara (sube archivos y escribe en disco).
  create: { windowMs: 60 * 60 * 1000, max: 20 },
  // Borrar: no debería pasar de un puñado por sesión.
  remove: { windowMs: 15 * 60 * 1000, max: 60 },
};

// Tope de los campos de texto dentro del multipart
// Busboy permite 1 MB por campo; lo bajamos a 32 KB, de sobra para
// los 4000 caracteres del mensaje (incluso con emoji de 4 bytes).
export const MAX_FIELDS = 12;
export const MAX_FIELD_SIZE = 32 * 1024;

// Tope de partes del multipart
// El formulario completo manda recipient, sender, message, theme,
// song y background, más customBg y/o customSong: ocho en el peor
// caso.
export const MAX_PARTS = 8;
