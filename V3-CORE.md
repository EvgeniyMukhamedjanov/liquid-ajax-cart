# V3 Core Architecture

Decided architecture for the core layer (`src/core/`). Covers the queue, task system, state, events, and public API — the foundation that all modules depend on.

## 1. No Core State Module — Read the Result You Already Have

Cart state is not tracked, cached, or fetched by core. `add`, `change`, `update`, `clear`, and `get` all return `Promise<RequestResult>`, and `result.body` already **is** the full cart for every endpoint except `add.js` (Shopify's `add.js` response is only the added line item(s), not the cart). A `request-end` listener receives that same `result` in `detail`, whether or not it made the request itself.

Code that needs the cart and has neither of those in hand — running at an arbitrary time, or right after an `add` — calls `get()` itself.

**Replaces**: v2's `data-ajax-cart-initial-state`, and an earlier v3 plan considered here (state extracted from a `<script data-ajax-cart-state>` tag embedded in a section, auto-injected into every request).

**Why**: v2 sent an unconditional extra request after every `add.js` to recover full cart state, which slowed the library down. A cache built on top of `add`'s response would have to solve request-ordering races against the queue, coalescing concurrent readers, and staleness from cart mutations made outside this library (another tab, a third-party app) — for a saving that only matters when a caller has no result and no event `detail` to read from. Making `get()` the answer for that case means the extra request only happens when a caller explicitly opts into it, never implicitly inside the library.

**Dropped along with this**: the "Liquid-side custom state" idea — merchant-computed properties (a gift variant ID, a free-shipping remainder) living beside `cart` in that same script tag. There's no state-extraction pass left for it to ride on. That kind of logic now falls to user JS reacting to `request-end`.

## 2. Simplified Request Queue

Flat queue instead of v2's 2D array structure. Runs async functions sequentially, one at a time. The queue itself has no knowledge of cart requests, signals, or priorities — it's a pure sequencing primitive. AbortSignal handling belongs in the request execution layer (passed to `fetch()`). Priority is unnecessary — direct methods inside `task()` / `detail.await()` bypass the queue entirely.

## 3. Queue Timing: Promise + `task()` for Queue-Holding

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

## 4. Event System: Internal Async + Public DOM with `detail.await()`

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

## 5. Individual Cart API Methods

Individual methods per Shopify Cart API endpoint: `liquidAjaxCart.get(options?)`, `.add(body, options?)`, `.change(body, options?)`, `.update(body, options?)`, `.clear(options?)`. No single generic `request()` method.

## 6. Promise-Based Methods with Typed Bodies

All cart methods return `Promise<RequestResult>`. Typed request body per method (`AddBody`, `ChangeBody`, `UpdateBody`), `FormData`, or `URLSearchParams`. When `FormData`/`URLSearchParams` is passed, it's sent directly to `fetch()`. When a typed object is passed, it's JSON-stringified with `Content-Type: application/json`.

Options: `{ signal?: AbortSignal, meta?: Record<string, unknown> }`.

Result: `{ ok: boolean, status: number | null, body: object | null, cancelled: boolean }`. `body` **is** the cart for every endpoint except `add` — see §1. There is no separate `liquidAjaxCart.cart`/`.state` accessor.

**Replaces** v2's `void` return, `firstCallback`/`lastCallback`, `important` flag, and `info.cancel`.

## 7. Fully Independent Modules

All modules are completely decoupled. Each module depends only on core events and core's public getters — modules never import from each other. Users can import only the modules they need to minimize bundle size. Each module auto-initializes on import (side-effect import pattern).wi
