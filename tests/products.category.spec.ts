import { test, expect } from '@playwright/test';
import { ProductsClient } from '../src/clients/products.client';
import { ProductListSchema } from '../src/schemas/product.schema';
import { attachEvidence } from '../src/utils/evidence';

test.describe('GET /products/category/{categoryName}', () => {
  let client: ProductsClient;

  test.beforeEach(({ request }) => {
    client = new ProductsClient(request);
  });

  test.afterEach(async ({}, testInfo) => {
    for (const [i, entry] of client.evidence.entries()) {
      await attachEvidence(testInfo, `${i}`, entry);
    }
  });

  // --- Caso 2: Listar productos por categoria (positivo) -------------------

  test('Caso 2 - devuelve 200 con productos que pertenecen todos a la categoria @positive @smoke', async () => {
    const category = 'electronics';
    const { status, body } = await client.getByCategory(category);

    expect(status).toBe(200);

    const parsed = ProductListSchema.safeParse(body);
    expect(parsed.success, `la lista no cumple el esquema de Product[]: ${JSON.stringify(parsed)}`).toBe(true);

    if (parsed.success) {
      const products = parsed.data;
      expect(products.length, 'la categoria electronics debe tener al menos un producto').toBeGreaterThan(0);

      for (const product of products) {
        expect(product.category, `producto id=${product.id} no pertenece a la categoria solicitada`).toBe(category);
      }
    }
  });

  test('Caso 2b - cada producto de la lista respeta tipos correctos @positive', async () => {
    const { body } = await client.getByCategory('jewelery');
    const products = ProductListSchema.parse(body);

    for (const product of products) {
      expect(typeof product.price).toBe('number');
      expect(typeof product.id).toBe('number');
    }
  });

  // --- Caso 6: Categoria invalida (negativo) --------------------------------

  test('Caso 6 - una categoria inexistente no debe devolver productos @negative', async () => {
    const { status, body } = await client.getByCategory('categoria-inexistente');

    // Hallazgo: Fake Store API no devuelve un error HTTP para categorias
    // inexistentes; responde 200 con un arreglo vacio. Se valida ese
    // comportamiento explicitamente en vez de esperar un 4xx.
    expect(status).toBe(200);
    expect(Array.isArray(body), 'el body debe seguir siendo un arreglo, aunque este vacio').toBe(true);
    expect((body as unknown[]).length, 'una categoria inexistente debe devolver un arreglo vacio').toBe(0);
  });

  test('Caso 6b - una categoria con caracteres especiales no rompe el servicio @negative @edge-case', async () => {
    const { status } = await client.getByCategory('%23%24%25-inv@lid');

    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(500);
  });
});
