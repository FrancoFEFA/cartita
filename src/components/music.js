import { getSong } from "../data/catalog.js";

function resolveFile(songId, customSongUrl) {
  if (songId === "custom") return customSongUrl || null;
  const song = getSong(songId);
  return song ? song.file : null;
}

export function createMusic(container, songId, customSongUrl) {
  const file = resolveFile(songId, customSongUrl);

  if (!file) {
    return { play() {}, pause() {}, toggle() {}, destroy() {} };
  }

  container.insertAdjacentHTML(
    "beforeend",
    `
    <audio id="bg-music" loop preload="auto">
      <source src="${file}" type="audio/mpeg">
    </audio>
    <div class="music-control muted" id="music-control" title="Reanudar música" role="button" aria-label="Reanudar música" tabindex="0">
      <span id="music-icon">♪</span>
    </div>
    `
  );

  const audio = container.querySelector("#bg-music");
  const control = container.querySelector("#music-control");

  audio.volume = 0.5;
  let started = false;

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
        started = true;
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
    if (audio) audio.pause();
    if (control) {
      control.removeEventListener("click", onControlClick);
      control.removeEventListener("keydown", onControlKey);
    }
  }

  return { play, pause, toggle, destroy, hasStarted: () => started };
}

export function createInlineMusic(container) {
  container.insertAdjacentHTML(
    "beforeend",
    `
    <audio id="song-preview-audio" loop preload="auto" style="display:none;"></audio>
    <a href="#" class="song-preview-link" id="song-preview-link" role="button" tabindex="0" style="display:none;">
      ▶ Escuchar muestra
    </a>
    `
  );

  const audio = container.querySelector("#song-preview-audio");
  const link = container.querySelector("#song-preview-link");
  let currentUrl = null;
  let playing = false;

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
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      try { audio.load(); } catch {}
    }
    playing = false;
    currentUrl = url;
    if (url && audio) {
      audio.src = url;
    }
    render();
  }

  function play() {
    if (!audio || !currentUrl) return;
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
    if (audio) audio.pause();
    if (link) {
      link.removeEventListener("click", toggle);
      link.removeEventListener("keydown", onKey);
    }
  }

  return { setSource, toggle, pause, destroy, isPlaying: () => playing };
}