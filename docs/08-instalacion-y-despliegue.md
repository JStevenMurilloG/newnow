# 08 · Instalación, configuración y despliegue

## 1. Requisitos previos

| Requisito | Detalle |
| --- | --- |
| Node.js | 18 o superior (recomendado 20 LTS) |
| npm | Incluido con Node.js |
| API key de NewsAPI | Gratuita en https://newsapi.org/account |
| Navegador | Chrome, Edge, Firefox o Safari actuales, con WebGL |

## 2. Instalación local

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` como `.env.local` y pegar la key:

   ```
   NEWSAPI_KEY=tu_key
   ```

   La variable **no** lleva el prefijo `VITE_`: así solo la lee el servidor y nunca llega al navegador.

3. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

4. Abrir http://localhost:5180

## 3. Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con el proxy `/api/news` (puerto 5180) |
| `npm run build` | Comprueba tipos y genera `dist/` con service worker y manifiesto |
| `npm run preview` | Sirve `dist/` con el proxy (puerto 5181) para probar la PWA instalable |
| `npm test` | Ejecuta las pruebas unitarias |
| `node scripts/make-icons.mjs` | Regenera los iconos de la PWA |

## 4. Variables de entorno

| Variable | Obligatoria | Dónde | Descripción |
| --- | --- | --- | --- |
| `NEWSAPI_KEY` | Sí | Servidor (`.env.local` o secretos del proveedor) | API key de NewsAPI |
| `PORT` | No | Servidor | Cambia el puerto de `dev` o `preview` |

Los archivos `.env`, `.env.local` y `.env.*.local` están excluidos del control de versiones. Nunca se debe subir una key al repositorio.

## 5. Entornos

| Entorno | Cómo se sirve `/api/news` | Caché del proxy |
| --- | --- | --- |
| Desarrollo (`dev`) | Middleware de Vite | `no-store` |
| Vista previa (`preview`) | Middleware de Vite sobre `dist/` | `no-store` |
| Producción en Vercel | Función serverless `api/news.ts` | 10 minutos en CDN para respuestas 200 |
| Producción en Netlify | Función `netlify/functions/news.mts`, publicada en `/api/news` | 10 minutos en CDN para respuestas 200 |

Los tres adaptadores comparten `server/newsProxy.ts`: la API key solo se lee en el servidor.

## 6. Despliegue en producción

> **Importante:** el plan gratuito de NewsAPI solo permite peticiones desde localhost. Publicar la app requiere un plan de pago.

### 6.1 Netlify

El proyecto incluye `netlify.toml` (build, carpeta de funciones y regla para las rutas de la SPA) y la función `netlify/functions/news.mts`.

1. Importar el repositorio en Netlify. El comando de build (`npm run build`) y el directorio de salida (`dist`) se leen de `netlify.toml`.
2. En el panel del sitio, definir la variable de entorno `NEWSAPI_KEY`, **sin** prefijo `VITE_`. La función la lee con `Netlify.env.get`.
3. Desplegar.
4. Ejecutar los casos CP-01, CP-10, CP-29 y CP-31 del plan de pruebas sobre el dominio publicado.

Cómo viaja la key: el navegador pide `/api/news` a tu dominio sin ninguna key; la función la toma del entorno de Netlify y la envía a NewsAPI en la cabecera `X-Api-Key`. Nunca aparece en `dist/` ni en las peticiones del navegador.

### 6.2 Vercel

1. Importar el repositorio. Comando de build `npm run build`, directorio de salida `dist`.
2. Definir `NEWSAPI_KEY` como variable de entorno.
3. Añadir una regla de reescritura para que las rutas de la SPA (`/c/co`, `/search`, etc.) respondan con `index.html`, excepto `/api/*`. Esta regla no está configurada en el proyecto.
4. Desplegar y ejecutar los mismos casos de prueba.

### 6.3 La key nunca va en el repositorio

El archivo `.env` no debe versionarse: la key se configura en el panel del proveedor. Si una key llega a subirse a un repositorio, hay que regenerarla en la cuenta de NewsAPI, porque queda en el historial aunque se borre el archivo.

## 7. Verificación tras instalar

| Comprobación | Resultado esperado |
| --- | --- |
| Abrir http://localhost:5180 | Portada con globo y titulares |
| Abrir http://localhost:5180/api/news?endpoint=top-headlines&language=en&pageSize=1 | JSON con `"status":"ok"` |
| `npm test` | 9 pruebas aprobadas |
| `npm run build` | Carpeta `dist/` generada sin errores |

## 8. Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| "Falta la API key de NewsAPI" | No existe `.env.local` o la variable está vacía | Crear el archivo y reiniciar el servidor |
| "La API key no es válida" | Key mal copiada o desactivada | Revisar el valor en la cuenta de NewsAPI y reiniciar |
| "Se alcanzó el límite de consultas" | Se agotaron las 100 peticiones del día | Esperar al reinicio de la cuota; lo ya visto sigue disponible |
| Pocas noticias o con un día de retraso | Limitación del plan gratuito | Comportamiento esperado |
| El globo no aparece | Navegador sin WebGL o aceleración desactivada | Activar la aceleración por hardware o usar el selector |
| Cambios que no se reflejan en `preview` | Service worker con versión anterior | Pulsar "Actualizar" en el aviso o borrar los datos del sitio |
| Puerto ocupado | Otro proceso usa 5180 o 5181 | Definir `PORT` con otro valor |

## 9. Mantenimiento

- **Dependencias:** revisar actualizaciones periódicamente con `npm outdated`.
- **Caché de consultas:** si cambia el formato de los datos, incrementar el valor `buster` en `src/main.tsx` para invalidar la caché guardada en los dispositivos.
- **Ciudades y regiones:** se editan en `src/data/cities.ts` y `src/data/regions.ts`.
- **Países con titulares oficiales e idiomas:** listas en `src/lib/newsapi.ts`; actualizarlas si NewsAPI cambia su cobertura.
