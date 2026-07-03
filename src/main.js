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

function navigate() {
  const app = document.getElementById("app");
  const path = window.location.pathname;

  if (path.startsWith("/card/")) {
    const id = path.replace("/card/", "");
    renderCard(app, id);
  } else {
    resetBackground();
    renderHome(app);
  }
}

document.addEventListener("DOMContentLoaded", navigate);
window.addEventListener("popstate", navigate);

document.addEventListener("click", (e) => {
  const anchor = e.target.closest("a");
  if (!anchor) return;
  const href = anchor.getAttribute("href");
  if (href && href.startsWith("/")) {
    e.preventDefault();
    window.history.pushState(null, "", href);
    navigate();
  }
});
