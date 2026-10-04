import { calculateSalesOrder as calculateLocalSalesOrder } from './calculator.mjs';

const MAX_ORDER_BYTES = 128 * 1024;
const FORBIDDEN_KEYS = new Set([
  'unit_cost', 'unitCost', 'supplier_cost', 'supplierCost', 'markup',
  'markup_basis_points', 'markupBasisPoints', 'source_file', 'sourceFile',
  'customer', 'customer_name', 'customerName', 'email', 'address', 'phone',
]);

function result(status, code, note, extra = {}) {
  return { status, error_code: code, notes: [note], applied: false, ...extra };
}

function hasForbiddenKey(value) {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  return Object.entries(value).some(([key, nested]) => FORBIDDEN_KEYS.has(key) || hasForbiddenKey(nested));
}

function hasOnlyKeys(value, allowed) {
  return Object.keys(value).every((key) => allowed.has(key));
}

function isNonNegativeDecimal(value, { allowZero = true } = {}) {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/u.test(value.trim())) return false;
  return allowZero || Number(value) > 0;
}

function validateOrder(order) {
  if (!order || typeof order !== 'object' || Array.isArray(order)) {
    return result('VALIDATION_FAILED', 'ORDER_REQUIRED', 'order must be an object.');
  }
  if (hasForbiddenKey(order)) {
    return result('SCOPE_BLOCKED', 'SENSITIVE_OR_INTERNAL_FIELD', 'Supplier cost, markup, source-document and customer-identity fields are not accepted.');
  }
  if (!hasOnlyKeys(order, new Set(['currency', 'tax_basis_points', 'items']))) {
    return result('SCOPE_BLOCKED', 'ORDER_FIELD_NOT_ALLOWED', 'Only currency, tax_basis_points and items are allowed.');
  }
  if (!/^[A-Z]{3}$/u.test(order.currency ?? '')) {
    return result('VALIDATION_FAILED', 'CURRENCY_INVALID', 'currency must be a three-letter uppercase ISO code.');
  }
  if (!Number.isInteger(order.tax_basis_points) || order.tax_basis_points < 0 || order.tax_basis_points > 10_000) {
    return result('VALIDATION_FAILED', 'TAX_INVALID', 'tax_basis_points must be an integer from 0 to 10000.');
  }
  if (!Array.isArray(order.items) || order.items.length === 0 || order.items.length > 1000) {
    return result('VALIDATION_FAILED', 'ITEMS_INVALID', 'items must contain from 1 to 1000 lines.');
  }
  for (const item of order.items) {
    if (!item || typeof item !== 'object' || Array.isArray(item)
      || !hasOnlyKeys(item, new Set(['name', 'sku', 'quantity', 'unit', 'unit_price']))
      || typeof item.name !== 'string' || item.name.trim().length === 0
      || !isNonNegativeDecimal(item.quantity, { allowZero: false })
      || !isNonNegativeDecimal(item.unit_price)
      || (item.sku !== undefined && typeof item.sku !== 'string')
      || (item.unit !== undefined && typeof item.unit !== 'string')) {
      return result('VALIDATION_FAILED', 'ITEM_INVALID', 'Each item needs a name, positive decimal quantity and non-negative decimal unit_price; sku and unit are optional strings.');
    }
  }
  return null;
}

export function validateRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return result('VALIDATION_FAILED', 'INVALID_INPUT', 'Tool arguments must be an object.');
  }
  if (!hasOnlyKeys(input, new Set(['order']))) {
    return result('SCOPE_BLOCKED', 'INPUT_FIELD_NOT_ALLOWED', 'The wrapper exposes the order field only.');
  }
  if (Buffer.byteLength(JSON.stringify(input), 'utf8') > MAX_ORDER_BYTES) {
    return result('SCOPE_BLOCKED', 'PAYLOAD_TOO_LARGE', `Sales-order payload exceeds ${MAX_ORDER_BYTES} bytes.`);
  }
  const invalid = validateOrder(input.order);
  if (invalid) return invalid;
  return { order: input.order };
}

export async function calculateSalesOrder(input) {
  const validated = validateRequest(input);
  if (validated.status) return validated;
  try {
    const calculation = calculateLocalSalesOrder(validated.order);
    return {
      status: 'ORDER_TOTALS_READY',
      applied: false,
      calculation,
      notes: ['Calculated locally with deterministic minor-unit math. This free tool created no order, export or payment.'],
    };
  } catch {
    return result('ERROR', 'CALCULATION_ERROR', 'The local calculator could not calculate this sales order.');
  }
}

export const toolDefinition = {
  name: 'gugu_orderflow_calculate_sales_order',
  description: 'Calculate customer-ready sales-order totals from selling prices only. Never use it for supplier costs, markup, source documents, customer identity, payments or ERP actions.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['order'],
    properties: {
      order: {
        type: 'object',
        additionalProperties: false,
        required: ['currency', 'tax_basis_points', 'items'],
        properties: {
          currency: { type: 'string', pattern: '^[A-Z]{3}$' },
          tax_basis_points: { type: 'integer', minimum: 0, maximum: 10000 },
          items: {
            type: 'array', minItems: 1, maxItems: 1000,
            items: {
              type: 'object', additionalProperties: false,
              required: ['name', 'quantity', 'unit_price'],
              properties: {
                name: { type: 'string', minLength: 1 },
                sku: { type: 'string' },
                quantity: { type: 'string', minLength: 1 },
                unit: { type: 'string' },
                unit_price: { type: 'string', minLength: 1 },
              },
            },
          },
        },
      },
    },
  },
};
