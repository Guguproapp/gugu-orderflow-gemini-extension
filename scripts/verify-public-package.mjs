import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const source = await Promise.all(['README.md', 'SECURITY.md', 'GEMINI.md', 'server.mjs', 'src/adapter.mjs', 'src/calculator.mjs']
  .map(async (path) => readFile(new URL(path, root), 'utf8')));
const joined = source.join('\n');
const executable = await Promise.all(['server.mjs', 'src/adapter.mjs', 'src/calculator.mjs']
  .map(async (path) => readFile(new URL(path, root), 'utf8')));
assert.doesNotMatch(joined, /PAYPAL_|LEMON_SQUEEZY_|DATABASE_URL|API[_-]?KEY\s*=/iu);
assert.doesNotMatch(executable.join('\n'), /createSession|checkout|webhook|requireSessionUser/iu);
assert.doesNotMatch(joined, /GUGU_ORDERFLOW_CORE_ROOT|subscription required|paid core/iu);
assert.match(joined, /supplier cost/iu);
console.log('PASS: free public package excludes payment, auth and private-runtime references.');
