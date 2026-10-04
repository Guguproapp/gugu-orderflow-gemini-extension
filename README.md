# Gugu OrderFlow Free Calculator for Gemini CLI

A free Gemini CLI Extension that validates customer-ready sales-order totals
using deterministic, local minor-unit math. It does not parse files, create
records or contact external systems.

## Who it is for

Operations teams and small businesses that want a controlled command-line check
of a sales order before exporting it. A Gugu OrderFlow account or subscription
is not required.

## Requirements

- Node.js 22 or newer
- Gemini CLI with Extension support

This extension is free. It requires no payment credentials, web API key,
Gugu OrderFlow account, subscription or network access. Gemini CLI host
authentication is managed separately by Gemini and is not billed by this
extension.

## Install from a local checkout

```sh
gemini extensions install /absolute/path/to/gemini-orderflow --consent --skip-settings
```

## GitHub direct install

```sh
gemini extensions install https://github.com/Guguproapp/gugu-orderflow-gemini-extension
```

This command is intentionally documented before Gallery listing. A GitHub
Release and direct-install verification must be completed before it is claimed
as available. Gallery indexing, if any, is separate.

## Safe request shape

```json
{
  "order": {
    "currency": "USD",
    "tax_basis_points": 500,
    "items": [
      { "name": "Widget", "sku": "W-100", "quantity": "2", "unit": "pcs", "unit_price": "12.50" }
    ]
  }
}
```

The tool returns `ORDER_TOTALS_READY`, `VALIDATION_FAILED`, `SCOPE_BLOCKED` or
`ERROR`. It does not accept supplier cost, markup, customer identity or
source-document fields.

## Uninstall

```sh
gemini extensions uninstall gugu-orderflow
```

Support: https://gugupro.artistuncle.chatgpt.site
