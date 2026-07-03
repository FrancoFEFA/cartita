# Cartita 2.0

Plataforma de cartas animadas personalizables. Crea una carta con tu mensaje, elige tema y fondo, y comparte el enlace. Al abrirlo, el destinatario verá un sobre que se abre con animación, máquina de escribir, música y corazones flotantes.

## Características

- Sobre interactivo animado con GSAP (apertura/cierre, sello de cera, carta deslizante).
- Texto con efecto máquina de escribir.
- Corazones y pétalos flotantes de fondo.
- Música de fondo opcional.
- Múltiples temas visuales (romántico, informático, etc.).
- Fondos personalizables.
- Backend minimalista con almacenamiento en JSON (sin base de datos).
- Enlace compartible por ID único.

## Stack

- **Frontend**: Vanilla JS + Vite + GSAP (sin framework frontend).
- **Backend**: Express.js 5 con almacenamiento en archivo JSON (sin base de datos).
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
│   ├── index.js            # Express API
│   ├── cards.json          # Almacenamiento (NO versionado, se crea solo)
│   └── cards.example.json  # Plantilla de ejemplo (versionada)
└── public/assets/          # Imágenes, SVGs y audio
```

## API

| Método | Ruta             | Descripción                                      |
|--------|------------------|--------------------------------------------------|
| POST   | `/api/cards`     | Crea una carta. Devuelve `{ id, url }`.          |
| GET    | `/api/cards/:id` | Devuelve los datos de una carta por su ID.       |

### Cuerpo del POST

```json
{
  "recipient": "Carolina",
  "sender": "Franco",
  "message": "Estimada Carolina...",
  "theme": "romantic",
  "song": "romantic",
  "background": "default",
  "customBg": null
}
```

Campos requeridos: `recipient`, `message`. El resto son opcionales (con defaults).

## Almacenamiento (`server/cards.json`)

El servidor guarda las cartas en `server/cards.json`. **Este archivo no está versionado** (está en `.gitignore`) porque contiene datos de usuarios y se regenera en tiempo de ejecución.

- Si el archivo no existe al arrancar, el servidor lo crea vacío automáticamente al recibir el primer POST.
- Como referencia de la forma esperada, se incluye `server/cards.example.json` con `{}` (este sí está versionado).

## Flujo de uso

1. El usuario entra a `/` y completa el formulario (destinatario, mensaje, tema, fondo).
2. Al enviar, el backend crea la carta y devuelve un ID único.
3. Se comparte el enlace `https://tu-dominio.com/card/{id}`.
4. El destinatario lo abre, hace clic en el sobre y se reproduce la animación.

## Licencia

MIT © Franco. Ver [`LICENSE`](LICENSE) si aplica. Uso libre para proyectos personales.