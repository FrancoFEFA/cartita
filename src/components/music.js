import { getSong } from "../data/catalog.js";

function resolveFile(songId, customSongUrl) {
  if (songId === "custom") return customSongUrl || null;
  const song = getSong(songId);
  return song ? song.file : null;
}

// Pone o saca el src con setAttribute y no interpolado en el HTML:
// así un nombre de archivo con comillas o símbolos no se cuela
// en el marcado.
function attachSource(audio, url) {
  if (!audio) return;
  if (url) audio.setAttribute("src", url);
  else audio.removeAttribute("src");
  try { audio.load(); } catch {}
}

export function createMusic(container, songId, customSongUrl) {
  const file = resolveFile(songId, customSongUrl);

  if (!file) {
    return { play() {}, pause() {}, toggle() {}, destroy() {} };
  }

  container.insertAdjacentHTML(
    "beforeend",
    `
    <audio id="bg-music" loop preload="metadata"></audio>
    <div class="music-control muted" id="music-control" title="Reanudar música" role="button" aria-label="Reanudar música" tabindex="0">
      <span id="music-icon">♪</span>
    </div>
    `
  );

  const audio = container.querySelector("#bg-music");
  const control = container.querySelector("#music-control");

  // preload="metadata" y no "auto": el MP3 del catálogo pesa varios MB
  // y con auto se bajaba entero al abrir la carta, aunque el sonido solo
  // arranque con el primer clic. Con metadata el navegador solo lee los
  // metadatos.
  attachSource(audio, file);

  audio.volume = 0.5;

  function setIcon(playing) {
    if (!control) return;
    control.classList.toggle("muted", !playing);
    control.title = playing ? "Silenciar música" : "Reanudar música";
    control.setAttribute("aria-label", playing ? "Silenciar música" : "Reanudar música");
  }

  function play() {
    if (!audio || audio.paused === false) return;
    audio
      .play()
      .then(() => {
        setIcon(true);
      })
      .catch((err) => {
        console.warn("No se pudo reproducir la música:", err);
      });
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    setIcon(false);
  }

  function toggle() {
    if (!audio) return;
    if (audio.paused) play();
    else pause();
  }

  function onControlClick(e) {
    e.stopPropagation();
    toggle();
  }

  function onControlKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    }
  }

  if (control) {
    control.addEventListener("click", onControlClick);
    control.addEventListener("keydown", onControlKey);
  }

  function destroy() {
    if (audio) {
      audio.pause();
      // Soltamos la referencia al archivo. Si dejamos el src puesto, el
      // <audio> sigue teniendo reservado el archivo aunque ya no esté en
      // el DOM, y cada carta visitada suma una abierta.
      attachSource(audio, null);
    }
    if (control) {
      control.removeEventListener("click", onControlClick);
      control.removeEventListener("keydown", onControlKey);
    }
  }

  return { play, pause, toggle, destroy };
}

export function createInlineMusic(container) {
  container.insertAdjacentHTML(
    "beforeend",
    `
    <audio id="song-preview-audio" loop preload="none" style="display:none;"></audio>
    <a href="#" class="song-preview-link" id="song-preview-link" role="button" tabindex="0" style="display:none;">
      ▶ Escuchar muestra
    </a>
    `
  );

  const audio = container.querySelector("#song-preview-audio");
  const link = container.querySelector("#song-preview-link");

  // currentUrl es lo que se puede escuchar; attachedSrc es lo que está
  // puesto en el elemento. Van separados a propósito.
  let currentUrl = null;
  let attachedSrc = null;
  let playing = false;

  // preload="none" no alcanza por sí solo: con ese atributo Chrome
  // igual abría el archivo y lo abortaba a los 16 ms. Y con el src
  // puesto en el elemento, el recurso se pide siempre. Por eso no se
  // escribe el src hasta que alguien pide escuchar.
  function attachIfNeeded() {
    if (attachedSrc === currentUrl) return;
    attachedSrc = currentUrl;
    attachSource(audio, currentUrl);
  }

  function render() {
    if (!link) return;
    if (!currentUrl) {
      link.style.display = "none";
      link.textContent = "▶ Escuchar muestra";
    } else {
      link.style.display = "inline-block";
      link.textContent = playing ? "■ Silenciar muestra" : "▶ Escuchar muestra";
    }
  }

  function setSource(url) {
    if (audio) audio.pause();
    playing = false;
    currentUrl = url;
    render();
  }

  function play() {
    if (!audio || !currentUrl) return;
    attachIfNeeded();
    audio.volume = 0.5;
    audio
      .play()
      .then(() => { playing = true; render(); })
      .catch((err) => { console.warn("Preview de música falló:", err); });
  }

  function pause() {
    if (!audio) return;
    audio.pause();
    playing = false;
    render();
  }

  function toggle(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (!currentUrl) return;
    if (playing) pause();
    else play();
  }

  function onKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  }

  if (link) {
    link.addEventListener("click", toggle);
    link.addEventListener("keydown", onKey);
  }

  function destroy() {
    if (audio) {
      audio.pause();
      attachSource(audio, null);
    }
    if (link) {
      link.removeEventListener("click", toggle);
      link.removeEventListener("keydown", onKey);
    }
    attachedSrc = null;
  }

  return { setSource, toggle, pause, destroy };
}
