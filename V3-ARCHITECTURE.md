# V3 Architecture — Modules, Build & Open Questions

For core architecture (queue, task, state, events, public API), see **V3-CORE.md**.

## Decided

### Section Rendering API for Extra Chunks

When more than 5 sections need updating, additional section HTML is fetched via Shopify's Section Rendering API (`GET /?sections=...`) instead of v2's approach of sending empty `POST /cart/update.js` requests.

**Why**: The Section Rendering API is read-only — it renders sections without modifying the cart. Clean separation of concerns vs. sending a fake update request.

### CSS Classes Module

No automatic classes.

Per-element classes are also possible (see Open Questions below).

### Optimistic UI (Template-Based)

Users provide a `<template data-ajax-cart-optimistic-template>` element in their cart section defining placeholder item structure. Hidden inputs with `data-ajax-cart-optimistic-data` in the product form carry the data to populate it. On add-to-cart, the template is cloned, filled, and inserted into `data-ajax-cart-optimistic-container`. When the server response arrives, the sections module replaces the HTML naturally.

### DOM Binder

Deprecated.

### Build System: Rollup

Replace Webpack 5 with Rollup. Output includes full bundle (`liquid-ajax-cart.js` / `.min.js`), individual module files for selective CDN imports, and subpath exports in `package.json` for bundler tree-shaking.

**Why**: Rollup is the standard for library building. Better tree-shaking output, simpler config for multi-entry libraries.

### Testing: Playwright Only

All tests run in a real browser via Playwright.
- **E2E against demo store**: tests hit the live Shopify store (`liquid-ajax-cart.myshopify.com`) to verify real Cart API behavior, section rendering freshness, and end-to-end flows.

Module-specific tests are co-located with source (`*.spec.ts` next to the module). Cross-cutting integration tests live in `e2e/` at the project root.

### Folder Structure

```
_src/
  core/
    queue.ts
    queue.spec.ts
    state.ts
    state.spec.ts
    events.ts
    events.spec.ts
    types.ts
  modules/
    sections.ts
    sections.spec.ts
    css-classes.ts
    css-classes.spec.ts
    dom-binder.ts
    dom-binder.spec.ts
    messages.ts
    messages.spec.ts
    optimistic-ui.ts
    optimistic-ui.spec.ts
    controls/
      product-form.ts
      product-form.spec.ts
      quantity.ts
      quantity.spec.ts
  index.ts
e2e/
  fixtures.ts
  full-flow.spec.ts
```

## Open Questions

### B. CSS Classes Per-Element Configuration Format

**Option 1** — Separate data attributes per trigger:
`data-ajax-cart-class-processing="is-loading"`, `data-ajax-cart-class-removing="is-removing"`.
Easier to read in templates, no JSON parsing.

**Option 2** — JSON-based single attribute:
`data-ajax-cart-class='{"processing": "is-loading", "removing": "is-removing"}'`.

Elements would also need `data-ajax-cart-item="{{ item.key }}"` to identify which line item they relate to.

### C. Mutations Module: Keep, Drop, or Replace?

v2 has a mutations middleware system that can inject cart requests. v3's Liquid-side custom state partially replaces this. Should v3 keep a formal mutations/reactor module, or rely on user-written event listener code?

A "State Reactor" concept was discussed — a declarative module that watches custom state keys and automatically triggers cart actions — but the current lean is to keep it as user JS for now and consider adding it later if demand warrants.

### D. Section Rendering API Endpoint Freshness

Does `GET /?sections=...` return fresh HTML when called immediately after `add.js` completes? Since it's a separate request after the primary cart operation, the sections should be fresh — but this needs verification with Shopify's actual behavior.

### E. `add.js` Response Section Freshness

In v2, `add.js` response section HTML could be stale. With v3 reading state from section HTML, verifying whether the `add.js` response sections are fresh is critical. If they are fresh, the extra request after `add.js` is completely eliminated.

### F. Re-render Method

In v2, the update() method without params were used to re-render everything. Maybe we should consider adding a separate method that will run section API to pull the data instead?

## Cases to Consider

https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/discussions/85
Mutation automatically adds a product to the cart. But if the user removes it, then mutation shouldn't add it anymore. In v2 solved using subscribing to request-end, reading items_removed from the request and saving boolean to localstorage .

BFcache should be solved

Dynamic checkout button disappears
https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/discussions/62
