# Publication checklist

## Completed locally

- [x] The extension is a standalone free calculator with no product Core.
- [x] The wrapper exposes one local-only, customer-ready sales-order total.
- [x] Supplier cost, markup, source-document and customer-identity fields are blocked.
- [x] Manifest validation passes with `gemini extensions validate`.
- [x] Local MCP protocol, safe result, invalid input and boundary tests pass.
- [x] Public-wrapper scan finds no payment, auth, database or runtime-secret
  references.

## External publication gates

- [ ] Create a new public GitHub repository containing only `gemini-orderflow/`.
- [ ] Publish a tagged GitHub Release.
- [ ] Verify direct install from the public GitHub URL on a host that permits
  writes to `~/.gemini/extensions`.
- [ ] Verify the installed free extension with a normal Gemini CLI session.
- [ ] Add the `gemini-cli-extension` repository topic.
- [ ] Observe official Gemini Extension Gallery indexing, if offered.

## Current blocker

This controlled environment rejects the Gemini CLI install step with `EPERM`
when the CLI attempts to create `~/.gemini/extensions/gugu-orderflow`. The
manifest validator and stdio MCP tests pass, but local-install evidence is
therefore `NOT RUN` here. This is not represented as a successful install.
