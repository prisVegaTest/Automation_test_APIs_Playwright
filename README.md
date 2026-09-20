# Fake Store API — Framework de Automatización de Pruebas

Reto Técnico QA Semi Senior — Banco Pichincha, Chapter QA/QE.
Framework de automatización de pruebas de API REST sobre [Fake Store API](https://fakestoreapi.com), construido con **Playwright Test + TypeScript + Zod**.

## 1. Stack y por qué

| Herramienta | Rol | Justificación |
|---|---|---|
| **Playwright Test** | Test runner + cliente HTTP (`APIRequestContext`) | Ejecución en paralelo nativa, reporte HTML/JSON/JUnit incorporado, `trace` para depurar fallos sin herramientas extra. |
| **TypeScript** | Lenguaje | Tipado fuerte en clients y schemas: errores de contrato se detectan en compilación, no en ejecución. |
| **Zod** | Validación de esquemas | Validación declarativa de estructura y tipos (`price` como `number`, `rating` anidado), con mensajes de error legibles. |
| **@faker-js/faker** | Generación de datos dinámicos | Evita datos "quemados" que enmascaran falsos positivos entre corridas. |

### Versiones utilizadas

- Node.js ≥ 18 (recomendado 20 LTS)
- `@playwright/test` ^1.48.0
- `typescript` ^5.6.3
- `zod` ^3.23.8
- `@faker-js/faker` ^9.0.3

## 2. Instalación

```bash
git clone <url-del-repositorio>
cd fakestore-api-tests
npm install
npx playwright install
```

No se requieren credenciales ni variables de entorno: Fake Store API es pública y de solo prototipo.

## 3. Ejecución

```bash
# Correr toda la suite (paralelizada por archivo de spec)
npm test

# Correr con la UI interactiva de Playwright (recomendado para explorar fallos)
npm run test:ui

# Ver el último reporte HTML generado
npm run test:report

# Verificación de tipos, sin ejecutar tests
npm run typecheck
```

Filtrar por tag (por ejemplo, solo smoke tests o solo negativos):

```bash
npx playwright test --grep @smoke
npx playwright test --grep @negative
```

## 4. Estructura del proyecto

```
fakestore-api-tests/
├── src/
│   ├── clients/
│   │   ├── base.client.ts        # captura de evidencia + parseo seguro de respuesta
│   │   └── products.client.ts    # API Object del recurso /products
│   ├── schemas/
│   │   └── product.schema.ts     # esquemas Zod (Product, Rating, respuesta de escritura)
│   ├── data-factories/
│   │   └── product.factory.ts    # generación de payloads dinámicos (faker)
│   ├── fixtures/
│   │   ├── valid-product.json    # dato estático válido
│   │   └── invalid-product.json  # dato estático inválido
│   └── utils/
│       └── evidence.ts           # adjunta request/response al reporte HTML
├── tests/
│   ├── products.get.spec.ts        # Caso 1 (positivo) + Caso 5 (negativo)
│   ├── products.category.spec.ts   # Caso 2 (positivo) + Caso 6 (negativo)
│   ├── products.create.spec.ts     # Caso 3 (positivo) + Caso 7 (negativo)
│   ├── products.update.spec.ts     # Caso 4 (positivo)
│   └── products.pagination.spec.ts # Caso 8 (positivo + edge cases)
├── playwright.config.ts
├── package.json
├── EVALUATION.md
└── .github/workflows/ci.yml
```

### Patrón de arquitectura

**API Object Pattern** (equivalente al Page Object Model para APIs): cada recurso tiene un `client` que encapsula cómo se llama al endpoint; los tests solo orquestan y aseveran, nunca llaman `request.get()` directamente. Se complementa con:

- **Factory Pattern** (`ProductFactory`) para datos dinámicos.
- **Validación desacoplada por schema** (Zod) en vez de aserciones campo por campo.
- **Template Method** implícito en `BaseApiClient.execute()`: centraliza logging de evidencia y parseo seguro, y los clients concretos solo describen el endpoint.

## 5. Reporte y evidencias

Cada test adjunta al reporte HTML el request y response completos (URL, método, headers, body) de cada llamada realizada, incluso en los tests que pasan. Ante un fallo, `npm run test:report` muestra:

- Total de pruebas ejecutadas, tasa de éxito/fallo y tiempo por prueba (vista nativa del reporte HTML).
- Traza (`trace.zip`) con la request/response que causó el fallo.
- Adjuntos `evidencia-*` en JSON con el detalle completo de cada llamada.

También se generan `test-results/results.json` y `test-results/junit.xml` para integrarse con dashboards de CI/CD.

## 6. Casos implementados

| # | Caso | Tipo | Archivo |
|---|---|---|---|
| 1 | Obtener producto específico | Positivo | `products.get.spec.ts` |
| 2 | Listar productos por categoría | Positivo | `products.category.spec.ts` |
| 3 | Crear producto exitosamente | Positivo | `products.create.spec.ts` |
| 4 | Actualizar producto completo | Positivo | `products.update.spec.ts` |
| 5 | Producto no encontrado | Negativo | `products.get.spec.ts` |
| 6 | Categoría inválida | Negativo | `products.category.spec.ts` |
| 7 | Crear producto con datos inválidos | Negativo | `products.create.spec.ts` |
| 8 | Validación de límites de productos | Positivo + edge cases | `products.pagination.spec.ts` |

Más detalle de hallazgos y decisiones técnicas en [`EVALUATION.md`](./EVALUATION.md).

## 7. Uso de IA

Este framework fue diseñado y generado con asistencia de **Claude** (Anthropic), en su interfaz de chat estándar (claude.ai). No se usaron MCP servers, skills personalizadas ni agentes autónomos: la interacción fue conversacional (definición de arquitectura, patrón de diseño y generación de código), con verificación puntual vía búsqueda web del comportamiento real de Fake Store API en los endpoints de error, documentada en `EVALUATION.md`.
