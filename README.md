# Cartita 2.0

Plataforma de cartas animadas personalizables. Crea una carta con tu mensaje, elige tema y fondo, y comparte el enlace. Al abrirlo, el destinatario verá un sobre que se abre con animación, máquina de escribir, música y corazones flotantes.

## Características

- Sobre interactivo animado con GSAP (apertura/cierre, sello de cera, carta deslizante).
- Texto con efecto máquina de escribir.
- Corazones y pétalos flotantes de fondo.
- Música de fondo opcional.
- Múltiples temas visuales (romántico, informático, etc.).
- Fondos personalizables.
- Optimización de imágenes subidas vía Sharp (redimensiona a 1920px, quality 0.95, mantiene formato original).
- Backend minimalista con almacenamiento en JSON (sin base de datos).
- Enlace compartible por ID único.

## Stack

- **Frontend**: Vanilla JS + Vite + GSAP (sin framework frontend).
- **Backend**: Express.js 5 + Sharp + Multer con almacenamiento en archivo JSON (sin base de datos).
- **Build**: Vite 6.

## Requisitos

- Node.js 18 o superior.

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

Esto arranca en paralelo (vía `concurrently`):

- **Vite** ( frontend ) en `http://localhost:5173`
- **Express** ( API ) en `http://localhost:3001`

En desarrollo, Vite hace de reverse proxy: las rutas que empiezan con `/api` se redirigen automáticamente al backend en el puerto 3001 (ver `vite.config.js`).

## Producción

```bash
npm run build
NODE_ENV=production npm start
```

- `npm run build` genera el frontend optimizado en `dist/`.
- `NODE_ENV=production npm start` levanta Express en el puerto 3001 (o el definido en `PORT`), sirviendo la API y los archivos estáticos desde `dist/`.

## Estructura

```
Cartita/
├── index.html              # Entry point del frontend
├── vite.config.js          # Configuración de Vite + proxy /api
├── package.json            # Dependencias y scripts
├── src/
│   ├── main.js             # Router client-side
│   ├── api.js              # Llamadas al backend
│   ├── components/         # Envelope, typewriter, hearts
│   └── styles/             # CSS + temas
├── server/
│   ├── index.js            # Express API + Sharp optimización + Multer uploads
│   ├── uploads/            # Imágenes subidas (NO versionado, se crea solo)
│   ├── cards.json          # Almacenamiento (NO versionado, se crea solo)
│   └── cards.example.json  # Plantilla de ejemplo (versionada)
└── public/assets/          # Imágenes, SVGs y audio
```

## API

| Método | Ruta             | Descripción                                      |
|--------|------------------|--------------------------------------------------|
| POST   | `/api/cards`     | Crea una carta. Devuelve `{ id, url }`.          |
| GET    | `/api/cards/:id` | Devuelve los datos de una carta por su ID.       |

### Cuerpo del POST (multipart/form-data)

| Campo       | Tipo     | Requerido | Descripción                          |
|-------------|----------|-----------|--------------------------------------|
| `recipient` | texto    | sí        | Nombre del destinatario              |
| `message`   | texto    | sí        | Contenido de la carta                |
| `sender`    | texto    | no        | Nombre del remitente                 |
| `theme`     | texto    | no        | Tema visual (`romantic`, etc.)       |
| `song`      | texto    | no        | Música de fondo                      |
| `background`| texto    | no        | Fondo (`default` o `custom`)         |
| `customBg`  | archivo  | no        | Imagen de fondo (JPEG, PNG, WebP)    |

La imagen se envía como archivo en el campo `customBg`. El servidor la redimensiona a un máximo de **1920px** de ancho, la comprime con **quality 0.95** y la guarda en `server/uploads/`. El resto de campos se envían como texto en el mismo formulario multipart.

## Almacenamiento

El servidor guarda dos tipos de datos:

- **`server/cards.json`**: metadatos de las cartas (sin imágenes). No está versionado (`.gitignore`) porque contiene datos de usuarios.
- **`server/uploads/`**: imágenes de fondo optimizadas en disco, una por carta. Tampoco está versionado.

Si `cards.json` no existe al arrancar, el servidor lo crea vacío al recibir el primer POST. Como referencia de la forma esperada se incluye `server/cards.example.json` con `{}`.

## Flujo de uso

1. El usuario entra a `/` y completa el formulario (destinatario, mensaje, tema, fondo, imagen opcional).
2. Al enviar, el frontend manda los datos como `multipart/form-data`; el backend procesa la imagen con Sharp (redimensiona y comprime) y guarda todo en `cards.json`.
3. Se comparte el enlace `https://tu-dominio.com/card/{id}`.
4. El destinatario lo abre, hace clic en el sobre y se reproduce la animación.

## Licencia

MIT © Franco. Ver [`LICENSE`](LICENSE) si aplica. Uso libre para proyectos personales.