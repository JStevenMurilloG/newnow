# 02 · Especificación de requisitos (SRS)

Estructura inspirada en IEEE 830 / ISO/IEC/IEEE 29148. El detalle de cada requisito está en las bases de datos:

- **Requisitos funcionales:** `requisitos-funcionales.csv` (RF-01 a RF-35)
- **Requisitos no funcionales:** `requisitos-no-funcionales.csv` (RNF-01 a RNF-29)

## 1. Propósito y ámbito

Este documento especifica qué debe hacer NewsNow v0.1.0 y bajo qué condiciones de calidad. Va dirigido al equipo de desarrollo, a quien prueba el producto y a quien lo valida.

## 2. Descripción general

### 2.1 Perspectiva del producto

NewsNow es una aplicación de una sola página (SPA) servida como PWA. Se apoya en un único sistema externo, NewsAPI.org, al que accede a través de un proxy propio. No tiene base de datos ni autenticación.

### 2.2 Funciones principales por módulo

| Módulo | Funciones | Requisitos |
| --- | --- | --- |
| Globo 3D | Rotar, acercar, seleccionar país, resaltar, indicadores de titulares, orbe acompañante | RF-01 a RF-08 |
| Lugares | Selector con búsqueda, regiones, ciudades, lugar en la URL, migas de pan | RF-09 a RF-13 |
| Noticias | Titulares por lugar y categoría, destacada, tendencias, paginación, normalización | RF-14 a RF-22 |
| Lector | Vista de artículo, guardados, compartir | RF-23 a RF-25 |
| Búsqueda | Búsqueda por palabras clave | RF-26 |
| Interfaz | Notificaciones, tema, toasts, estados de carga/vacío/error, hoja móvil | RF-27 a RF-30, RF-35 |
| PWA | Instalación, uso sin conexión, actualización | RF-31 a RF-33 |
| Proxy | Intermediación segura con NewsAPI | RF-34 |

### 2.3 Características de los usuarios

Público general, sin formación técnica. No requiere registro. Se espera uso tanto con ratón como táctil y con teclado.

## 3. Reglas de negocio

| ID | Regla |
| --- | --- |
| RN-01 | **Mundo:** los titulares se obtienen de `top-headlines` con `language=en`. Las tendencias mundiales provienen de un conjunto fijo de fuentes (BBC News, Reuters, Associated Press, Al Jazeera English, Bloomberg, The Washington Post). |
| RN-02 | **País con titulares oficiales:** si el país está en la lista que NewsAPI documenta para `top-headlines?country=`, se usa ese endpoint. |
| RN-03 | **Respaldo por búsqueda:** si RN-02 devuelve vacío o el país no está en la lista, se consulta `everything` con el nombre del país entre comillas, en el idioma principal del país si NewsAPI lo admite; si no, en español. |
| RN-04 | **Segundo respaldo:** si un país sin idioma asignado no tiene cobertura en español, se reintenta con su nombre en inglés y `language=en`. |
| RN-05 | **Región:** se consulta `everything` con la consulta predefinida de la región, en español. |
| RN-06 | **Ciudad:** se consulta `everything` con el nombre de la ciudad (y su nombre alternativo en inglés, si existe), en el idioma del país. |
| RN-07 | **Categoría:** en `top-headlines` se envía el parámetro `category`; en `everything` se combina la consulta del lugar con términos de la categoría mediante `AND`. La categoría "Portada" (general) no filtra. |
| RN-08 | **Tendencias de un lugar:** `everything` ordenado por popularidad, limitado a los últimos 7 días, 12 resultados; se muestran 5. |
| RN-09 | **Normalización:** se descartan artículos sin URL o sin título, los marcados `[Removed]`, y los duplicados por URL o por título. Se elimina el sufijo " - Fuente" del título y la marca "[+N chars]" del contenido. |
| RN-10 | **Identificador de artículo:** hash determinista de la URL. |
| RN-11 | **Última hora:** un titular se etiqueta "Última hora" solo si se publicó hace menos de 3 horas; en caso contrario se etiqueta "Titular del día". |
| RN-12 | **Frescura de datos:** una consulta no se repite antes de 10 minutos. La caché se conserva 24 horas en el dispositivo. |
| RN-13 | **Reintentos:** una consulta fallida se reintenta una sola vez y solo ante errores de red o del servicio; nunca por límite de cuota ni por API key. |
| RN-14 | **Búsqueda:** requiere al menos 2 caracteres; devuelve hasta 30 resultados ordenados por fecha de publicación. |
| RN-15 | **Lugares en titulares:** un lugar se detecta cuando su nombre (español o inglés) aparece como palabra completa en título o descripción, sin distinguir tildes ni mayúsculas. Las ciudades tienen precedencia sobre su país. Georgia, Chad, Jordania y Níger se excluyen por ambigüedad con nombres propios en inglés. Se muestran como máximo 12 indicadores. |
| RN-16 | **Notificaciones:** se genera una por cada titular principal distinto de la portada general; se conservan como máximo 30 y no se duplican. |
| RN-17 | **Lugar inválido:** una región, país o ciudad inexistente en la URL (o una ciudad que no pertenece al país indicado) produce la página "No encontrada". |
| RN-18 | **Proxy:** solo se reenvían los endpoints `top-headlines` y `everything`, y solo los parámetros de la lista permitida con valores de hasta 500 caracteres. |

## 4. Interfaces externas

### 4.1 Interfaz de usuario

Aplicación adaptable: barra lateral en escritorio, barra inferior en móvil, barra superior con buscador, selector de lugar, notificaciones y tema. Detalle en `06-interfaz-y-navegacion.md`.

### 4.2 Interfaz de software

| Sistema | Uso | Protocolo |
| --- | --- | --- |
| NewsAPI.org v2 | Fuente de titulares y búsqueda | HTTPS, JSON, cabecera `X-Api-Key` (solo desde el servidor) |
| Proxy propio `/api/news` | Única vía del cliente a los datos | HTTP GET, JSON |
| Web Share API / Clipboard API | Compartir artículos | API del navegador |
| Service Worker + Cache Storage | Uso sin conexión y actualización | API del navegador (Workbox) |
| WebGL / WebGL2 | Renderizado del globo | API del navegador |

### 4.3 Interfaz de hardware

Ninguna específica. Se adapta a puntero fino (ratón) y grueso (táctil).

## 5. Resumen de requisitos

| Tipo | Cantidad | Implementados en 0.1.0 |
| --- | --- | --- |
| Funcionales | 35 | 35 |
| No funcionales | 29 | 27 cumplidos, 1 parcial (RNF-26, cobertura de pruebas) y 1 pendiente (RNF-11, límite de peticiones en el proxy) |

## 6. Trazabilidad

Cada historia del Product Backlog referencia los RF que satisface (columna *Requisitos*), y cada caso de uso lista sus RF asociados. Las pruebas automatizadas y manuales indican el RF o la regla de negocio que verifican.
