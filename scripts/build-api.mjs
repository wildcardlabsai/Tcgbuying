// Bundles the Express API (server/app.ts and everything it imports) into one plain JavaScript file,
// api/index.js, which Vercel runs as its serverless function. Bundling avoids Node's ESM rules about
// file extensions and JSON imports that break a TypeScript project deployed as-is.
// The output is committed; re-run `npm run build:api` after changing anything under server/.
import { build } from 'esbuild';

await build({
  entryPoints: ['server/app.ts'],
  outfile: 'api/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  legalComments: 'none',
  // Some bundled dependencies still use require(); give the ESM bundle one.
  banner: { js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);" },
  logLevel: 'info',
});
