import { TestInfo } from '@playwright/test';
import { EvidenceEntry } from '../clients/base.client';

/**
 * Adjunta el detalle completo de request/response al reporte HTML nativo
 * de Playwright (test.info().attach). Esto cubre el requisito del reto de
 * "detalle de fallos con request/response completos" sin tener que
 * construir un reporter custom desde cero: se reutiliza y enriquece el
 * reporter que ya trae la herramienta.
 */
export async function attachEvidence(
  testInfo: TestInfo,
  label: string,
  entry: EvidenceEntry
): Promise<void> {
  await testInfo.attach(`evidencia-${label}`, {
    body: JSON.stringify(entry, null, 2),
    contentType: 'application/json',
  });
}
