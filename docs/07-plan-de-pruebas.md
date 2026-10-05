# 07 · Plan de pruebas

## 1. Objetivo y alcance

Verificar que NewsNow cumple sus requisitos funcionales y no funcionales. Se prueban la capa de datos, la geografía, los flujos de usuario, el comportamiento sin conexión y el proxy.

## 2. Estrategia

| Nivel | Herramienta | Estado | Cubre |
| --- | --- | --- | --- |
| Unitarias | Vitest (entorno Node) | Implementado: 9 pruebas | Normalización, selección de endpoint, respaldos, errores, geografía, detección de lugares |
| Verificación estática | TypeScript (`tsc --noEmit`) | Implementado en `npm run build` | Tipos de todo el proyecto |
| Componentes | Por definir (Testing Library) | Pendiente | Tarjetas, selector, estados |
| Extremo a extremo | Por definir (Playwright) | Pendiente | Flujos principales en navegador |
| Manuales | Lista de este documento | Disponible | Globo, PWA, accesibilidad, diseño adaptable |

## 3. Entorno

- Node.js 18 o superior, `npm install`.
- `npm test` para las unitarias (no consumen cuota: `fetch` se simula).
- `npm run dev` (puerto 5180) para pruebas manuales; `npm run build` y `npm run preview` (puerto 5181) para probar la PWA.
- Cada prueba manual que consulta un lugar nuevo gasta cuota de NewsAPI (100 peticiones/día).

## 4. Pruebas automatizadas existentes

Archivo: `src/lib/newsapi.test.ts`. Última ejecución (5 de octubre de 2026): **9 de 9 aprobadas**.

| ID | Grupo | Prueba | Verifica |
| --- | --- | --- | --- |
| PU-01 | normalize | Descarta eliminados y duplicados, y limpia título y contenido | RN-09, RF-22 |
| PU-02 | getHeadlines | Usa `top-headlines` por país cuando devuelve resultados | RN-02, RF-15 |
| PU-03 | getHeadlines | Cae a `everything` cuando `top-headlines` viene vacío | RN-03, RF-15 |
| PU-04 | getHeadlines | Va directo a `everything` para países sin titulares y para regiones | RN-03, RN-05, RF-16 |
| PU-05 | getHeadlines | Reintenta en inglés si un país sin idioma propio no tiene cobertura en español | RN-04 |
| PU-06 | getHeadlines | Traduce los errores de NewsAPI | RF-30 |
| PU-07 | geo | Resuelve coordenadas a países | RF-02 |
| PU-08 | geo | Nombra en español y construye rutas | RF-12 |
| PU-09 | geo | Detecta lugares mencionados en titulares | RN-15, RF-05 |

## 5. Casos de prueba manuales

| ID | Caso | Pasos | Resultado esperado | Requisito |
| --- | --- | --- | --- | --- |
| CP-01 | Carga de portada | Abrir `/` | Globo visible, destacada, tendencias y rejilla | RF-01, RF-14 |
| CP-02 | Seleccionar país en el globo | Clic en Colombia | URL `/c/co`, vuelo de cámara, país iluminado, aviso | RF-02, RF-04 |
| CP-03 | Etiqueta de país | Pasar el cursor por varios países | Bandera y nombre siguen al cursor | RF-03 |
| CP-04 | Zoom | Pulsar Acercar y Alejar | La cámara se acerca y se aleja | RF-01 |
| CP-05 | Selector por teclado | Abrir selector, escribir "fran", flecha abajo, Enter | Navega a Francia | RF-09, RNF-17 |
| CP-06 | Búsqueda sin tildes | Escribir "mexico" en el selector | Aparece México | RF-09 |
| CP-07 | Región | Pulsar Europa en la barra lateral | URL `/r/europe`, países europeos iluminados | RF-10 |
| CP-08 | Ciudad | En Colombia, pulsar Bogotá | URL `/c/co/bogota`, zoom cercano | RF-11 |
| CP-09 | Categoría | Pulsar Deportes | URL con `?cat=sports`, feed filtrado | RF-17 |
| CP-10 | Enlace directo | Abrir `/c/mx?cat=technology` en pestaña nueva | Carga Tecnología de México | RF-12 |
| CP-11 | Lugar inválido | Abrir `/c/zz` y `/c/co/paris` | Página No encontrada | RN-17 |
| CP-12 | Volver a Mundo | En un país, pulsar Esc | Vuelve a `/` | RF-13 |
| CP-13 | Ver más | Pulsar "Ver más noticias" | Se añaden 9 tarjetas | RF-20 |
| CP-14 | Abrir noticia | Pulsar un titular | Lector con extracto y progreso | RF-23 |
| CP-15 | Ir a la fuente | Pulsar "Leer en la fuente" | Se abre la fuente en otra pestaña | RF-23 |
| CP-16 | Guardar | Pulsar el marcador y abrir Guardados | La noticia aparece; el contador aumenta | RF-24 |
| CP-17 | Persistencia de guardados | Recargar la página | Los guardados siguen ahí | RF-24 |
| CP-18 | Compartir | Pulsar Compartir en escritorio | Aviso "Enlace copiado al portapapeles" | RF-25 |
| CP-19 | Buscar | Buscar "inteligencia artificial" | Total y resultados | RF-26 |
| CP-20 | Búsqueda corta | Buscar "a" | No consulta; muestra sugerencias | RN-14 |
| CP-21 | Notificaciones | Visitar 3 países y abrir la campana | 3 notificaciones; al cerrar quedan leídas | RF-27 |
| CP-22 | Tema | Pulsar el botón de tema tres veces | Sistema → oscuro → claro; persiste al recargar | RF-28 |
| CP-23 | Vínculo titular–globo | Detener el cursor sobre un titular con lugar | El lugar se enciende en el globo | RF-06 |
| CP-24 | Orbe | Desplazarse hasta ocultar el globo y pulsar el orbe | Aparece el orbe; vuelve arriba | RF-07 |
| CP-25 | Caché de 10 minutos | Ir a un país, volver a Mundo y regresar; observar la red | No hay nueva petición a `/api/news` | RNF-01 |
| CP-26 | Sin conexión | Con `preview`, visitar un país, activar modo sin conexión y recargar | La página y las noticias cargan desde caché | RF-32 |
| CP-27 | Sin conexión, lugar nuevo | Sin conexión, elegir un país no visitado | Estado "Sin conexión" con Reintentar | RF-30 |
| CP-28 | Instalación | Con `preview`, instalar desde el navegador | Abre en ventana propia con icono | RF-31 |
| CP-29 | Sin API key | Arrancar sin `NEWSAPI_KEY` | Estado "Falta la API key de NewsAPI", sin botón Reintentar | RF-30, RF-34 |
| CP-30 | Endpoint no permitido | Abrir `/api/news?endpoint=sources` | HTTP 400 `parameterInvalid` | RF-34, RNF-08 |
| CP-31 | Key no expuesta | Buscar el valor de la key en `dist/` y en la pestaña Red | No aparece | RNF-07 |
| CP-32 | Móvil | Emular 375 px y seleccionar un país | Barra inferior y hoja del lugar; se cierra deslizando | RF-35, RNF-16 |
| CP-33 | Movimiento reducido | Activar la preferencia del sistema y cambiar de lugar | Sin vuelo animado ni contador animado | RNF-19 |
| CP-34 | Sin WebGL | Desactivar WebGL en el navegador | Póster del planeta y mensaje; el selector funciona | RF-08 |
| CP-35 | Navegadores | Repetir CP-01, CP-02 y CP-14 en Chrome, Edge, Firefox y Safari | Mismo comportamiento | RNF-23 |

## 6. Criterios de aceptación de una versión

- `npm run build` termina sin errores de tipos.
- `npm test` aprueba el 100 % de las pruebas.
- Casos manuales de prioridad alta (CP-01, 02, 05, 09, 10, 14, 16, 19, 26, 29, 31) aprobados.
- Sin defectos críticos ni altos abiertos.

## 7. Clasificación de defectos

| Severidad | Definición | Ejemplo |
| --- | --- | --- |
| Crítica | Impide usar la app o expone la API key | La portada no carga |
| Alta | Una función principal falla sin alternativa | No se puede abrir ninguna noticia |
| Media | Falla con alternativa disponible | El globo no selecciona, pero el selector sí |
| Baja | Defecto visual o de texto | Un aviso mal alineado |

## 8. Riesgos de prueba

- La cuota diaria limita las pruebas manuales: priorizar lugares ya cacheados y usar las unitarias para la lógica.
- Los datos reales cambian a diario: los casos manuales verifican comportamiento, no contenidos concretos.
- El plan gratuito de NewsAPI solo responde a peticiones originadas en localhost.
