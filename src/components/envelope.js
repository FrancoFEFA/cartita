import gsap from "gsap";
import { startTypewriter } from "./typewriter.js";
import { startFloatingHearts, stopFloatingHearts } from "./hearts.js";

export function createEnvelope(container, { recipient, sender, message, song }) {
  const wantsMusic = song && song !== "";

  container.innerHTML = `
    <audio id="bg-music" loop${wantsMusic ? "" : ""}>
      <source src="assets/music.mp3" type="audio/mpeg">
    </audio>

    <div class="envelope-wrapper" id="envelope-wrapper">
      <div class="envelope envelope-back"></div>

      <div class="letter" id="letter">
        <div class="letter-content">
          <h1>Para ${recipient}</h1>
          <p id="typewriter-text"></p>
          ${sender ? `<p class="letter-signature">— ${sender}</p>` : ""}
        </div>
      </div>

      <div class="envelope flap" id="flap">
        <div class="wax-seal" id="wax-seal"></div>
      </div>
      <div class="envelope envelope-front"></div>

      <div class="click-indicator" id="click-indicator">Haz clic para abrir</div>
    </div>

    ${wantsMusic ? `
      <div class="music-control" id="music-control" title="Pausar / Reanudar música">
        <span id="music-icon">♪</span>
      </div>
    ` : ""}
  `;

  const envelopeWrapper = container.querySelector("#envelope-wrapper");
  const clickIndicator = container.querySelector("#click-indicator");
  const bgMusic = container.querySelector("#bg-music");
  const typewriterElement = container.querySelector("#typewriter-text");
  const musicControl = container.querySelector("#music-control");
  const musicIcon = container.querySelector("#music-icon");

  let isOpened = false;
  let musicStarted = false;

  function closeEnvelope() {
    if (!isOpened) return;
    isOpened = false;
    envelopeWrapper.classList.remove("open");
    gsap.to(clickIndicator, { opacity: 0.85, duration: 0.5 });
    setTimeout(() => {
      if (!isOpened) typewriterElement.textContent = "";
    }, 600);
  }

  function toggleMusic() {
    if (!bgMusic) return;
    if (bgMusic.paused) {
      bgMusic.play().catch(() => {});
      if (musicIcon) musicIcon.textContent = "♪";
    } else {
      bgMusic.pause();
      if (musicIcon) musicIcon.textContent = "♪̸";
    }
  }

  if (musicControl) musicControl.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMusic();
  });

  envelopeWrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isOpened) {
      closeEnvelope();
    } else {
      isOpened = true;
      envelopeWrapper.classList.add("open");
      gsap.to(clickIndicator, { opacity: 0, duration: 0.5 });

      if (wantsMusic && bgMusic && bgMusic.paused && !musicStarted) {
        bgMusic.volume = 0.5;
        bgMusic.play().then(() => { musicStarted = true; }).catch(() => {});
        if (musicIcon) musicIcon.textContent = "♪";
      }

      startFloatingHearts();

      typewriterElement.textContent = "";
      setTimeout(() => startTypewriter(typewriterElement, message), 1300);
    }
  });

  document.addEventListener("click", (event) => {
    if (isOpened && !event.target.closest("#envelope-wrapper") && !event.target.closest("#music-control")) {
      closeEnvelope();
    }
  });

  return () => {
    stopFloatingHearts();
    if (bgMusic) bgMusic.pause();
  };
}