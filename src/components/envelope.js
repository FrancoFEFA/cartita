import gsap from "gsap";
import { createTypewriter } from "./typewriter.js";
import { startFloatingHearts, stopFloatingHearts } from "./hearts.js";
import { createMusic } from "./music.js";
import { getTheme } from "../data/catalog.js";

export function createEnvelope(container, card) {
  const { recipient, sender, message, song, customSong, theme } = card;
  const decorations = getTheme(theme).decorations;

  // El template solo lleva marcado fijo: ningún dato del usuario va
  // interpolado acá. recipient y sender entran después, por
  // textContent o setAttribute, así no se vuelven HTML ejecutable.
  container.innerHTML = `
    <div class="envelope-wrapper" id="envelope-wrapper"
         role="button" tabindex="0" aria-expanded="false">
      <div class="envelope envelope-back"></div>

      <div class="letter" id="letter">
        <div class="letter-content">
          <h1>Para <span id="letter-recipient"></span></h1>
          <p id="typewriter-text"></p>
          <p class="letter-signature" id="letter-signature" hidden></p>
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
  const signature = container.querySelector("#letter-signature");

  container.querySelector("#letter-recipient").textContent = recipient;
  setExpanded(false);

  if (sender) {
    signature.textContent = `— ${sender}`;
    signature.hidden = false;
  }

  const typewriter = createTypewriter(typewriterElement);
  const music = createMusic(container, song, customSong);

  let isOpened = false;

  // Los dos setTimeout del ciclo abrir/cerrar. Cancelarlos es lo que
  // evita que el typewriter siga escribiendo si el usuario navega a
  // otra carta mientras estaba en curso.
  let openTimer = null;
  let clearTimer = null;

  function clearPendingTimers() {
    if (openTimer) { clearTimeout(openTimer); openTimer = null; }
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
    typewriter.cancel();
  }

  // El nombre accesible tiene que decir la acción que hace el clic
  // ahora: un botón que ya abrió la carta en realidad la cierra.
  function setExpanded(open) {
    envelopeWrapper.setAttribute("aria-expanded", String(open));
    envelopeWrapper.setAttribute(
      "aria-label",
      `${open ? "Cerrar" : "Abrir"} la carta para ${recipient}`
    );
  }

  function openEnvelope() {
    if (isOpened) return;
    isOpened = true;
    envelopeWrapper.classList.add("open");
    setExpanded(true);
    gsap.to(clickIndicator, { opacity: 0, duration: 0.5 });

    music.play();

    if (decorations) startFloatingHearts();

    typewriterElement.textContent = "";
    // 1.3 s de pausa para que se vea el sobre abrirse antes de escribir.
    openTimer = setTimeout(() => {
      openTimer = null;
      typewriter.start(message);
    }, 1300);
  }

  function closeEnvelope() {
    if (!isOpened) return;
    isOpened = false;
    envelopeWrapper.classList.remove("open");
    setExpanded(false);
    clearPendingTimers();
    gsap.to(clickIndicator, { opacity: 0.85, duration: 0.5 });
    clearTimer = setTimeout(() => {
      clearTimer = null;
      if (!isOpened) typewriterElement.textContent = "";
    }, 600);
  }

  function toggleEnvelope() {
    if (isOpened) closeEnvelope();
    else openEnvelope();
  }

  function onEnvelopeClick(event) {
    event.stopPropagation();
    toggleEnvelope();
  }

  // El sobre es un div con role="button": sin esto no era alcanzable
  // con el teclado.
  function onEnvelopeKey(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      toggleEnvelope();
    }
  }

  function onDocumentClick(event) {
    if (isOpened && !event.target.closest("#envelope-wrapper") && !event.target.closest("#music-control")) {
      closeEnvelope();
    }
  }

  envelopeWrapper.addEventListener("click", onEnvelopeClick);
  envelopeWrapper.addEventListener("keydown", onEnvelopeKey);
  document.addEventListener("click", onDocumentClick);

  // La llama main.js al cambiar de vista.
  return function destroy() {
    clearPendingTimers();
    envelopeWrapper.removeEventListener("click", onEnvelopeClick);
    envelopeWrapper.removeEventListener("keydown", onEnvelopeKey);
    document.removeEventListener("click", onDocumentClick);
    stopFloatingHearts();
    music.destroy();
  };
}
