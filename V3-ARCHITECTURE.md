# V3 Architecture Decisions

This document captures decided architecture directions and open questions for the v3 rewrite. It covers **what** and **why**, not implementation details.

## Decided

### 1. State from Section HTML

Cart state is no longer fetched from Cart API JSON responses. Instead, merchants embed state inside a `<script type="application/json" data-ajax-cart-state>` tag within a Shopify section. The core module finds this section on page load, remembers its section ID, and automatically includes it in every cart API request. After each response, core extracts fresh state from the returned section HTML.

**Why**: Eliminates the extra request after `add.js` (which doesn't return full cart state in v2). Section HTML is rendered server-side after the cart operation completes, so the embedded state is always fresh.

**Replaces**: `data-ajax-cart-initial-state` from v2.

### 2. Liquid-Side Custom State

Since state lives in a Liquid-rendered `<script>` tag, merchants can include arbitrary computed properties alongside `cart`. For example, a gift product variant ID that depends on cart total, or a free shipping threshold remainder — all computed in Liquid rather than JavaScript.

**Why**: Moves business logic to Liquid where it naturally belongs (server-rendered, no JS needed). Partially replaces v2's JavaScript-based mutations module for many use cases. JS code can still react to custom state changes via events and trigger cart operations when needed.

### 3. Section Rendering API for Extra Chunks

When more than 5 sections need updating, additional section HTML is fetched via Shopify's Section Rendering API (`GET /?sections=...`) instead of v2's approach of sending empty `POST /cart/update.js` requests.

**Why**: The Section Rendering API is read-only — it renders sections without modifying the cart. Clean separation of concerns vs. sending a fake update request.

### 4. Fully Independent Modules

All modules are completely decoupled. Each module depends only on core events and core's public getters — modules never import from each other. Users can import only the modules they need to minimize bundle size. Each module auto-initializes on import (side-effect import pattern).

**Source structure**:
- `_src/core/` — queue, state, events, types
- `_src/modules/` — sections, css-classes, optimistic-ui, dom-binder, messages, controls/
- `_src/index.ts` — full bundle entry (imports core + all modules)

### 5. Internal Async Event System

Internal events use a custom subscriber pattern (not DOM `CustomEvent`) so modules can perform async work before public events fire. For example, the sections module needs to fetch extra section chunks (async) before the public `request-end` event fires.

Public events still use `document.dispatchEvent(new CustomEvent(...))` for user code.

### 6. Simplified Request Queue

Flat queue with priority levels (`normal` / `high`) instead of v2's 2D array structure. Requests execute sequentially, one at a time. High-priority items go to front of queue. AbortSignal support carried over from v2.

### 7. CSS Classes Module

No automatic classes.

Per-element classes for are also (see Open Questions below).

### 8. Optimistic UI (Template-Based)

Users provide a `<template data-ajax-cart-optimistic-template>` element in their cart section defining placeholder item structure. Hidden inputs with `data-ajax-cart-optimistic-data` in the product form carry the data to populate it. On add-to-cart, the template is cloned, filled, and inserted into `data-ajax-cart-optimistic-container`. When the server response arrives, the sections module replaces the HTML naturally.

### 9. Build System: Rollup

Replace Webpack 5 with Rollup. Output includes full bundle (`liquid-ajax-cart.js` / `.min.js`), individual module files for selective CDN imports, and subpath exports in `package.json` for bundler tree-shaking.

**Why**: Rollup is the standard for library building. Better tree-shaking output, simpler config for multi-entry libraries.

### 11. DOM Binder

Deprecated

### 12. Individual Cart API Methods

Individual methods per Shopify Cart API endpoint: `liquidAjaxCart.get(options?)`, `.add(body, options?)`, `.change(body, options?)`, `.update(body, options?)`, `.clear(options?)`. No single generic `request()` method.

### 13. Promise-Based Methods with Typed Bodies

All cart methods return `Promise<CartRequestResult>`. Typed request body per method (`AddBody`, `ChangeBody`, `UpdateBody`), `FormData`, or `URLSearchParams`. When `FormData`/`URLSearchParams` is passed, it's sent directly to `fetch()`. When a typed object is passed, it's JSON-stringified with `Content-Type: application/json`.

Options: `{ signal?: AbortSignal, priority?: 'normal' | 'high', info?: Record<string, unknown> }`.

Result: `{ ok: boolean, status: number | null, body: object | null }`. Cart state is not in the result — accessible via `liquidAjaxCart.cart`/`liquidAjaxCart.state`, already updated when the Promise resolves.

**Replaces** v2's `void` return, `firstCallback`/`lastCallback`, `important` flag, and `info.cancel`.

### 14. Queue Timing: Promise + `task()` for Queue-Holding

Cart methods return Promises. Queue advances immediately after the Promise resolves.

For multi-step flows that need to hold the queue across async boundaries, `liquidAjaxCart.task()` accepts an async function. The task itself is a queue item. When it runs, the callback receives a context object with the same cart methods (`add`, `change`, `update`, `clear`, `get`) that execute directly, bypassing the queue:

```ts
await liquidAjaxCart.task(async (cart) => {
  const r1 = await cart.add(body1);
  await someAsyncWork();
  const r2 = await cart.update(body2);
});
```

Calling `liquidAjaxCart.add()` (queued methods) inside `task()` instead of `cart.add()` causes a deadlock. Guarded by two mechanisms:
- **`toString()` warning**: on `task()` call, the callback source is checked for `liquidAjaxCart.add/change/update/clear/get` references and a console warning is logged if found.
- **Timeout warning**: if a queued request hasn't started executing within a few seconds, a console warning suggests possible deadlock.

### 15. Testing: Playwright Only

All tests run in a real browser via Playwright
- **E2E against demo store**: tests hit the live Shopify store (`liquid-ajax-cart.myshopify.com`) to verify real Cart API behavior, section rendering freshness, and end-to-end flows.

Module-specific tests are co-located with source (`*.spec.ts` next to the module). Cross-cutting integration tests live in `e2e/` at the project root.

### 16. Folder Structure

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
