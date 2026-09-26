# Cartita 2.0

Crea una carta animada con tu mensaje, personalízala con tu estilo, música y fondo, y comparte el enlace. Al abrirlo, el destinatario verá un sobre que se abre con animación, el texto escrito a máquina, la música que elegiste y (según el estilo) corazones flotantes.

## Características

- **Sobre interactivo** que se abre con animación al hacer clic, con sello de cera y carta deslizante.
- **Efecto máquina de escribir** para el mensaje.
- **Estilos visuales** — Romántico (pétalos, vignette, grano, corazones flotantes) o Sin estilo (sobrio, solo fondo y sobre). Fácil de extender con nuevos temas.
- **Música de fondo**:
  - ♪ **Romántica** — tema predefinido incluido.
  - **Subir canción propia** — tu MP3 (hasta 15 MB), con preview antes de enviar.
  - **Sin música**.
  - Botón ♪ en la carta para silenciar/reanudar.
- **Fondos personalizables** — fondo romántico por defecto o **subir tu propia imagen** (JPEG, PNG, WebP o AVIF hasta 50 MB). Se optimiza automáticamente (redimensiona a 1920px y comprime).
- **Enlace único** para compartir cada carta.
- **Limpieza automática** de archivos huérfanos al arrancar y al borrar una carta.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Vanilla JS + Vite 6 + GSAP (sin framework) |
| Backend | Express 5 + Sharp + Multer |
| Almacenamiento | JSON file (sin base de datos) |

## Requisitos

- Node.js 18+

## Instalación

```bash
git clone https://github.com/FrancoFEFA/cartita.git
cd cartita
npm install
```

## Desarrollo

```bash
npm run dev
```

Levanta en paralelo (con `concurrently`):

- **Vite** (frontend) en `http://localhost:5173`
- **Express** (API) en `http://localhost:3001`

En desarrollo, Vite hace de reverse proxy: las rutas `/api` y `/uploads` se redirigen al backend.

## Producción

```bash
npm run build
NODE_ENV=production TRUST_PROXY=1 npm start
```

- `npm run build` genera el frontend optimizado en `dist/`.
- Express sirve la API + los archivos estáticos en el puerto 3001 (o `PORT`).
- `TRUST_PROXY=1` es necesario si hay un proxy o load balancer delante, si no
  el rate limiting ve a todos los visitantes como una sola IP.

## Uso rápido

1. Entrá a `/` y completá el formulario: destinatario, mensaje, estilo, música y fondo.
2. **Previsualizá** la música con **▶ Escuchar muestra** antes de enviar.
3. Si elegiste **Subir canción propia**, seleccioná un MP3 (hasta 15 MB).
4. Si elegiste **Subir imagen propia**, seleccioná la imagen de fondo.
5. Pulsá **Sellar y crear carta** y copiá el enlace generado.
6. Al abrir el enlace, el destinatario hará clic en el sobre y verá/escuchará todo lo que configuraste.

### Estilos disponibles

| Estilo | Fondo | Decoraciones | Sello | Tipografías |
|--------|-------|--------------|-------|-------------|
| **Romántico** | Gradiente cálido (rosa/crema) | Pétalos, vignette, grano, corazones | Sello de cera rojo | Parisienne, Playfair, Caveat |
| **Sin estilo** | Gradiente neutro (crema/gris) | Ninguna | Sello gris neutro | Inter |

En **Sin estilo** con imagen de fondo personalizada, la imagen se ve **tal cual** (sin velo ni borrosidad).

## Agregar un nuevo estilo

Cada estilo vive en **un archivo CSS autocontenido**:

1. Copiá `src/styles/themes/_template.css` como `src/styles/themes/<id>.css` y configurá las variables CSS.
2. Registralo en `src/data/catalog.js`:
   ```js
   { id: "<id>", label: "Etiqueta visible", decorations: true }
   ```
   - `decorations: true` muestra corazones flotantes al abrir el sobre.
   - Las decoraciones de fondo (pétalos, vignette) se controlan por CSS.
3. Agregalo al aggregador `src/styles/themes.css`:
   ```css
   @import "./themes/<id>.css";
   ```
4. Validalo en `server/catalog.js` — agregá `"<id>"` a `VALID_THEMES`.

## Agregar una canción al catálogo

1. Copiá el MP3 a `public/audio/`.
2. En `src/data/catalog.js`, agregá una entrada a `SONGS`:
   ```js
   { id: "<id>", label: "Etiqueta ♪", file: "/audio/<archivo>.mp3" }
   ```
3. Agregá `"<id>"` a `VALID_SONGS` en `server/catalog.js`.

## API

### Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/cards` | Crea una carta. Devuelve `{ id, url, manageKey }`. |
| GET | `/api/cards/:id` | Devuelve los datos de una carta. |
| DELETE | `/api/cards/:id` | Elimina una carta y sus archivos. **Requiere la clave de gestión.** |

### POST `/api/cards` (multipart/form-data)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `recipient` | texto | sí | Nombre del destinatario (máx. 80 caracteres) |
| `message` | texto | sí | Contenido de la carta (máx. 4000 caracteres) |
| `sender` | texto | no | Nombre del remitente (máx. 80 caracteres) |
| `theme` | texto | no | `romantic` (default) o `none` |
| `song` | texto | no | `romantic` (default), `custom` o `none` |
| `background` | texto | no | `default` o `custom` |
| `customBg` | archivo | no | Imagen (JPEG/PNG/WebP/AVIF, hasta 50 MB) |
| `customSong` | archivo | no | MP3 (hasta 15 MB). Requerido si `song: "custom"` |

La respuesta incluye un `manageKey` que **solo se muestra una vez**. Es lo
único que permite borrar la carta después, así que el frontend la guarda en
`localStorage` (`cartita:managed`). Si el visitante borra los datos del
navegador, pierde el control de su carta: la carta sigue existiendo.

Notas:
- `song: "custom"` requiere el archivo `customSong`; se guarda sin transcodificar.
- `customBg` se redimensiona a 1920px máximo y se comprime automáticamente.
- `song: "none"` desactiva la música por completo.
- Si un archivo se rechaza, no queda nada huérfano en `uploads/`.

### DELETE `/api/cards/:id`

La clave de gestión se puede mandar de tres formas (el servidor acepta
cualquiera):

```bash
curl -X DELETE http://localhost:3001/api/cards/abc12345 \
  -H "x-card-key: <manageKey>"
```

También sirve como query (`?key=...`) o en el body JSON (`{ "key": "..." }`).
Sin clave correcta: `401`. El ID son 8 caracteres hexadecimales, por eso la
clave es obligatoria y no alcanza con adivinarlo.

## Límites de peticiones

El servidor aplica rate limiting por IP. Los valores están en
`server/catalog.js` (`RATE_LIMITS`):

| Alcance | Ventana | Máximo |
|---------|---------|--------|
| Toda la API | 15 min | 300 peticiones |
| `POST /api/cards` | 1 hora | 20 cartas |
| `DELETE /api/cards/:id` | 15 min | 60 peticiones |

## Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `PORT` | `3001` | Puerto del servidor |
| `NODE_ENV` | — | `production` habilita el servicio de `dist/` |
| `TRUST_PROXY` | — | **Definilo si hay un proxy delante** (Nginx, Cloudflare, Fly). Sin esto, el rate limiting cuenta a todos los visitantes como una sola IP. Acepta `1`, `true` o un número de saltos. |
| `RATE_LIMIT` | — | `off` desactiva el rate limiting (solo para desarrollo) |

Ejemplo para producción:

```bash
NODE_ENV=production TRUST_PROXY=1 npm start
```


## Estructura del proyecto

```
Cartita/
├── index.html                  # Entry point HTML
├── vite.config.js              # Configuración de Vite + proxy /api
├── package.json                # Dependencias y scripts
├── src/
│   ├── main.js                 # Router client-side + teardown de vistas
│   ├── api.js                  # Llamadas al backend
│   ├── data/
│   │   ├── catalog.js          # Catálogo de canciones, estilos y fondos
│   │   └── ownership.js        # Claves de gestión en localStorage
│   ├── pages/
│   │   ├── home.js             # Formulario de creación
│   │   └── card.js             # Vista de carta (envelope)
│   ├── components/
│   │   ├── envelope.js         # Sobre con animación de apertura
│   │   ├── typewriter.js       # Efecto máquina de escribir (cancelable)
│   │   ├── hearts.js           # Corazones/pétalos flotantes (GSAP)
│   │   └── music.js            # Control de música + preview
│   └── styles/
│       ├── style.css           # Reset + layout + variables base
│       ├── themes.css          # Agregador de imports de temas
│       └── themes/
│           ├── romantic.css    # Estilo Romántico
│           ├── none.css        # Estilo Sin estilo
│           └── _template.css   # Plantilla para nuevos estilos
├── server/
│   ├── index.js                # Express API + Sharp + Multer + rate limit
│   ├── catalog.js              # Validaciones, límites y constantes
│   ├── cards.json              # Datos de cartas (no versionado)
│   ├── cards.example.json      # Plantilla de ejemplo
│   └── uploads/                # Imágenes y canciones subidas (no versionado)
└── public/
    ├── favicon.png
    ├── audio/                  # Canciones del catálogo
    └── img/                    # SVGs (heart, petal, rose, wax-seal, flourish)
```

## Almacenamiento y limpieza

- Las cartas se guardan en `server/cards.json` y los archivos subidos en `server/uploads/`. Ambos están en `.gitignore`.
- Al arrancar, el servidor **limpia automáticamente** los archivos huérfanos (imágenes o canciones no referenciados por ninguna carta).
- Al borrar una carta con `DELETE` se eliminan también su imagen y canción asociadas.
- Si un POST falla a medio camino, los archivos ya escritos se dan de baja: `uploads/` no acumula basura entre reinicios.
- Si `cards.json` llegara a estar corrupto, el servidor no deja de arrancar: copia el archivo a `cards.json.corrupto-<timestamp>` y sigue con la base vacía en vez de perderlo todo.


## Licencia

MIT © Franco. Uso libre para proyectos personales.
