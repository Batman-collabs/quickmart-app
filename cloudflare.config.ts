import { bindings, defineConfig } from '@cloudflare/config';

export default defineConfig({
  accountId: '4b20588bd2bcdf981faf155917487bbe',
  worker: {
    name: 'quickmart',
    compatibilityDate: '2026-11-26',
    entrypoint: './cloudflare/worker.ts',
    assets: {
      notFoundHandling: 'single-page-application',
      runWorkerFirst: ['/api/*'],
    },
    observability: {
      enabled: true,
      traces: { enabled: true },
    },
    env: {
      DB: bindings.d1({
        id: 'a6f0d759-c8ee-4457-9b53-eddaf22ad358',
        name: 'quickmart-db',
      }),
      ASSETS: bindings.assets(),
    },
  },
});
