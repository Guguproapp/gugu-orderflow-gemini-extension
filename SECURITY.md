# Security

- The public extension contains only its small, offline minor-unit calculator.
  It does not contain Gugu OrderFlow application source, databases, R2 files,
  accounts, checkout settings or provider credentials.
- The tool only accepts a small sales-order calculation payload. It rejects
  supplier cost, markup, source file and customer-identity fields.
- It has no configuration fields and no need for a URL, token, API key,
  password, cookie or `.env` path.
- The tool never uploads files, makes network calls, reads the workspace,
  accesses an ERP or applies changes.
- Calculation results are previews only. They do not create an order or prove
  accounting, tax or compliance correctness.

Report security issues through the GuguPro support page without including
credentials, customer documents or private source.
