const MONEY_SCALE = 100n;
const QUANTITY_SCALE = 1000n;
const RATE_SCALE = 10_000n;

function decimalToScaled(value, scale) {
  const normalized = String(value).trim().replace(/[$,]/g, '');
  if (!/^\d+(?:\.\d+)?$/u.test(normalized)) {
    throw new Error(`Invalid decimal value: ${value}`);
  }
  const [whole, fraction = ''] = normalized.split('.');
  const digits = scale.toString().length - 1;
  const padded = `${fraction}${'0'.repeat(digits)}`;
  let result = BigInt(whole) * scale + BigInt(padded.slice(0, digits) || '0');
  if (Number(padded[digits] ?? '0') >= 5) result += 1n;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large.');
  return Number(result);
}

function lineAmount(unitPriceMinor, quantityMilli) {
  const result =
    (BigInt(unitPriceMinor) * BigInt(quantityMilli) + QUANTITY_SCALE / 2n) /
    QUANTITY_SCALE;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large.');
  return Number(result);
}

function taxAmount(subtotalMinor, taxBasisPoints) {
  const result =
    (BigInt(subtotalMinor) * BigInt(taxBasisPoints) + RATE_SCALE / 2n) /
    RATE_SCALE;
  if (result > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large.');
  return Number(result);
}

function safeSum(values) {
  const total = values.reduce((sum, value) => sum + BigInt(value), 0n);
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Amount is too large.');
  return Number(total);
}

/** Public, offline sales-order math. No account, service dependency or network call. */
export function calculateSalesOrder(order) {
  const lines = order.items.map((item) => {
    const quantityMilli = decimalToScaled(item.quantity, QUANTITY_SCALE);
    const unitPriceMinor = decimalToScaled(item.unit_price, MONEY_SCALE);
    if (quantityMilli <= 0 || unitPriceMinor < 0) {
      throw new Error('Quantity and unit price must be valid non-negative values.');
    }
    return {
      name: item.name,
      sku: item.sku ?? '',
      unit: item.unit ?? '',
      quantity: item.quantity,
      unit_price_minor: unitPriceMinor,
      amount_minor: lineAmount(unitPriceMinor, quantityMilli),
    };
  });
  const subtotalMinor = safeSum(lines.map((line) => line.amount_minor));
  const taxMinor = taxAmount(subtotalMinor, order.tax_basis_points);
  return {
    currency: order.currency,
    lines,
    subtotal_minor: subtotalMinor,
    tax_basis_points: order.tax_basis_points,
    tax_minor: taxMinor,
    total_minor: safeSum([subtotalMinor, taxMinor]),
  };
}
