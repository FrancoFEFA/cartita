# Cartita 2.0

Crea una carta animada con tu mensaje, personalízala con tu estilo, música y fondo, y comparte el enlace. Al abrirlo, el destinatario verá un sobre que se abre con animación, el texto escrito a máquina, la música que elegiste y (según el estilo) corazones flotantes.

## Características

- **Sobre interactivo** que se abre con animación al hacer clic, con sello de cera y carta deslizante.
- **Mensaje con efecto máquina de escribir**.
- **Estilos visuales** elige el ambiente de la carta: Romántico (con pétalos, vignette y corazones flotantes) o Sin estilo (sobrio, solo el fondo y el sobre). Nuevos estilos se pueden agregar fácilmente.
- **Música de fondo**:
  - \u266a **Romántica** \u2014 tema predefinido incluido.
  - **Subir canción propia** \u2014 tu MP3 (hasta 15 MB). La escuchas antes de enviar con el botón **\u25b6 Escuchar muestra**.
  - **Sin música**.
  - Botón \u266a arriba a la derecha en la carta para silenciar o reanudar.
- **Fondos personalizables**: fondo romántico por defecto o **subir tu propia imagen** (JPEG, PNG o WebP hasta 50 MB). El servidor la optimiza automáticamente (redimensiona y comprime) y la limpia cuando la carta se borra.
- **Enlace único** para cada carta, listo para compartir.
- **Bot\u00f3n de preview de m\u00fasica** en el formulario para decidir la canci\u00f3n antes de sellar la carta.

## Stack

- **Frontend**: Vanilla JS + Vite + GSAP (sin framework).
- **Backend**: Express.js 5 + Sharp + Multer con almacenamiento en archivo JSON (sin base de datos).
- **Build**: Vite 6.

## Requisitos

- Node.js 18 o superior.

## Instalaci\u00f3n

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

En desarrollo, Vite hace de reverse proxy: las rutas que empiezan con `/api` se redirigen al backend en el puerto 3001.

## Producci\u00f3n

```bash
npm run build
NODE_ENV=production npm start
```

- `npm run build` genera el frontend optimizado en `dist/`.
- `NODE_ENV=production npm start` levanta Express en el puerto 3001 (o el de `PORT`) y sirve la API + los archivos est\u00e1ticos.

## Uso r\u00e1pido

1. Entr\u00e1 a `/` y complet\u00e1 el formulario: destinatario, mensaje, estilo (Rom\u00e1ntico o Sin estilo), m\u00fasica y fondo.
2. **Previsualiz\u00e1** la m\u00fasica antes de enviar con el enlace **\u25b6 Escuchar muestra** que aparece debajo del selector de m\u00fasica.
3. Si elegiste **Subir canción propia**, seleccion\u00e1 un MP3 (hasta 15 MB) y escuchalo all\u00ed mismo.
4. Si elegiste **Subir imagen propia**, seleccion\u00e1 la imagen de fondo; se optimiza autom\u00e1ticamente.
5. Puls\u00e1 **Sellar y crear carta** y copi\u00e1 el enlace generado.
6. Al abrir el enlace, el destinatario har\u00e1 clic en el sobre y ver\u00e1/escuchar\u00e1 todo lo que configuraste.

### Estilos disponibles

| Estilo | Fondo default | Decoraciones | Sello | Tipograf\u00edas |
|---|---|---|---|---|
| **Rom\u00e1ntico** | Gradiente c\u00e1lido (rosa/crema) | P\u00e9talos, vignette, grano, corazones al abrir | Sello de cera rojo | Parisienne, Playfair, Caveat |
| **Sin estilo** | Gradiente neutro sutil (crema/gris) | Ninguna | Sello gris neutro | Inter (neutra) |

En **Sin estilo**, si sub\u00eds una imagen de fondo, se ve **tal cual la subiste** (sin velo ni borrosidad). Solo el sobre y la carta se superponen con su propia paleta neutra.

## Estilos: c\u00f3mo agregar uno nuevo

Cada estilo vive en **un \u00fanico archivo CSS** autocontenido. Agregar uno nuevo son 3 pasos:

1. **Copi\u00e1** `src/styles/themes/_template.css` como `src/styles/themes/<id>.css` y rellen\u00e1 las variables (colores, fuentes, overlay, decoraciones, sello). El archivo est\u00e1 comentado y gu\u00eda cada bloque.
2. **Registralo en el cat\u00e1logo** `src/data/catalog.js` \u2014 agrega una entrada a `THEMES`:
   ```js
   { id: "<id>", label: "Etiqueta visible", decorations: true }
   ```
   - `decorations: true` \u2192 muestra corazones flotantes al abrir el sobre (JS).
   - `decorations: false` \u2192 los desactiva.
   - Las decoraciones del fondo (p\u00e9talos, vignette, grano) se controlan por CSS en tu archivo de tema.
3. **A\u00f1adelo al agregador** `src/styles/themes.css` con una l\u00ednea:
   ```css
   @import "./themes/<id>.css";
   ```
4. **Validalo en el server** `server/catalog.js` \u2014 agreg\u00e1 `"<id>"` a `VALID_THEMES`.

Listo. El `<select>` de Estilo del formulario lo muestra autom\u00e1ticamente y la carta lo aplica al abrir.

## M\u00fasica: c\u00f3mo agregar una canci\u00f3n al cat\u00e1logo

1. Copi\u00e1 el archivo MP3 en `public/audio/`.
2. En `src/data/catalog.js`, agreg\u00e1 una entrada a `SONGS`:
   ```js
   { id: "<id>", label: "Etiqueta \u266a", file: "/audio/<archivo>.mp3" }
   ```
3. Agreg\u00e1 `"<id>"` a `VALID_SONGS` en `server/catalog.js`.

Aparece autom\u00e1ticamente en el selector de m\u00fasica del formulario.

## API

| M\u00e9todo | Ruta | Descripci\u00f3n |
|---|---|---|
| POST | `/api/cards` | Crea una carta. Devuelve `{ id, url }`. |
| GET | `/api/cards/:id` | Devuelve los datos de una carta por su ID. |
| DELETE | `/api/cards/:id` | Elimina una carta y borra su imagen y canci\u00f3n asociadas. |

### Cuerpo del POST (multipart/form-data)

| Campo | Tipo | Requerido | Descripci\u00f3n |
|---|---|---|---|
| `recipient` | texto | s\u00ed | Nombre del destinatario |
| `message` | texto | s\u00ed | Contenido de la carta |
| `sender` | texto | no | Nombre del remitente |
| `theme` | texto | no | Estilo visual (`romantic`, `none`). Default: `romantic`. |
| `song` | texto | no | M\u00fasica (`romantic`, `custom`, `none`). Default: `romantic`. |
| `background` | texto | no | Fondo (`default` o `custom`) |
| `customBg` | archivo | no | Imagen de fondo (JPEG, PNG, WebP) hasta 50 MB |
| `customSong` | archivo | no | Canci\u00f3n propia **MP3** hasta **15 MB**. Requerido si `song: "custom"`. |

Detalles:
- `theme: "none"` aplica el estilo **Sin estilo** (paleta neutra, sin decoraciones).
- `song: "none"` desactiva la m\u00fasica (no muestra el control ni reproduce).
- `song: "custom"` requiere el archivo `customSong`; se guarda sin transcodificar en el servidor.
- La imagen `customBg` se redimensiona a 1920px m\u00e1ximo y se comprime autom\u00e1ticamente.

## Estructura del proyecto

```
Cartita/
\u2500\u2500 index.html              # Entry point del frontend
\u2500\u2500 vite.config.js          # Configuraci\u00f3n de Vite + proxy /api
\u2500\u2500 package.json            # Dependencias y scripts
\u2500\u2500 src/
\u2502   \u2500\u2500 main.js             # Router client-side
\u2502   \u2500\u2500 api.js              # Llamadas al backend (create/get/delete)
\u2502   \u2500\u2500 data/
\u2502   \u2502   \u2500\u2500 catalog.js      # Cat\u00e1logo de canciones, estilos y fondos
\u2502   \u2500\u2500 components/         # Envelope, typewriter, hearts, music
\u2502   \u2500\u2500 styles/
\u2502       \u2500\u2500 style.css          # Reset + layout + estilos base (vars neutras)
\u2502       \u2500\u2500 themes.css          # Agregador (@imports)
\u2502       \u2500\u2500 themes/
\u2502           \u2500\u2500 romantic.css     # Estilo Rom\u00e1ntico
\u2502           \u2500\u2500 none.css         # Estilo Sin estilo
\u2502           \u2500\u2500 _template.css    # Plantilla para crear nuevos estilos
\u2500\u2500 server/
\u2502   \u2500\u2500 index.js            # Express API + Sharp + Multer + cleanup uploads
\u2502   \u2500\u2500 catalog.js          # Validaciones y constantes del backend
\u2502   \u2500\u2500 cards.json          # Datos de las cartas (no versionado)
\u2502   \u2500\u2500 cards.example.json  # Plantilla de ejemplo
\u2502   \u2500\u2500 uploads/            # Im\u00e1genes y canciones subidas (no versionado)
\u2500\u2500 public/
    \u2500\u2500 favicon.png         # Favicon
    \u2500\u2500 audio/              # Canciones del cat\u00e1logo (romantic.mp3)
    \u2500\u2500 img/                # SVGs (heart, petal, rose, wax-seal, flourish)
```

## Almacenamiento y limpieza

- Las cartas se guardan en `server/cards.json` y los archivos subidos (im\u00e1genes y canciones) en `server/uploads/`. Ambos no se versionan.
- Al arrancar, el servidor **limpia autom\u00e1ticamente** los archivos hu\u00e9rfanos (im\u00e1genes o canciones no referenciados por ninguna carta).
- Al borrar una carta con `DELETE` se eliminan tambi\u00e9n su imagen y su canci\u00f3n asociadas.

## Licencia

MIT \u00a9 Franco. Uso libre para proyectos personales.