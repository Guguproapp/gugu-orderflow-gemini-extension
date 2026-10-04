import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

const fixtureOrder = {
  order: {
    currency: 'USD', tax_basis_points: 500,
    items: [{ name: 'Widget', quantity: '2', unit_price: '12.50' }],
  },
};

test('stdio MCP lists and invokes only the sales-order calculator', async () => {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: resolve('.'),
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = createInterface({ input: child.stdout });
  const responses = [];
  lines.on('line', (line) => responses.push(JSON.parse(line)));
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'gugu_orderflow_calculate_sales_order', arguments: fixtureOrder } })}\n`);
  const deadline = Date.now() + 5000;
  while (responses.length < 3 && Date.now() < deadline) await new Promise((wait) => setTimeout(wait, 20));
  child.kill('SIGTERM');
  await once(child, 'close');
  assert.equal(responses[0].result.serverInfo.name, 'gugu-orderflow');
  assert.equal(responses[1].result.tools[0].name, 'gugu_orderflow_calculate_sales_order');
  assert.equal(responses[2].result.structuredContent.status, 'ORDER_TOTALS_READY');
  assert.equal(responses[2].result.isError, false);
});

test('domain rejections are structured results rather than MCP transport errors', async () => {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: resolve('.'), env: { ...process.env }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = createInterface({ input: child.stdout });
  const responses = [];
  lines.on('line', (line) => responses.push(JSON.parse(line)));
  const unsafe = fixtureOrder;
  unsafe.order.items[0].markup = 500;
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'gugu_orderflow_calculate_sales_order', arguments: unsafe } })}\n`);
  const deadline = Date.now() + 5000;
  while (responses.length < 1 && Date.now() < deadline) await new Promise((wait) => setTimeout(wait, 20));
  child.kill('SIGTERM');
  await once(child, 'close');
  assert.equal(responses[0].result.structuredContent.status, 'SCOPE_BLOCKED');
  assert.equal(responses[0].result.isError, false);
});
