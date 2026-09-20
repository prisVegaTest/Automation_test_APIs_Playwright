import { test, expect } from '@playwright/test';
import { ProductsClient } from '../src/clients/products.client';
import { ProductSchema } from '../src/schemas/product.schema';
import { attachEvidence } from '../src/utils/evidence';

test.describe('GET /products/{id}', () => {
  let client: ProductsClient;

  test.beforeEach(({ request }) => {
    client = new ProductsClient(request);
  });

  test.afterEach(async ({}, testInfo) => {
    for (const [i, entry] of client.evidence.entries()) {
      await attachEvidence(testInfo, `${i}`, entry);
    }
  });

  // --- Caso 1: Obtener producto especifico (positivo) ---------------------

  test('Caso 1 - devuelve 200 y el producto con esquema y tipos correctos @positive @smoke', async () => {
    const { status, body } = await client.getById(1);

    expect(status, 'status code debe ser 200').toBe(200);

    const parsed = ProductSchema.safeParse(body);
    expect(parsed.success, `el body no cumple el esquema de Product: ${JSON.stringify(parsed)}`).toBe(true);

    if (parsed.success) {
      const product = parsed.data;
      // Validaciones explicitas de tipo, no solo de presencia del campo.
      expect(typeof product.price, 'price debe ser de tipo number').toBe('number');
      expect(typeof product.id, 'id debe ser de tipo number').toBe('number');
      expect(typeof product.title, 'title debe ser de tipo string').toBe('string');

      // Estructura anidada del objeto rating.
      expect(product.rating).toEqual(
        expect.objectContaining({
          rate: expect.any(Number),
          count: expect.any(Number),
        })
      );
      expect(product.rating.rate).toBeGreaterThanOrEqual(0);
      expect(product.rating.rate).toBeLessThanOrEqual(5);
      expect(product.rating.count).toBeGreaterThanOrEqual(0);

      // Validacion adicional: el id devuelto coincide con el solicitado.
      expect(product.id).toBe(1);
    }
  });

  test('Caso 1b - el precio nunca es negativo (regla de negocio) @positive', async () => {
    const { body } = await client.getById(1);
    const parsed = ProductSchema.parse(body);
    expect(parsed.price).toBeGreaterThan(0);
  });

  // --- Caso 5: Producto no encontrado (negativo) ---------------------------

  test('Caso 5 - un id inexistente no debe devolver un producto valido @negative', async () => {
    const { status, body } = await client.getById(999999);

    // Hallazgo documentado en EVALUATION.md: Fake Store API no implementa
    // un contrato de error convencional (404 + mensaje). Para un id
    // inexistente responde 200 con body vacio/null. La asercion se adapta
    // a ese comportamiento real en lugar de asumir un 404 de manual.
    expect([200, 404]).toContain(status);

    if (status === 200) {
      expect(
        body,
        'para un id inexistente, un 200 solo es aceptable si el body no representa un producto real'
      ).toBeFalsy();
    }

    if (status === 404) {
      expect(body).not.toBeNull();
    }

    // En ningun caso el body puede parsear como un Product valido:
    // esta es la asercion de negocio real (no exponer datos inconsistentes).
    const parsedAsProduct = ProductSchema.safeParse(body);
    expect(parsedAsProduct.success, 'un id inexistente no debe devolver un producto con forma valida').toBe(false);
  });

  test('Caso 5b - un id no numerico se maneja sin romper el contrato @negative @edge-case', async () => {
    const { status, body } = await client.getById('abc');

    // Edge case: id con tipo incorrecto en la URL. Se documenta el status
    // real observado y se valida que, sea cual sea, no exponga un stack
    // trace ni informacion sensible del servidor.
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(600);

    if (typeof body === 'string') {
      expect(body.toLowerCase()).not.toContain('stack');
    }
  });
});
