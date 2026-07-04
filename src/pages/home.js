import { createCard } from "../api.js";

export function renderHome(container) {
  container.innerHTML = `
    <style>
      .form-page {
        width: 100%;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 28px 18px;
      }

      .letter-paper {
        position: relative;
        width: 100%;
        max-width: 560px;
        max-height: calc(100vh - 56px);
        overflow-y: auto;
        background-color: var(--letter-bg);
        background-image:
          repeating-linear-gradient(0deg, transparent 0 31px, rgba(201,169,110,0.18) 31px 32px),
          radial-gradient(120% 80% at 50% 0%, rgba(247,230,224,0.55), transparent 60%);
        color: var(--text-color);
        padding: 48px 42px 38px;
        border-radius: 4px;
        box-shadow:
          0 24px 60px rgba(122,59,63,0.28),
          0 8px 18px rgba(122,59,63,0.15);
        font-family: var(--font-body);
      }
      /* Doble borde decorativo */
      .letter-paper::before {
        content: '';
        position: absolute;
        inset: 12px;
        border: 1px solid var(--accent-gold);
        border-radius: 2px;
        pointer-events: none;
        opacity: 0.7;
      }
      .letter-paper::after {
        content: '';
        position: absolute;
        inset: 16px;
        border: 1px dashed var(--accent-gold-soft);
        border-radius: 2px;
        pointer-events: none;
        opacity: 0.55;
      }

      /* Flourishes en esquinas */
      .flourish {
        position: absolute;
        width: 78px;
        height: 78px;
        background-image: url('/assets/flourish.svg');
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        opacity: 0.85;
        z-index: 2;
      }
      .flourish.tl { top: 4px; left: 4px; }
      .flourish.tr { top: 4px; right: 4px; transform: scaleX(-1); }
      .flourish.bl { bottom: 4px; left: 4px; transform: scaleY(-1); }
      .flourish.br { bottom: 4px; right: 4px; transform: scale(-1,-1); }

      .letter-head {
        text-align: center;
        margin-bottom: 8px;
      }
      .letter-head .eyebrow {
        font-family: var(--font-script);
        color: var(--accent-gold);
        font-size: 1.25rem;
        letter-spacing: 1px;
        opacity: 0.9;
      }
      .letter-head h1 {
        font-family: var(--font-title);
        color: var(--primary-deep);
        font-size: 2.7rem;
        font-weight: 700;
        line-height: 1;
        margin-top: 2px;
      }
      .letter-sub {
        text-align: center;
        font-family: var(--font-hand);
        color: var(--text-soft);
        font-size: 1.25rem;
        margin-bottom: 22px;
      }
      .divider {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin: 0 auto 22px;
        max-width: 320px;
      }
      .divider::before,
      .divider::after {
        content: '';
        height: 1px;
        flex: 1;
        background: linear-gradient(90deg, transparent, var(--accent-gold), transparent);
      }
      .divider .glyph {
        font-family: var(--font-script);
        color: var(--accent-gold);
        font-size: 1.3rem;
      }

      .field {
        position: relative;
        margin-top: 22px;
      }
      .field label {
        display: block;
        font-family: var(--font-title);
        font-style: italic;
        font-size: 0.95rem;
        color: var(--primary-deep);
        margin-bottom: 6px;
        letter-spacing: 0.4px;
      }
      .field input,
      .field textarea,
      .field select {
        width: 100%;
        padding: 8px 4px;
        border: none;
        border-bottom: 1.2px solid var(--accent-gold-soft);
        background: transparent;
        color: var(--text-color);
        font-size: 1.1rem;
        font-family: var(--font-hand);
        outline: none;
        border-radius: 0;
        transition: border-color 0.25s ease, background 0.25s ease;
      }
      .field input::placeholder,
      .field textarea::placeholder {
        color: rgba(122,59,63,0.35);
        font-family: var(--font-hand);
      }
      .field input:focus,
      .field textarea:focus,
      .field select:focus {
        border-bottom-color: var(--primary-color);
        background: rgba(247,230,224,0.35);
      }
      .field textarea {
        resize: vertical;
        min-height: 70px;
        max-height: 150px;
        line-height: 1.5;
      }
      .field select {
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        padding-right: 24px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 4 L6 9 L10 4' fill='none' stroke='%23c9a96e' stroke-width='1.4'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 4px center;
        background-size: 12px;
      }

      .row {
        display: flex;
        gap: 18px;
      }
      .row .field { flex: 1; }
      .row.first-row { margin-top: 38px; }

      .bg-preview {
        margin-top: 10px;
        height: 70px;
        border-radius: 6px;
        border: 1px dashed var(--accent-gold-soft);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-hand);
        font-size: 1.05rem;
        color: var(--text-soft);
        opacity: 0.75;
        overflow: hidden;
        background-size: cover;
        background-position: center;
        transition: opacity 0.2s, border-style 0.2s;
      }
      .bg-preview.has-image { opacity: 1; border-style: solid; }
      #bg-file {
        margin-top: 8px;
        font-size: 0.82rem;
        color: var(--text-soft);
      }

      .send-btn {
        display: block;
        margin: 28px auto 0;
        padding: 14px 44px;
        border: none;
        border-radius: 40px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-deep));
        color: #fff;
        font-family: var(--font-title);
        font-size: 1.1rem;
        font-weight: 600;
        letter-spacing: 1px;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(194,90,99,0.35);
        transition: transform 0.15s ease, box-shadow 0.2s ease, opacity 0.2s ease;
      }
      .send-btn:hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(194,90,99,0.45); }
      .send-btn:active { transform: translateY(0) scale(0.98); }
      .send-btn:disabled { opacity: 0.55; cursor: not-allowed; }

      /* Resultado: link listo para enviar */
      .share-result {
        position: fixed;
        bottom: 26px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        z-index: 60;
        width: min(92vw, 480px);
        background: rgba(253,246,240,0.97);
        border: 1px solid var(--accent-gold);
        border-radius: 16px;
        padding: 18px 18px 16px;
        text-align: center;
        box-shadow: 0 16px 40px rgba(122,59,63,0.30);
        backdrop-filter: blur(10px);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease, transform 0.35s ease;
      }
      .share-result.show {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }
      .share-result h3 {
        font-family: var(--font-script);
        color: var(--primary-deep);
        font-size: 1.6rem;
        margin-bottom: 4px;
      }
      .share-result p.hint {
        font-family: var(--font-hand);
        color: var(--text-soft);
        font-size: 1.05rem;
        margin-bottom: 12px;
      }
      .share-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .share-row input {
        flex: 1;
        border: 1px solid var(--accent-gold-soft);
        border-radius: 10px;
        padding: 9px 12px;
        font-family: var(--font-body);
        font-size: 0.86rem;
        color: var(--text-color);
        background: var(--cream);
        outline: none;
        user-select: all;
      }
      .share-row button {
        border: none;
        border-radius: 10px;
        padding: 9px 18px;
        background: var(--primary-color);
        color: #fff;
        font-weight: 600;
        cursor: pointer;
        transition: opacity 0.2s, transform 0.15s;
        white-space: nowrap;
      }
      .share-row button:hover { opacity: 0.88; }
      .share-row button:active { transform: scale(0.96); }
      .share-result .copied {
        font-size: 0.78rem;
        color: var(--accent-gold);
        margin-top: 8px;
        min-height: 14px;
      }
      .share-close {
        position: absolute;
        top: 4px;
        right: 10px;
        background: none;
        border: none;
        font-size: 1.6rem;
        color: var(--text-soft);
        cursor: pointer;
        line-height: 1;
        padding: 4px;
        transition: color 0.2s;
        z-index: 2;
      }
      .share-close:hover { color: var(--primary-deep); }
      .retry-btn {
        display: block;
        margin: 10px auto 0;
        padding: 10px 28px;
        border: none;
        border-radius: 40px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-deep));
        color: #fff;
        font-family: var(--font-title);
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 6px 16px rgba(194,90,99,0.3);
        transition: transform 0.15s, box-shadow 0.2s;
      }
      .retry-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(194,90,99,0.4); }
      .retry-btn:active { transform: translateY(0) scale(0.98); }
    </style>

    <div class="bg-deco"></div>
    <div class="bg-vignette"></div>

    <div class="form-page">
      <form class="letter-paper" id="create-form">
        <span class="flourish tl"></span>
        <span class="flourish tr"></span>
        <span class="flourish bl"></span>
        <span class="flourish br"></span>

        <div class="letter-head">
          <div class="eyebrow">Cartita</div>
          <h1>Escribe tu carta</h1>
        </div>
        <div class="letter-sub">Crea una carta animada y comparte el enlace con quien amas</div>

        <div class="divider"><span class="glyph">❦</span></div>

        <div class="row first-row">
          <div class="field">
            <label for="recipient">Para</label>
            <input type="text" id="recipient" required placeholder="Su nombre…">
          </div>
          <div class="field">
            <label for="sender">De</label>
            <input type="text" id="sender" placeholder="Tu nombre…">
          </div>
        </div>

        <div class="field">
          <label for="message">Tu mensaje</label>
          <textarea id="message" required placeholder="Escribe aquí lo que sientes…"></textarea>
        </div>

        <div class="row">
          <div class="field">
            <label for="theme">Estilo</label>
            <select id="theme">
              <option value="romantic">Romántico</option>
            </select>
          </div>
          <div class="field">
            <label for="song">Música de fondo</label>
            <select id="song">
              <option value="romantic">Romántica ♪</option>
              <option value="">Sin música</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label for="background-select">Fondo</label>
          <select id="background-select">
            <option value="default">Por defecto (romántico)</option>
            <option value="custom">Subir imagen propia</option>
          </select>
          <div class="bg-preview" id="bg-preview">Vista previa del fondo</div>
          <input type="file" id="bg-file" accept="image/*" style="display:none;">
        </div>

        <button type="submit" class="send-btn" id="submit-btn">Sellar y crear carta</button>
      </form>
    </div>

    <div class="share-result" id="share-result">
      <button type="button" id="share-close" class="share-close" aria-label="Cerrar">×</button>
      <h3 id="share-title">Carta sellada ✨</h3>
      <p class="hint" id="share-hint">Tu carta está lista. Copia el enlace y envíalo:</p>
      <div class="share-row" id="share-row">
        <input type="text" id="share-input" readonly>
        <button type="button" id="copy-btn">Copiar</button>
      </div>
      <div class="copied" id="copied-msg"></div>
      <button type="button" id="retry-btn" class="retry-btn" style="display:none;">Reintentar</button>
    </div>
  `;

  const form = container.querySelector("#create-form");
  const submitBtn = container.querySelector("#submit-btn");
  const bgSelect = container.querySelector("#background-select");
  const bgFile = container.querySelector("#bg-file");
  const bgPreview = container.querySelector("#bg-preview");

  const shareResult = container.querySelector("#share-result");
  const shareInput = container.querySelector("#share-input");
  const copyBtn = container.querySelector("#copy-btn");
  const copiedMsg = container.querySelector("#copied-msg");
  const shareTitle = container.querySelector("#share-title");
  const shareHint = container.querySelector("#share-hint");
  const shareRow = container.querySelector("#share-row");
  const shareClose = container.querySelector("#share-close");
  const retryBtn = container.querySelector("#retry-btn");

  let customBgDataUrl = null;

  function optimizeImage(file) {
    return new Promise((resolve, reject) => {
      const MAX_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        reject(new Error("La imagen es demasiado grande. Máximo 10 MB."));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_W = 1920;
          const QUALITY = 0.95;
          if (img.width <= MAX_W && img.height <= MAX_W && file.size < 1024 * 1024) {
            resolve(e.target.result);
            return;
          }
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > MAX_W) {
            height = Math.round(height * (MAX_W / width));
            width = MAX_W;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type || "image/jpeg";
          try {
            resolve(canvas.toDataURL(mime, QUALITY));
          } catch {
            resolve(canvas.toDataURL("image/jpeg", QUALITY));
          }
        };
        img.onerror = () => reject(new Error("No se pudo leer la imagen. Intenta con otro archivo."));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo."));
      reader.readAsDataURL(file);
    });
  }

  bgSelect.addEventListener("change", () => {
    if (bgSelect.value === "custom") {
      bgFile.style.display = "block";
      bgFile.click();
    } else {
      bgFile.style.display = "none";
      customBgDataUrl = null;
      bgPreview.classList.remove("has-image");
      bgPreview.style.backgroundImage = "";
      bgPreview.textContent = "Vista previa del fondo";
    }
  });

  bgFile.addEventListener("change", async () => {
    const file = bgFile.files[0];
    if (!file) return;
    bgPreview.textContent = "Optimizando imagen…";
    try {
      const dataUrl = await optimizeImage(file);
      customBgDataUrl = dataUrl;
      bgPreview.classList.add("has-image");
      bgPreview.style.backgroundImage = `url('${customBgDataUrl}')`;
      bgPreview.textContent = "";
    } catch (err) {
      customBgDataUrl = null;
      bgPreview.classList.remove("has-image");
      bgPreview.style.backgroundImage = "";
      bgPreview.textContent = err.message || "Error al procesar la imagen";
    }
  });

  function showShare(url) {
    const link = `${window.location.origin}${url}`;
    shareInput.value = link;
    shareTitle.textContent = "Carta sellada ✨";
    shareHint.textContent = "Tu carta está lista. Copia el enlace y envíalo:";
    shareRow.style.display = "";
    retryBtn.style.display = "none";
    shareResult.classList.add("show");
    shareInput.focus();
    shareInput.select();
  }

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(shareInput.value);
      copiedMsg.textContent = "¡Enlace copiado! Ya puedes pegarlo y enviarlo.";
    } catch {
      shareInput.select();
      document.execCommand("copy");
      copiedMsg.textContent = "¡Enlace copiado! Ya puedes pegarlo y enviarlo.";
    }
    setTimeout(() => (copiedMsg.textContent = ""), 3500);
  });

  shareClose.addEventListener("click", () => {
    shareResult.classList.remove("show");
  });

  retryBtn.addEventListener("click", () => {
    shareResult.classList.remove("show");
    setTimeout(() => form.requestSubmit(), 350);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.textContent = "Sellando…";

    const data = {
      recipient: form.recipient.value.trim(),
      sender: form.sender.value.trim(),
      message: form.message.value.trim(),
      theme: form.theme.value,
      song: form.song.value,
      background: bgSelect.value,
      customBg: customBgDataUrl,
    };

    try {
      const result = await createCard(data);
      showShare(result.url);
    } catch (err) {
      copiedMsg.textContent = "";
      shareTitle.textContent = "Algo salió mal";
      shareHint.textContent = err.message || "No se pudo crear la carta.";
      shareRow.style.display = "none";
      retryBtn.style.display = "block";
      shareResult.classList.add("show");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Sellar y crear carta";
    }
  });
}