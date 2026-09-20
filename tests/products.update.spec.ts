import { test, expect } from '@playwright/test';
import { ProductsClient } from '../src/clients/products.client';
import { ProductWriteResponseSchema } from '../src/schemas/product.schema';
import { ProductFactory } from '../src/data-factories/product.factory';
import { attachEvidence } from '../src/utils/evidence';

test.describe('PUT /products/{id}', () => {
  let client: ProductsClient;

  test.beforeEach(({ request }) => {
    client = new ProductsClient(request);
  });

  test.afterEach(async ({}, testInfo) => {
    for (const [i, entry] of client.evidence.entries()) {
      await attachEvidence(testInfo, `${i}`, entry);
    }
  });

  // --- Caso 4: Actualizar producto completo (positivo) ----------------------

  test('Caso 4 - actualiza un producto existente con todos los campos @positive @smoke', async () => {
    const targetId = 1;
    const updatePayload = ProductFactory.buildValid({
      title: 'Producto actualizado por QA automation',
    });

    const { status, body } = await client.updateFull(targetId, updatePayload);

    expect(status).toBe(200);

    const parsed = ProductWriteResponseSchema.safeParse(body);
    expect(parsed.success, `la respuesta de actualizacion no cumple el esquema: ${JSON.stringify(parsed)}`).toBe(
      true
    );

    if (parsed.success) {
      const updated = parsed.data;

      // Validar todos los campos enviados contra los retornados.
      expect(updated.title).toBe(updatePayload.title);
      expect(updated.price).toBe(updatePayload.price);
      if (updated.description !== undefined) {
        expect(updated.description).toBe(updatePayload.description);
      }
      if (updated.category !== undefined) {
        expect(updated.category).toBe(updatePayload.category);
      }

      // El id del recurso actualizado debe mantenerse.
      expect(updated.id).toBe(targetId);
    }
  });

  test('Caso 4b - actualizar un producto inexistente no provoca un 5xx @edge-case', async () => {
    const updatePayload = ProductFactory.buildValid();
    const { status } = await client.updateFull(999999, updatePayload);

    // Actualizar un recurso que no existe es un edge case: lo minimo
    // exigible es que el servicio no falle con un error de servidor.
    expect(status).toBeLessThan(500);
  });
});
