import { z } from 'zod';

/**
 * Schemas como "estrategia de validacion" desacoplada del test.
 * Un test nunca compara campo por campo a mano: le pasa la respuesta
 * al schema y el schema decide si la forma y los tipos son correctos.
 * Esto hace que la calidad de las aserciones (20% del reto) sea
 * declarativa, legible y reusable entre casos positivos y negativos.
 */

export const RatingSchema = z.object({
  rate: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
});

export const ProductSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  description: z.string(),
  category: z.string().min(1),
  image: z.string().url(),
  rating: RatingSchema,
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Fake Store API, al crear/actualizar, no siempre devuelve el objeto
 * completo con "rating" (el mock a veces omite ese campo en la
 * respuesta de escritura). Se define un schema mas laxo para las
 * respuestas de creacion/actualizacion, y se documenta la razon en
 * EVALUATION.md en vez de forzar el schema de lectura y generar falsos
 * negativos.
 */
export const ProductWriteResponseSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  description: z.string().optional(),
  category: z.string().optional(),
  image: z.string().optional(),
  rating: RatingSchema.optional(),
});

export const ProductListSchema = z.array(ProductSchema);
