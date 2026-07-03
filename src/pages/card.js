import { getCard } from "../api.js";
import { createEnvelope } from "../components/envelope.js";

function applyBackground(card) {
  const body = document.body;
  const bg = card.background || "default";

  if (bg === "custom" && card.customBg) {
    body.style.backgroundImage = `url('${card.customBg}')`;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundRepeat = "no-repeat";
    body.classList.add("has-bg");
  } else {
    body.style.backgroundImage = "";
    body.style.backgroundSize = "";
    body.style.backgroundPosition = "";
    body.style.backgroundRepeat = "";
    body.classList.remove("has-bg");
  }
}

export async function renderCard(container, id) {
  container.innerHTML = `
    <div style="text-align:center;padding:40px;color:var(--text-color);font-family:var(--font-body);">
      Cargando tu carta…
    </div>
  `;

  try {
    const card = await getCard(id);
    document.documentElement.setAttribute("data-theme", card.theme || "romantic");
    applyBackground(card);

    container.innerHTML = `
      <div class="bg-deco"></div>
      <div class="bg-vignette"></div>
      <main class="container">
        <div id="envelope-container"></div>
      </main>
    `;

    const envelopeContainer = container.querySelector("#envelope-container");
    createEnvelope(envelopeContainer, card);
  } catch {
    container.innerHTML = `
      <div class="bg-deco"></div>
      <div class="bg-vignette"></div>
      <div style="text-align:center;padding:48px 24px;color:var(--text-color);font-family:var(--font-body);position:relative;z-index:5;">
        <h2 style="font-family:var(--font-script);color:var(--primary-deep);font-size:2rem;">Carta no encontrada</h2>
        <p style="font-family:var(--font-hand);font-size:1.3rem;margin-top:8px;">El enlace no es válido o la carta ha expirado.</p>
        <a href="/" style="display:inline-block;margin-top:20px;font-family:var(--font-title);color:var(--primary-color);border-bottom:1px solid var(--accent-gold);padding-bottom:2px;">Crear una nueva carta</a>
      </div>
    `;
  }
}