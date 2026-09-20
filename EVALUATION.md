# EVALUATION.md — Conclusiones y Hallazgos

## 1. Hallazgos sobre Fake Store API

Antes de escribir las aserciones negativas, se verificó el comportamiento real de la API (en vez de asumir un contrato de error "de manual"). Esto cambió el diseño de los Casos 5, 6 y 7:

| Endpoint | Comportamiento esperado (REST convencional) | Comportamiento real observado |
|---|---|---|
| `GET /products/{id-inexistente}` | `404 Not Found` con mensaje de error | `200 OK` con body vacío o `null`. No sigue el contrato de error estándar. |
| `GET /products/category/{categoria-inexistente}` | `404` o `200` con mensaje | `200 OK` con un arreglo vacío `[]`. Comportamiento consistente y predecible, aunque no señaliza error explícitamente. |
| `POST /products` con payload vacío | `400 Bad Request` | `200 OK`, la API es un mock sin validación de negocio real: acepta cualquier payload y devuelve un `id` autogenerado. |
| `PUT /products/{id}` | Persiste el cambio | Responde `200` con el payload "ecoizado", pero **no persiste realmente** el cambio (es un mock stateless en memoria por request). Un `GET` posterior al mismo id no refleja la actualización. |

**Implicación de diseño:** los tests de los casos negativos no aseveran códigos de error convencionales (4xx) donde la API no los implementa. En su lugar, se documenta el comportamiento real como parte del contrato observado y se valida lo que sí es una garantía verificable (por ejemplo: "un id inexistente nunca debe devolver un objeto con forma de `Product` válido", en vez de "debe devolver 404"). Aseverar un 404 que la API nunca envía habría producido un framework con tests permanentemente en rojo por un problema de expectativas, no de calidad real del sistema bajo prueba.

## 2. Decisiones técnicas y su justificación

- **Playwright Test sobre alternativas (Postman/Newman, REST Assured, Supertest):** se eligió por preferencia y dominio del stack, y porque su ejecución en paralelo, `trace viewer` y reporte HTML nativo cubren varios requisitos del reto (reportería, evidencias) sin necesidad de herramientas adicionales.
- **Zod para validación de esquema:** se prefirió sobre aserciones manuales campo por campo porque separa "qué forma debe tener la respuesta" de "qué hace el test con esa respuesta", y da mensajes de error legibles cuando el esquema falla (`safeParse` + `JSON.stringify` del resultado).
- **Dos schemas distintos para lectura y escritura** (`ProductSchema` vs `ProductWriteResponseSchema`): la respuesta de creación/actualización del mock no siempre incluye `rating` completo. Forzar el mismo schema estricto en ambos casos habría generado falsos negativos no relacionados con un defecto real.
- **`BaseApiClient.execute()` centraliza el parseo seguro del body:** un `response.json()` directo rompe con una excepción poco informativa cuando el body viene vacío (como ocurre en el Caso 5). Centralizar el parseo evita repetir ese manejo en cada test y hace que el fallo, si ocurre, sea por la aserción de negocio y no por una excepción de parseo.
- **Datos dinámicos (factory) + datos estáticos (fixture):** se combinan ambos enfoques (Caso 3 usa ambos) para demostrar manejo de las dos estrategias pedidas explícitamente en el reto.

## 3. Cobertura de casos

Se implementaron los 8 casos sugeridos por el reto (4 positivos + 4 negativos), superando el mínimo de 4 solicitado, más variantes adicionales (`Caso Nb`, `Caso Nc`) para cubrir edge cases: ids no numéricos, categorías con caracteres especiales, `limit` en 0 y negativo, y payloads con tipos incorrectos.

## 4. Limitaciones conocidas

- Al ser una API mock sin persistencia real, no es posible validar un ciclo completo create → read → delete que confirme persistencia real de datos; se documenta explícitamente en cada test donde esto aplica, en vez de simularlo.
- La API no expone un endpoint de autenticación real utilizable de forma aislada para pruebas automatizadas repetibles (el login de `fakestoreapi.com/auth/login` depende de usuarios semilla); por alcance y tiempo del reto, se priorizó el dominio `Products`, que concentra los 8 casos solicitados en el documento del reto.
- No se incluyeron pruebas de carga/performance (fuera del alcance funcional pedido).

## 5. Posibles mejoras a futuro

- Data-driven testing con `test.describe.parallel` + matrices de categorías/ids para ampliar cobertura sin duplicar código de test.
- Contract testing (por ejemplo, con Pact) si la API tuviera un consumidor real dependiente de su contrato.
- Integrar el resultado de `test-results/junit.xml` a un dashboard de calidad (Allure, ReportPortal) si el equipo lo usa.
- Extender `BaseApiClient` a `CartsClient` y `UsersClient` para cubrir el resto de dominios listados en el reto.

## 6. Uso de IA (declaración requerida por el reto)

- **Modelo:** Claude (Anthropic), interfaz de chat estándar (claude.ai / claude Sonnet).
- **MCPs utilizados:** ninguno.
- **Skills utilizadas:** ninguna skill personalizada; se usó únicamente la capacidad general de generación de código y búsqueda web del asistente para verificar el comportamiento real de los endpoints de error de Fake Store API antes de diseñar las aserciones negativas.
- **Agentes:** ninguno (interacción conversacional directa, sin orquestación autónoma de tareas).
- **Alcance de la asistencia:** definición de arquitectura (API Object Pattern + Factory + validación por schema), generación de la estructura de carpetas, código de clients/schemas/factories/tests, configuración de Playwright y documentación. Las decisiones de diseño y la verificación del comportamiento real de la API fueron validadas antes de escribir las aserciones correspondientes.
