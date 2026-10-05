# 10 · Gestión del proyecto

> Este documento propone un marco de trabajo para el proyecto. Los nombres de las personas, las fechas de los sprints y la velocidad real del equipo deben completarse por el equipo.

## 1. Metodología

Se propone **Scrum** con sprints de dos semanas.

| Evento | Frecuencia | Duración sugerida | Resultado |
| --- | --- | --- | --- |
| Planificación del sprint | Inicio de cada sprint | 2 h | Sprint Backlog y objetivo del sprint |
| Reunión diaria | Diaria | 15 min | Plan del día e impedimentos |
| Refinamiento del backlog | Una vez por sprint | 1 h | Historias listas (DoR) |
| Revisión del sprint | Fin de cada sprint | 1 h | Incremento demostrado |
| Retrospectiva | Fin de cada sprint | 45 min | Acciones de mejora |

## 2. Roles

| Rol | Responsabilidad | Persona |
| --- | --- | --- |
| Product Owner | Prioriza el backlog y acepta las historias | Por asignar |
| Scrum Master | Facilita los eventos y elimina impedimentos | Por asignar |
| Equipo de desarrollo | Diseña, construye y prueba el incremento | Por asignar |

## 3. Artefactos

| Artefacto | Ubicación |
| --- | --- |
| Product Backlog | `product-backlog.csv` (base de datos en Notion) |
| Requisitos | `requisitos-funcionales.csv`, `requisitos-no-funcionales.csv` |
| Incremento | Código fuente, versión 0.1.0 |

## 4. Definition of Ready (DoR)

Una historia puede entrar a un sprint cuando:

- Está redactada como "Como… quiero… para…".
- Tiene criterios de aceptación verificables.
- Está estimada en puntos.
- Sus dependencias (diseño, datos, API) están resueltas.
- Cabe en un sprint.

## 5. Definition of Done (DoD)

Una historia está terminada cuando:

- Cumple todos sus criterios de aceptación.
- `npm run build` termina sin errores de tipos.
- `npm test` aprueba todas las pruebas, y la lógica nueva tiene pruebas.
- Funciona en escritorio y móvil, en tema claro y oscuro.
- Es operable por teclado y respeta el movimiento reducido.
- Maneja los estados de carga, vacío y error.
- No expone la API key ni añade peticiones innecesarias a NewsAPI.
- La documentación afectada está actualizada.
- Fue revisada por otra persona del equipo.

## 6. Épicas

| Épica | Descripción | Historias |
| --- | --- | --- |
| Exploración geográfica | Globo 3D, selector, regiones, ciudades, lugar en la URL | HU-03, 04, 06, 07, 08, 09, 14, 15 |
| Feed de noticias | Titulares por lugar y categoría, destacada, tendencias | HU-01, 05, 10, 11, 12, 13 |
| Lector y lista de lectura | Lectura, guardados, compartir | HU-16, 17, 18, 39 |
| Búsqueda | Búsqueda por palabras clave y sus mejoras | HU-19, 32, 33, 36 |
| PWA y offline | Instalación, caché, actualización, push | HU-24, 25, 26, 38 |
| Experiencia y accesibilidad | Tema, notificaciones, estados, móvil, idiomas | HU-20, 21, 22, 23, 37, 40 |
| Plataforma y seguridad | Proxy, cuota, pruebas, CI, despliegue | HU-02, 27, 28, 29, 30, 31, 34, 35 |

## 7. Plan de versiones

| Versión | Objetivo | Historias | Puntos | Estado |
| --- | --- | --- | --- | --- |
| 0.1.0 | Producto mínimo: explorar noticias por lugar, leer, guardar, buscar, PWA | HU-01 a HU-28 | 130 | Entregado |
| 0.2.0 | Calidad y base de equipo: repositorio, CI, pruebas de interfaz, límite en el proxy, mejoras de búsqueda, auditoría de accesibilidad | HU-29 a HU-34, HU-40 | 28 | Propuesto |
| 0.3.0 | Salida a producción y alcance: despliegue público, filtros avanzados, interfaz en inglés | HU-35, 36, 37 | 18 | Propuesto |
| Futuro | Funciones que requieren backend de usuarios | HU-38, 39 | 26 | Sin planificar |

Los puntos son una estimación inicial hecha a partir del código; el equipo debe reestimar en el refinamiento.

## 8. Matriz de riesgos

| ID | Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- | --- |
| R-01 | Agotar la cuota de 100 peticiones diarias durante desarrollo o demostraciones | Alta | Alto | Caché de 10 minutos y persistencia de 24 h; preparar la demo visitando antes los lugares; usar pruebas unitarias para la lógica |
| R-02 | El plan gratuito de NewsAPI no permite producción | Segura | Alto | Presupuestar un plan de pago o evaluar otro proveedor antes de la versión 0.3.0 |
| R-03 | Cambios o caída de la API de NewsAPI | Media | Alto | Toda la integración está aislada en `newsapi.ts` y `newsProxy.ts`; errores tipificados; caché sin conexión |
| R-04 | Filtración de la API key | Baja | Alto | Key solo en el servidor; `.env` ignorado; revisar `dist/` antes de publicar; rotar la key si se expone |
| R-05 | Abuso del proxy público | Media | Medio | Lista blanca de endpoints y parámetros; caché de CDN; añadir límite por cliente (HU-34) |
| R-06 | Bajo rendimiento del globo en dispositivos modestos | Media | Medio | Textura reducida en móvil, render pausado fuera de pantalla, alternativa sin WebGL |
| R-07 | Resultados poco relevantes en países sin titulares oficiales | Alta | Medio | Búsqueda por nombre en idioma local con respaldo en inglés; mensaje claro cuando no hay resultados |
| R-08 | Falsos positivos al detectar lugares en titulares | Media | Bajo | Coincidencia por palabra completa; exclusión de nombres ambiguos |
| R-09 | Pérdida de código por no tener control de versiones | Alta | Alto | Crear el repositorio Git de inmediato (HU-29) |
| R-10 | Regresiones en la interfaz por falta de pruebas de componentes | Media | Medio | Añadir pruebas de interfaz y CI (HU-30, HU-31) |
| R-11 | Uso indebido de contenido de terceros | Baja | Alto | Mostrar solo extractos, atribuir la fuente y enlazar siempre al original |
| R-12 | Pérdida de guardados al borrar datos del navegador | Media | Bajo | Informar al usuario; evaluar exportación o cuentas (HU-39) |

## 9. Comunicación y control de cambios

- Todo cambio de alcance entra como historia al Product Backlog y lo prioriza el Product Owner.
- Los cambios de arquitectura se registran como una nueva decisión (ADR) en el documento de arquitectura.
- La versión sigue el esquema mayor.menor.parche en `package.json`.
