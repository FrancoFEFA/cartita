import { renderHome } from "./pages/home.js";
import { renderCard } from "./pages/card.js";
import "./styles/style.css";
import "./styles/themes.css";

function resetBackground() {
  const body = document.body;
  body.style.backgroundImage = "";
  body.style.backgroundSize = "";
  body.style.backgroundPosition = "";
  body.style.backgroundRepeat = "";
  body.classList.remove("has-bg");
  document.documentElement.setAttribute("data-theme", "romantic");
}

// Teardown de la vista anterior
// Cada vista devuelve la función que libera lo que dejó puesto. Sin
// llamarla, navegar a una carta tras otra acumula listeners en
// document, el interval de corazones y los timers del typewriter.
let disposeCurrentView = null;

export function navigate() {
  if (typeof disposeCurrentView === "function") {
    disposeCurrentView();
    disposeCurrentView = null;
  }

  const app = document.getElementById("app");
  const path = window.location.pathname;

  // Siempre partimos de la base: si veníamos de una carta con fondo
  // propio, ese fondo no puede quedar puesto en la home.
  resetBackground();

  if (path.startsWith("/card/")) {
    // Un id con % mal formado hace throw decodeURIComponent y dejaría
    // la app en blanco, así que caemos a la home en ese caso.
    let id = path.slice("/card/".length);
    try {
      id = decodeURIComponent(id);
    } catch {
      id = "";
    }
    if (id) {
      disposeCurrentView = renderCard(app, id);
      return;
    }
  }

  disposeCurrentView = renderHome(app);
}

document.addEventListener("DOMContentLoaded", navigate);
window.addEventListener("popstate", navigate);

document.addEventListener("click", (e) => {
  const anchor = e.target.closest("a");
  if (!anchor) return;
  const href = anchor.getAttribute("href");
  if (href && href.startsWith("/") && !href.startsWith("//")) {
    e.preventDefault();
    if (href === window.location.pathname) return;
    window.history.pushState(null, "", href);
    navigate();
  }
});
