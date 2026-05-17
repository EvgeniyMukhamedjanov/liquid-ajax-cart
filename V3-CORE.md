# V3 Core Architecture

Decided architecture for the core layer (`src/core/`). Covers the queue, task system, state, events, and public API — the foundation that all modules depend on.

## 1. State from Section HTML

Cart state is no longer fetched from Cart API JSON responses. Instead, merchants embed state inside a `<script type="application/json" data-ajax-cart-state>` tag within a Shopify section. The core module finds this section on page load, remembers its section ID, and automatically includes it in every cart API request. After each response, core extracts fresh state from the returned section HTML.

**Why**: Eliminates the extra request after `add.js` (which doesn't return full cart state in v2). Section HTML is rendered server-side after the cart operation completes, so the embedded state is always fresh.

**Replaces**: `data-ajax-cart-initial-state` from v2.

## 2. Liquid-Side Custom State

Since state lives in a Liquid-rendered `<script>` tag, merchants can include arbitrary computed properties alongside `cart`. For example, a gift product variant ID that depends on cart total, or a free shipping threshold remainder — all computed in Liquid rather than JavaScript.

**Why**: Moves business logic to Liquid where it naturally belongs (server-rendered, no JS needed). Partially replaces v2's JavaScript-based mutations module for many use cases. JS code can still react to custom state changes via events and trigger cart operations when needed.

## 3. Simplified Request Queue

Flat queue instead of v2's 2D array structure. Runs async functions sequentially, one at a time. The queue itself has no knowledge of cart requests, signals, or priorities — it's a pure sequencing primitive. AbortSignal handling belongs in the request execution layer (passed to `fetch()`). Priority is unnecessary — direct methods inside `task()` / `detail.await()` bypass the queue entirely.

## 4. Queue Timing: Promise + `task()` for Queue-Holding

Cart methods return Promises. Queue advances immediately after the Promise resolves.

For multi-step flows that need to hold the queue across async boundaries, `liquidAjaxCart.task()` accepts an async function. The task itself is a queue item. When it runs, the callback receives a context object with the same cart methods (`add`, `change`, `update`, `clear`, `get`) that execute directly, bypassing the queue:

```ts
await liquidAjaxCart.task(async (cart) => {
  const r1 = await cart.add(body1);
  await someAsyncWork();
  const r2 = await cart.update(body2);
});
```

`task()` is generic over its callback's return type — `task<T>(fn: (cart) => Promise<T>): Promise<T>`. The queued cart methods (`liquidAjaxCart.add()`, `.change()`, etc.) are sugar over `task()` — each is equivalent to `task(async (cart) => cart.add(body, options))` and returns `Promise<RequestResult>`. This makes `task()` + direct cart methods the only two primitives; queued methods are one-liners on top.

Calling `liquidAjaxCart.add()` (queued methods) inside `task()` instead of `cart.add()` causes a deadlock. Guarded by two mechanisms:
- **`toString()` warning**: on `task()` call, the callback source is checked for `liquidAjaxCart.add/change/update/clear/get` references and a console warning is logged if found.
- **Timeout warning**: if a queued request hasn't started executing within a few seconds, a console warning suggests possible deadlock.

## 5. Event System: Internal Async + Public DOM with `detail.await()`

**Two layers**, both async-capable, both run inside the task boundary so the queue blocks until all subscribers finish.

### Internal events (modules)

Custom async subscriber pattern (not DOM `CustomEvent`). Modules subscribe at import time via `onInternal(event, asyncFn)`. Listeners run sequentially in subscription order. Used for work that must complete before public events fire (e.g. sections module fetching extra chunks).

### Public events (user code)

Standard DOM `CustomEvent` on `document`. Users subscribe with `document.addEventListener` — works before the library loads, no dependency on `window.liquidAjaxCart`.

For sync-only listeners, nothing changes — just read `e.detail` and done.

For async work that should block the queue, call `e.detail.await(callback)`. The callback receives a `cart` object with direct (bypass-queue) cart methods, same as inside `task()`:

```js
document.addEventListener('liquid-ajax-cart:request-end', (e) => {
  // Sync work — runs normally, doesn't block queue
  console.log(e.detail.result);

  // Async work — blocks queue until complete
  e.detail.await(async (cart) => {
    const result = await cart.add({ id: giftVariantId, quantity: 1 });
    await someOtherAsyncWork();
  });
});
```

**How it works**: `dispatchEvent()` is synchronous — all listeners execute during the dispatch call. Any `detail.await()` calls register async callbacks synchronously. After dispatch returns, the queue awaits all collected promises before advancing to the next queue item.

**Execution order within a request lifecycle**:
1. Request completes, state updates
2. Internal async subscribers run (sequential, in subscription order)
3. Public DOM event fires — sync listeners run, `detail.await()` callbacks are collected
4. All collected `detail.await()` promises are awaited
5. Task promise resolves → queue advances

**Events**: `liquid-ajax-cart:request-start` (before fetch), `liquid-ajax-cart:request-end` (after fetch + state update).

**Inside `task()`**: Sub-requests made via `cart.add()` etc. trigger the full event lifecycle including all subscribers. Consistent behavior regardless of whether a request came from the queue or from inside a task.

**Why not `liquidAjaxCart.on()`**: A dedicated subscription method would require the library to be loaded first. DOM events work immediately — user code can subscribe in a `<script>` tag before the library's `<script>` tag. No load-order dependency.

## 6. Individual Cart API Methods

Individual methods per Shopify Cart API endpoint: `liquidAjaxCart.get(options?)`, `.add(body, options?)`, `.change(body, options?)`, `.update(body, options?)`, `.clear(options?)`. No single generic `request()` method.

## 7. Promise-Based Methods with Typed Bodies

All cart methods return `Promise<RequestResult>`. Typed request body per method (`AddBody`, `ChangeBody`, `UpdateBody`), `FormData`, or `URLSearchParams`. When `FormData`/`URLSearchParams` is passed, it's sent directly to `fetch()`. When a typed object is passed, it's JSON-stringified with `Content-Type: application/json`.

Options: `{ signal?: AbortSignal, meta?: Record<string, unknown> }`.

Result: `{ ok: boolean, status: number | null, body: object | null }`. Cart state is not in the result — accessible via `liquidAjaxCart.cart`/`liquidAjaxCart.state`, already updated when the Promise resolves.

**Replaces** v2's `void` return, `firstCallback`/`lastCallback`, `important` flag, and `info.cancel`.

## 8. Fully Independent Modules

All modules are completely decoupled. Each module depends only on core events and core's public getters — modules never import from each other. Users can import only the modules they need to minimize bundle size. Each module auto-initializes on import (side-effect import pattern).wi
