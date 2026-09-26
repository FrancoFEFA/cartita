import { getCard, deleteCard } from "../api.js";
import { createEnvelope } from "../components/envelope.js";
import { getTheme } from "../data/catalog.js";
import { getManageKey, forgetCard } from "../data/ownership.js";

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

// Mismo cartel para los dos finales: cambia solo el texto. Un error
// de red no es "carta no encontrada" y el usuario tiene que poder
// distinguirlo. Título y detalle entran por textContent, no en el HTML.
function renderProblem(container, title, detail) {
  container.innerHTML = `
    <div class="bg-deco"></div>
    <div class="bg-vignette"></div>
    <div style="text-align:center;padding:48px 24px;color:var(--text-color);font-family:var(--font-body);position:relative;z-index:5;">
      <h2 style="font-family:var(--font-script);color:var(--primary-deep);font-size:2rem;"></h2>
      <p style="font-family:var(--font-hand);font-size:1.3rem;margin-top:8px;"></p>
      <a href="/" style="display:inline-block;margin-top:20px;font-family:var(--font-title);color:var(--primary-color);border-bottom:1px solid var(--accent-gold);padding-bottom:2px;">Crear una nueva carta</a>
    </div>
  `;
  container.querySelector("h2").textContent = title;
  container.querySelector("p").textContent = detail;
}

// Botón de borrar
// Solo se monta si esta máquina creó la carta, porque solo entonces
// tiene la clave de gestión que pide el servidor.
function mountDeleteButton(container, id) {
  const manageKey = getManageKey(id);
  if (!manageKey) return () => {};

  container.insertAdjacentHTML(
    "beforeend",
    `
    <div class="owner-bar" id="owner-bar">
      <span class="owner-note">Esta carta la creaste vos</span>
      <button type="button" class="delete-btn" id="delete-card-btn">Borrar carta</button>
    </div>
    `
  );

  const btn = container.querySelector("#delete-card-btn");
  const note = container.querySelector(".owner-note");

  function onClick() {
    const ok = window.confirm(
      "¿Borrar esta carta? Se elimina para siempre y el enlace deja de funcionar."
    );
    if (!ok) return;

    btn.disabled = true;
    btn.textContent = "Borrando…";

    deleteCard(id, manageKey)
      .then(() => {
        forgetCard(id);
        window.history.pushState(null, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
      })
      .catch((err) => {
        btn.disabled = false;
        btn.textContent = "Borrar carta";
        note.textContent = err.message || "No se pudo borrar la carta.";
      });
  }

  btn.addEventListener("click", onClick);

  return () => {
    btn.removeEventListener("click", onClick);
  };
}

// Teardown sincrónico: la carga es asíncrona, así que hay que poder
// abortar una respuesta que llega tarde.
export function renderCard(container, id) {
  container.innerHTML = `
    <div style="text-align:center;padding:40px;color:var(--text-color);font-family:var(--font-body);">
      Cargando tu carta…
    </div>
  `;

  let disposeEnvelope = null;
  let disposeDelete = null;
  let cancelled = false;

  getCard(id)
    .then((card) => {
      if (cancelled) return;

      // getTheme() cae al tema por defecto si el id no existe.
      const theme = getTheme(card.theme).id;
      document.documentElement.setAttribute("data-theme", theme);
      applyBackground(card);

      container.innerHTML = `
        <div class="bg-deco"></div>
        <div class="bg-vignette"></div>
        <main class="container">
          <div id="envelope-container"></div>
        </main>
      `;

      disposeEnvelope = createEnvelope(
        container.querySelector("#envelope-container"),
        card
      );
      disposeDelete = mountDeleteButton(container, id);
    })
    .catch((err) => {
      if (cancelled) return;
      if (err.notFound) {
        renderProblem(container, "Carta no encontrada", "El enlace no es válido o la carta fue borrada.");
      } else {
        renderProblem(container, "No pudimos abrir la carta", "Revisá tu conexión e intentá de nuevo.");
      }
    });

  return function teardown() {
    cancelled = true;
    if (disposeEnvelope) disposeEnvelope();
    if (disposeDelete) disposeDelete();
    disposeEnvelope = null;
    disposeDelete = null;
  };
}
