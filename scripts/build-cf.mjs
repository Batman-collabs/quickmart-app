import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';
import {
  cleanBuildOutputDir,
  getWorkerBundleDir,
  writeAssets,
  writeRootConfig,
  writeWorkerConfig,
} from '@cloudflare/build-output-utils';
import { loadAndParseConfig } from '@cloudflare/config';

const root = process.cwd();

if (process.env.SKIP_EXPO_WEB !== '1') {
  console.log('Building Expo web bundle into dist-web...');
  execSync('npx expo export --platform web --output-dir dist-web', {
    stdio: 'inherit',
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
  });
}

await cleanBuildOutputDir(root);

const loaded = await loadAndParseConfig(path.join(root, 'cloudflare.config.ts'), {
  isPreview: false,
  mode: 'production',
});

if (!loaded.result.success) {
  throw new Error(`Invalid cloudflare.config.ts: ${loaded.result.error.message}`);
}

const parsed = loaded.result.data;

if (!parsed.worker) {
  throw new Error('No worker config found in cloudflare.config.ts');
}

const bundleDir = getWorkerBundleDir(root);
await fs.mkdir(bundleDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, 'cloudflare', 'worker.ts')],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  platform: 'neutral',
  mainFields: ['module', 'main'],
  outfile: path.join(bundleDir, 'worker.js'),
});

await writeRootConfig({
  root,
  settings: {
    accountId: parsed.accountId,
    complianceRegion: parsed.complianceRegion,
  },
  buildContext: { isPreview: false, mode: 'production' },
  producer: { name: 'quickmart-build-cf', version: '1.0.0' },
});

await writeAssets({
  root,
  sourceDirectory: path.join(root, 'dist-web'),
});

await writeWorkerConfig({
  root,
  config: parsed.worker,
  manifest: {
    type: 'partial',
    mainModule: 'worker.js',
    modules: {},
  },
});

console.log('Cloudflare Build Output v1 ready in .cloudflare/output/v1');
