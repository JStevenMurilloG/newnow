# NewsNow — Documentación del proyecto

> **NewsNow** es una PWA de noticias con un globo 3D interactivo: el usuario selecciona un país, región o ciudad y toda la página pasa a mostrar sus noticias. Los datos provienen de NewsAPI a través de un proxy propio que oculta la API key.

Documentación elaborada a partir del código fuente de la versión **0.1.0** (5 de octubre de 2026). Los estados de requisitos y backlog se dedujeron del código existente; las estimaciones y los ítems "Propuesto" son sugerencias que el equipo debe validar.

## Ficha del proyecto

| Campo | Valor |
| --- | --- |
| Nombre | NewsNow — Noticias del mundo |
| Versión | 0.1.0 |
| Tipo de producto | Aplicación web progresiva (PWA), instalable y con soporte sin conexión |
| Idioma de la interfaz | Español |
| Frontend | React 18, TypeScript 5, Vite 5, React Router 6, TanStack Query 5, Zustand 5 |
| Globo 3D | three.js, react-three-fiber, drei, d3-geo, topojson-client, world-atlas |
| Backend | Proxy sin estado: middleware de Vite (dev y preview) y función serverless formato Vercel (producción) |
| Fuente de datos | NewsAPI.org v2 (`top-headlines` y `everything`) |
| Persistencia | Solo en el dispositivo: localStorage, sessionStorage y Cache Storage. Sin base de datos ni cuentas |
| Pruebas | Vitest (capa de datos y geografía) |

## Mapa de la documentación

| Documento | Contenido |
| --- | --- |
| [01 · Visión y alcance](01-vision-y-alcance.md) | Problema, objetivos, usuarios, alcance, supuestos y restricciones |
| [02 · Especificación de requisitos](02-especificacion-de-requisitos.md) | Reglas de negocio, interfaces externas, resumen de requisitos |
| [Requisitos funcionales](requisitos-funcionales.csv) | RF-01 a RF-35 (CSV, se importa como base de datos) |
| [Requisitos no funcionales](requisitos-no-funcionales.csv) | RNF-01 a RNF-29 por categoría ISO 25010 (CSV) |
| [Product Backlog](product-backlog.csv) | Historias de usuario por épica, prioridad MoSCoW, puntos y estado (CSV) |
| [03 · Casos de uso](03-casos-de-uso.md) | Actores, diagrama y casos de uso detallados |
| [04 · Arquitectura](04-arquitectura.md) | Componentes, flujos, estructura de carpetas, decisiones |
| [05 · Modelo de datos y API](05-modelo-de-datos-y-api.md) | Entidades, almacenamiento local, contrato de `/api/news` |
| [06 · Interfaz y navegación](06-interfaz-y-navegacion.md) | Rutas, pantallas, sistema de diseño, accesibilidad |
| [07 · Plan de pruebas](07-plan-de-pruebas.md) | Estrategia, pruebas automatizadas y casos manuales |
| [08 · Instalación y despliegue](08-instalacion-y-despliegue.md) | Requisitos previos, entorno, comandos, despliegue |
| [09 · Manual de usuario](09-manual-de-usuario.md) | Guía de uso para el lector final |
| [10 · Gestión del proyecto](10-gestion-del-proyecto.md) | Scrum, roles, DoR/DoD, plan de versiones, riesgos |
| [11 · Glosario](11-glosario.md) | Términos del dominio y técnicos |

## Cómo llevarla a Notion

1. En Notion: **Importar → Markdown y CSV**.
2. Selecciona todos los archivos de esta carpeta `docs/`.
3. Los `.md` se crean como páginas y los `.csv` como bases de datos (se pueden convertir a tablero Kanban agrupando por *Estado*).
