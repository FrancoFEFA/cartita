export const SONGS = [
  { id: "romantic", label: "Romántica ♪", file: "/audio/romantic.mp3" },
  { id: "custom", label: "Subir canción propia", file: null },
  { id: "none", label: "Sin música", file: null },
];

export const THEMES = [
  { id: "romantic", label: "Romántico", decorations: true },
  { id: "none", label: "Sin estilo", decorations: false },
];

export const BACKGROUNDS = [
  { id: "default", label: "Por defecto (romántico)" },
  { id: "custom", label: "Subir imagen propia" },
];

export const DEFAULT_SONG = "romantic";
export const DEFAULT_THEME = "romantic";
export const DEFAULT_BACKGROUND = "default";

export function getSong(id) {
  return SONGS.find((s) => s.id === id) || SONGS.find((s) => s.id === DEFAULT_SONG);
}

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
}

export function getBackground(id) {
  return BACKGROUNDS.find((b) => b.id === id) || BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND);
}

export const VALID_SONG_IDS = SONGS.map((s) => s.id);
export const VALID_THEME_IDS = THEMES.map((t) => t.id);
export const VALID_BACKGROUND_IDS = BACKGROUNDS.map((b) => b.id);
