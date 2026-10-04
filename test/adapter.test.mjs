import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateSalesOrder, validateRequest } from '../src/adapter.mjs';

const validOrder = () => ({
  order: {
    currency: 'USD', tax_basis_points: 500,
    items: [{ name: 'Widget', sku: 'W-100', quantity: '2', unit: 'pcs', unit_price: '12.50' }],
  },
});

test('calculates a free customer-ready sales order locally', async () => {
  const result = await calculateSalesOrder(validOrder());
  assert.equal(result.status, 'ORDER_TOTALS_READY');
  assert.equal(result.applied, false);
  assert.equal(result.calculation.subtotal_minor, 2500);
  assert.equal(result.calculation.tax_minor, 125);
  assert.equal(result.calculation.total_minor, 2625);
  assert.equal(JSON.stringify(result), JSON.stringify(result).replace(/unitCost|markup/giu, ''));
});

test('blocks supplier-cost and markup data before calculation', () => {
  const request = validOrder();
  request.order.items[0].unit_cost = '5.00';
  const result = validateRequest(request);
  assert.equal(result.status, 'SCOPE_BLOCKED');
  assert.equal(result.error_code, 'SENSITIVE_OR_INTERNAL_FIELD');
});

test('rejects malformed money without a system error', async () => {
  const malformed = validOrder();
  malformed.order.items[0].unit_price = '-2';
  const invalid = await calculateSalesOrder(malformed);
  assert.equal(invalid.status, 'VALIDATION_FAILED');
});
