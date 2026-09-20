import { faker } from '@faker-js/faker';

export interface ProductPayload {
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

/**
 * ProductFactory: genera datos de prueba dinamicos para no depender
 * unicamente de fixtures estaticos. Cada llamada produce un producto
 * distinto, lo que evita falsos positivos por datos "quemados" que
 * casualmente ya pasaban antes, y permite overrides puntuales para
 * edge cases especificos.
 */
export const ProductFactory = {
  /** Producto valido con todos los campos requeridos. */
  buildValid(overrides: Partial<ProductPayload> = {}): ProductPayload {
    return {
      title: faker.commerce.productName(),
      price: Number(faker.commerce.price({ min: 1, max: 999, dec: 2 })),
      description: faker.commerce.productDescription(),
      image: faker.image.urlPicsumPhotos(),
      category: faker.helpers.arrayElement([
        'electronics',
        'jewelery',
        "men's clothing",
        "women's clothing",
      ]),
      ...overrides,
    };
  },

  /** Payload vacio, para el Caso 7 (creacion con datos invalidos). */
  buildEmpty(): Record<string, never> {
    return {};
  },

  /** Payload con campos faltantes / con tipos incorrectos. */
  buildMalformed(): Record<string, unknown> {
    return {
      title: '', // campo requerido vacio
      price: 'no-es-un-numero', // tipo incorrecto a proposito
      // description, category e image quedan fuera intencionalmente
    };
  },
};
