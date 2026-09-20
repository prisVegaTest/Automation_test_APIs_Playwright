import { APIRequestContext, APIResponse } from '@playwright/test';

export interface RequestLog {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export interface ResponseLog {
  status: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface EvidenceEntry {
  request: RequestLog;
  response: ResponseLog;
}

/**
 * BaseApiClient centraliza todo lo transversal a cualquier recurso de la API:
 * construccion de la URL, captura de evidencia (request/response completos)
 * y parseo seguro del body.
 *
 * Los clients concretos (ProductsClient, etc.) heredan de esta clase y solo
 * describen el "que" (que endpoint, que verbo), nunca el "como" se ejecuta
 * la llamada ni como se guarda la evidencia.
 *
 * Principio SOLID aplicado: Open/Closed. Agregar CartsClient o UsersClient
 * no requiere modificar esta clase, solo extenderla.
 */
export abstract class BaseApiClient {
  protected readonly request: APIRequestContext;
  public readonly evidence: EvidenceEntry[] = [];

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Envuelve cualquier llamada HTTP, captura el par request/response
   * completo (para el reporte de fallos exigido en el reto) y devuelve
   * tanto la respuesta cruda de Playwright como el body ya parseado.
   */
  protected async execute(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options?: { data?: unknown; headers?: Record<string, string> }
  ): Promise<{ response: APIResponse; body: unknown; status: number }> {
    const response = await this.request.fetch(path, {
      method,
      data: options?.data,
      headers: options?.headers,
    });

    const status = response.status();
    const body = await this.safeParseJson(response);

    this.evidence.push({
      request: {
        method,
        url: response.url(),
        headers: options?.headers ?? {},
        body: options?.data ?? null,
      },
      response: {
        status,
        headers: response.headers(),
        body,
      },
    });

    return { response, body, status };
  }

  /**
   * Fake Store API no siempre devuelve JSON valido (por ejemplo, un ID
   * inexistente puede responder con body vacio). Parsear "a ciegas" con
   * response.json() rompe el test con un error de parseo poco informativo
   * en vez de dejar que sea la aserción de negocio la que falle con
   * contexto claro.
   */
  private async safeParseJson(response: APIResponse): Promise<unknown> {
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      return null;
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}
