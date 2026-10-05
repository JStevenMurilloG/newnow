# NewsNow

PWA de noticias con un globo 3D interactivo: selecciona un país, región o ciudad y toda la página pasa a mostrar sus noticias. Datos de [NewsAPI](https://newsapi.org/).

## Puesta en marcha

1. `npm install`
2. Copia `.env.example` a `.env.local` y pega tu key en `NEWSAPI_KEY` (sin prefijo `VITE_`: solo la lee el servidor).
3. `npm run dev` → http://localhost:5180

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con el proxy `/api/news` |
| `npm run build` | Comprueba tipos y genera `dist/` con service worker y manifest |
| `npm run preview` | Sirve `dist/` (http://localhost:5181) para probar la PWA instalable |
| `npm test` | Pruebas de la capa de datos y de geografía |
| `node scripts/make-icons.mjs` | Regenera los iconos de la PWA |

## Cómo se consume NewsAPI

El navegador nunca habla con `newsapi.org` ni ve la key. Pide `/api/news?endpoint=…` y el servidor añade la cabecera:

- En desarrollo y `preview`, un middleware de Vite (`vite.config.ts`).
- En producción, la función serverless `api/news.ts` (formato Vercel). Ambos comparten `server/newsProxy.ts`, que solo deja pasar `top-headlines` y `everything`.

Noticias por lugar (`src/lib/newsapi.ts`):

- **Mundo:** `/top-headlines?language=en`.
- **País:** `/top-headlines?country=xx`; si viene vacío, `/everything` con el nombre del país en su idioma principal.
- **Región y ciudad:** `/everything` con el nombre del lugar.

### Límites del plan gratuito

- 100 peticiones al día y noticias con ~24 h de retraso. La app guarda los resultados 10 minutos y los persiste en el dispositivo.
- Solo se permite en desarrollo (localhost). Publicar la app requiere un plan de pago.
- El contenido llega truncado, así que el lector muestra un extracto y enlaza a la fuente.

## Estructura

- `src/globe/` — escena 3D (react-three-fiber): planeta pintado desde datos vectoriales, atmósfera, resaltado, cámara y selección de países.
- `src/lib/` — cliente de NewsAPI, geografía (países, regiones, ciudades) y utilidades.
- `src/components/`, `src/styles/` — sistema de diseño; los tokens están en `styles/tokens.css`.
- `src/pages/` — portada, lector, búsqueda y guardados.
