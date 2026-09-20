import { defineConfig } from '@playwright/test';

/**
 * Configuracion central del framework.
 * baseURL vive aca, no en cada test, para que un cambio de entorno
 * (dev/qa/staging) sea un cambio de una sola linea.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },

  // Ejecucion en paralelo: cada spec file corre en su propio worker.
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,

  // En CI no se permite dejar un .only olvidado, y se reintenta 1 vez
  // para amortiguar flakiness propia de una API publica de terceros.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: 'https://fakestoreapi.com',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    trace: 'retain-on-failure',
  },
});
