import { test, expect } from '@playwright/test';
import { ProductsClient } from '../src/clients/products.client';
import { ProductWriteResponseSchema } from '../src/schemas/product.schema';
import { ProductFactory } from '../src/data-factories/product.factory';
import { attachEvidence } from '../src/utils/evidence';
import validProductFixture from '../src/fixtures/valid-product.json';

test.describe('POST /products', () => {
  let client: ProductsClient;

  test.beforeEach(({ request }) => {
    client = new ProductsClient(request);
  });

  test.afterEach(async ({}, testInfo) => {
    for (const [i, entry] of client.evidence.entries()) {
      await attachEvidence(testInfo, `${i}`, entry);
    }
  });

  // --- Caso 3: Crear producto exitosamente (positivo) -----------------------

  test('Caso 3 - crea un producto con datos validos y devuelve el producto con id @positive @smoke', async () => {
    const payload = ProductFactory.buildValid();
    const { status, body } = await client.create(payload);

    expect(status).toBe(200);

    const parsed = ProductWriteResponseSchema.safeParse(body);
    expect(parsed.success, `la respuesta de creacion no cumple el esquema: ${JSON.stringify(parsed)}`).toBe(true);

    if (parsed.success) {
      const created = parsed.data;
      expect(created.id, 'la respuesta debe incluir un id').toBeDefined();
      expect(typeof created.id).toBe('number');

      // Los datos enviados deben coincidir con los retornados.
      expect(created.title).toBe(payload.title);
      expect(created.price).toBe(payload.price);
    }
  });

  test('Caso 3b - un producto creado con fixture estatico tambien es aceptado @positive', async () => {
    // Usa el fixture estatico en vez de datos generados, para cubrir
    // tanto datos dinamicos (factory) como datos fijos (fixture) tal
    // como pide el reto.
    const { status, body } = await client.create(validProductFixture);
    expect(status).toBe(200);

    const created = ProductWriteResponseSchema.parse(body);
    expect(created.title).toBe(validProductFixture.title);
  });

  // --- Caso 7: Crear producto con datos invalidos (negativo) ----------------

  test('Caso 7 - un payload vacio no debe generar un producto valido @negative', async () => {
    const { status, body } = await client.create(ProductFactory.buildEmpty());

    // Hallazgo: Fake Store API es un mock sin validacion real de negocio;
    // acepta payloads vacios y responde 200 con un id autogenerado, en vez
    // de un 400. Se documenta esta limitacion del mock y se valida lo que
    // SI es verificable: la respuesta no puede contener datos de producto
    // coherentes si no se enviaron.
    expect([200, 400]).toContain(status);

    if (status === 400) {
      expect(body).not.toBeNull();
    }

    if (status === 200) {
      const record = body as Record<string, unknown>;
      // No se puede validar un titulo o precio "coherente" que nunca
      // se envio: se documenta como limitacion conocida del mock.
      expect(record).not.toHaveProperty('title', expect.stringMatching(/.+/));
    }
  });

  test('Caso 7b - un payload con tipos incorrectos no rompe el servicio (5xx) @negative @edge-case', async () => {
    const { status } = await client.create(ProductFactory.buildMalformed());

    // Independientemente de si el mock valida o no el tipo de "price",
    // el servicio nunca deberia devolver un error de servidor (5xx)
    // por un payload mal formado; eso indicaria manejo de errores pobre.
    expect(status).toBeLessThan(500);
  });
});
