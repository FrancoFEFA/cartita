import gsap from "gsap";
import { startTypewriter } from "./typewriter.js";
import { startFloatingHearts, stopFloatingHearts } from "./hearts.js";
import { createMusic } from "./music.js";
import { getTheme } from "../data/catalog.js";

export function createEnvelope(container, card) {
  const { recipient, sender, message, song, customSong, theme } = card;
  const decorations = getTheme(theme).decorations;

  container.innerHTML = `
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
  `;

  const envelopeWrapper = container.querySelector("#envelope-wrapper");
  const clickIndicator = container.querySelector("#click-indicator");
  const typewriterElement = container.querySelector("#typewriter-text");

  const music = createMusic(container, song, customSong);

  let isOpened = false;

  function closeEnvelope() {
    if (!isOpened) return;
    isOpened = false;
    envelopeWrapper.classList.remove("open");
    gsap.to(clickIndicator, { opacity: 0.85, duration: 0.5 });
    setTimeout(() => {
      if (!isOpened) typewriterElement.textContent = "";
    }, 600);
  }

  envelopeWrapper.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isOpened) {
      closeEnvelope();
    } else {
      isOpened = true;
      envelopeWrapper.classList.add("open");
      gsap.to(clickIndicator, { opacity: 0, duration: 0.5 });

      music.play();

      if (decorations) startFloatingHearts();

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
    music.destroy();
  };
}
