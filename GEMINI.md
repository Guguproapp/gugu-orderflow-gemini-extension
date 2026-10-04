# Gugu OrderFlow

Use `gugu_orderflow_calculate_sales_order` only to validate a structured,
customer-ready sales order. It accepts selling prices only. Never send supplier
cost, markup, source documents, customer contact details, login data, payment
details, tokens or credentials.

The tool is free and local. It does not read a repository, upload a file,
create an order, export a file, call an ERP, charge a payment method or retain
data. Report its structured status exactly. For `ORDER_TOTALS_READY`, show the
subtotal, tax and total in minor units and remind the user to review their order
before export. For `VALIDATION_FAILED` or `SCOPE_BLOCKED`, explain the returned
reason without inventing a total.
