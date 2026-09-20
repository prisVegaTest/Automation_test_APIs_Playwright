import { BaseApiClient } from './base.client';

/**
 * ProductsClient: unica puerta de entrada al recurso /products.
 * Responsabilidad unica (S de SOLID): sabe construir las llamadas a este
 * recurso y nada mas. No valida esquemas, no hace aserciones, no conoce
 * Playwright's expect - eso vive en los tests y en los schemas.
 */
export class ProductsClient extends BaseApiClient {
  private readonly basePath = '/products';

  async getById(id: number | string) {
    return this.execute('GET', `${this.basePath}/${id}`);
  }

  async getAll(params?: { limit?: number; sort?: 'asc' | 'desc' }) {
    const query = new URLSearchParams();
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.sort) query.set('sort', params.sort);
    const qs = query.toString();
    return this.execute('GET', qs ? `${this.basePath}?${qs}` : this.basePath);
  }

  async getByCategory(category: string) {
    return this.execute('GET', `${this.basePath}/category/${category}`);
  }

  async getCategories() {
    return this.execute('GET', `${this.basePath}/categories`);
  }

  async create(payload: unknown) {
    return this.execute('POST', this.basePath, { data: payload });
  }

  async updateFull(id: number | string, payload: unknown) {
    return this.execute('PUT', `${this.basePath}/${id}`, { data: payload });
  }
}
