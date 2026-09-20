import { test, expect } from '@playwright/test';
import { ProductsClient } from '../src/clients/products.client';
import { ProductListSchema } from '../src/schemas/product.schema';
import { attachEvidence } from '../src/utils/evidence';

test.describe('GET /products?limit=N', () => {
  let client: ProductsClient;

  test.beforeEach(({ request }) => {
    client = new ProductsClient(request);
  });

  test.afterEach(async ({}, testInfo) => {
    for (const [i, entry] of client.evidence.entries()) {
      await attachEvidence(testInfo, `${i}`, entry);
    }
  });

  // --- Caso 8: Validacion de limites de productos ---------------------------

  test('Caso 8 - limit=5 devuelve como maximo 5 productos @positive @smoke', async () => {
    const { status, body } = await client.getAll({ limit: 5 });

    expect(status).toBe(200);

    const parsed = ProductListSchema.safeParse(body);
    expect(parsed.success, `la lista no cumple el esquema de Product[]: ${JSON.stringify(parsed)}`).toBe(true);

    if (parsed.success) {
      expect(parsed.data.length).toBeLessThanOrEqual(5);
      expect(parsed.data.length).toBeGreaterThan(0);
    }
  });

  test('Caso 8b - limit=1 devuelve exactamente un producto @positive', async () => {
    const { body } = await client.getAll({ limit: 1 });
    const products = ProductListSchema.parse(body);
    expect(products.length).toBe(1);
  });

  test('Caso 8c - limit=0 no debe romper el servicio @negative @edge-case', async () => {
    const { status, body } = await client.getAll({ limit: 0 });

    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  test('Caso 8d - un limit negativo no debe romper el servicio @negative @edge-case', async () => {
    const { status } = await client.getAll({ limit: -1 });

    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(500);
  });

  test('Caso 8e - sort=desc combinado con limit sigue respetando el limite @positive', async () => {
    const { status, body } = await client.getAll({ limit: 3, sort: 'desc' });

    expect(status).toBe(200);
    const products = ProductListSchema.parse(body);
    expect(products.length).toBeLessThanOrEqual(3);
  });
});
