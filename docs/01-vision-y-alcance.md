# 01 · Visión y alcance

## 1. Planteamiento del problema

Los agregadores de noticias presentan la información como listas organizadas por tema o por un único país. Quien quiere saber qué ocurre en otro lugar del mundo debe conocer de antemano los medios locales, cambiar de edición o formular búsquedas. No existe una forma directa y visual de "ir" a un lugar y leer lo que pasa allí.

## 2. Visión del producto

> Para personas curiosas por la actualidad internacional, **NewsNow** es una aplicación web instalable que convierte el planeta en el menú de navegación: se gira un globo 3D, se elige un país, región o ciudad y la página entera muestra sus noticias. A diferencia de los agregadores tradicionales, la geografía es la entrada principal y los titulares se conectan visualmente con el lugar del que hablan.

## 3. Objetivos

| ID | Objetivo | Indicador |
| --- | --- | --- |
| OBJ-1 | Permitir explorar noticias por lugar con un máximo de dos interacciones | Seleccionar un país desde la portada requiere un clic en el globo o búsqueda + Enter en el selector |
| OBJ-2 | Cubrir todos los países del atlas, con o sin titulares oficiales en NewsAPI | Todo país seleccionable devuelve titulares o un estado vacío explicado |
| OBJ-3 | Funcionar dentro de la cuota gratuita de NewsAPI (100 peticiones/día) | Ninguna consulta se repite antes de 10 minutos; caché persistida 24 h |
| OBJ-4 | Mantener la API key fuera del navegador | La key no aparece en el bundle ni en las peticiones del cliente |
| OBJ-5 | Ser utilizable sin conexión con lo ya consultado | Portada, guardados y artículos vistos abren sin red |
| OBJ-6 | Ser accesible sin depender del globo 3D | Todo lugar es alcanzable por teclado mediante el selector y los enlaces |

## 4. Usuarios y partes interesadas

| Rol | Descripción | Interés |
| --- | --- | --- |
| Lector (usuario final) | Persona que consulta noticias desde computador o móvil, sin registro | Encontrar rápido noticias de un lugar, guardarlas y compartirlas |
| Lector con tecnología de asistencia | Usa teclado o lector de pantalla | Alternativa equivalente al globo |
| Equipo de desarrollo | Construye y mantiene la app | Código mantenible, pruebas, despliegue simple |
| Product Owner / instructor | Define prioridades y valida entregables | Cumplimiento de requisitos y calidad |
| NewsAPI.org (sistema externo) | Proveedor de datos | Cumplimiento de sus términos de uso y cuota |
| Medios de comunicación (fuentes) | Dueños del contenido | Atribución y enlace al artículo original |

## 5. Alcance

### Incluido en la versión 0.1.0

- Globo 3D interactivo con selección de países, resaltado, vuelo de cámara e indicadores de lugares mencionados en titulares.
- Navegación por mundo, 7 regiones, países del atlas y un catálogo de ciudades principales.
- Portada con titular destacado, banner de última hora, tendencias, rejilla de "Lo último" y filtros por 7 categorías.
- Lector de artículo con extracto, progreso de lectura y enlace a la fuente original.
- Búsqueda por palabras clave.
- Lista de lectura (guardados) local, compartir, centro de notificaciones dentro de la app.
- Tema claro, oscuro o del sistema.
- PWA instalable con caché sin conexión y aviso de nueva versión.
- Proxy de servidor que oculta la API key y restringe endpoints y parámetros.

### Fuera de alcance (versión 0.1.0)

- Registro, inicio de sesión y sincronización entre dispositivos.
- Notificaciones push del sistema operativo.
- Texto completo de los artículos (NewsAPI solo entrega un extracto).
- Interfaz en otros idiomas.
- Comentarios, reacciones o contenido generado por usuarios.
- Panel de administración y analítica.
- Publicación en producción con el plan gratuito de NewsAPI (sus términos lo limitan a desarrollo en localhost).

## 6. Supuestos y dependencias

- El usuario dispone de un navegador moderno; con WebGL se muestra el globo y sin él una alternativa estática más el selector.
- NewsAPI.org mantiene disponibles los endpoints `top-headlines` y `everything` de la v2.
- Existe una API key válida configurada en el servidor (`NEWSAPI_KEY`).
- La geometría de países proviene del paquete `world-atlas` (resolución 110 m) y los nombres de `Intl.DisplayNames`.

## 7. Restricciones

| Tipo | Restricción |
| --- | --- |
| Proveedor | Plan gratuito: 100 peticiones/día, noticias con ~24 h de retraso, contenido truncado, uso solo en localhost |
| Técnica | NewsAPI no ofrece consulta por identificador de artículo: el lector depende de lo ya cargado en la sesión o guardado |
| Técnica | `top-headlines` por país solo existe para un conjunto documentado de países; el resto se resuelve por búsqueda textual |
| Legal | No se reproduce el artículo completo; siempre se enlaza a la fuente |
| Privacidad | No se recolectan datos personales; todo el estado vive en el dispositivo |
