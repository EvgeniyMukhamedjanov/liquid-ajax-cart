# Plan: Playwright Setup + v3 Core Module

## Context

The v3 branch has an empty `src/index.ts`. We need to set up the Playwright test infrastructure and build the three core modules (`events`, `queue`, `state`) plus the `types` file and entry point. This gives us the foundational request pipeline — everything else (sections, css-classes, dom-binder, controls, etc.) will be built on top of these core modules later.

## Phase 1: Playwright Infrastructure

### Install dependencies

```
npm install -D @playwright/test serve
npx playwright install chromium
```

Only Chromium — sufficient for mocked-network testing.

### New files

**`playwright.config.ts`** — Playwright configuration:

- `testMatch`: `src/**/*.spec.ts` and `e2e/**/*.spec.ts`
- `webServer`: `npx serve . -l 4000 --no-clipboard` (serves project root so test pages can reference `/demo/assets/liquid-ajax-cart.js`)
- Single Chromium project

**`test-pages/index.html`** — Base test page with a mock Shopify section containing `<script data-ajax-cart-state>` with a sample cart JSON. Loads `<script type="module" src="/assets/liquid-ajax-cart.js">`.

### Modify existing files

**`package.json`** — Add scripts:

- `"test": "webpack --mode=development && npx playwright test"`
- `"test:ui": "webpack --mode=development && npx playwright test --ui"`

**`tsconfig.json`** — Add `"exclude": ["node_modules", "**/*.spec.ts", "e2e/**", "playwright.config.ts"]` to prevent ts-loader from bundling test files.

**`webpack.config.js`** — Add `DefinePlugin` with `__DEV__` flag (true in development, false in production). This lets core modules expose test hooks in dev builds only:

```js
plugins: [new webpack.DefinePlugin({ __DEV__: JSON.stringify(argv.mode === "development") })];
```

### Smoke test

Write a trivial `src/core/smoke.spec.ts` that loads the test page and verifies the built script runs. Delete it once real tests exist.

## Phase 2: `src/core/types.ts`

Pure type definitions, no runtime code. Key types:

| Type                                     | Purpose                                                        |
| ---------------------------------------- | -------------------------------------------------------------- |
| `JSONValue`, `JSONObject`                | Utility types (carried from v2)                                |
| `Cart`, `LineItem`                       | Cart object shape from Shopify                                 |
| `State`                                  | Full state object: `{ cart: Cart, ...customKeys }` — new in v3 |
| `RequestType`                            | `'add' \| 'change' \| 'update' \| 'clear' \| 'get'`            |
| `AddBody`, `ChangeBody`, `UpdateBody`    | Typed request bodies per method                                |
| `RequestBody`                            | Union: typed body \| `FormData` \| `URLSearchParams`           |
| `RequestOptions`                         | `{ signal?, priority?, info? }`                                |
| `RequestResult`                          | `{ ok, status, body }` — the Promise return value              |
| `QueueItem`                              | Internal: request + `resolve`/`reject` for the Promise         |
| `RequestStartDetail`, `RequestEndDetail` | Event detail shapes                                            |
| `InternalSubscriber<T>`                  | Async callback type for internal events                        |
| `Window` augmentation                    | `window.liquidAjaxCart` and `window.Shopify`                   |

## Phase 3: `src/core/events.ts` + `events.spec.ts`

**The internal async event bus.** This is foundational — queue and state depend on it.

Two systems:

1. **Internal subscriber pattern** — modules call `onInternal(eventName, callback)` to register. Callbacks can be async. When `fireEvent(name, detail)` is called, all internal subscribers run sequentially (awaited in registration order). The `detail` object is mutable — subscribers enrich it (e.g., state module adds `cart`/`previousCart`).
2. **Public DOM events** — After all internal subscribers complete, `document.dispatchEvent(new CustomEvent(...))` fires with the fully-populated detail.

Exports: `onInternal()`, `fireEvent()`, `EVENTS` constant object.

Dev-only: expose `{ onInternal, fireEvent }` on `window.__lacEvents__` behind `__DEV__` guard for direct test access.

**Test cases** (`events.spec.ts`):

- Subscribers receive correct detail
- Async subscribers awaited in registration order (subscriber 1 delays, subscriber 2 sees its effect)
- Detail mutation propagates across subscribers
- Public DOM event fires after all internal subscribers complete
- Public DOM event detail contains enrichments from internal subscribers

**Test page**: `test-pages/events-test.html` — minimal page loading the library.

## Phase 4: `src/core/queue.ts` + `queue.spec.ts`

**Flat sequential request queue with priority.**

Key design:

- `queue: QueueItem[]` — flat array (replaces v2's 2D `queues[][]`)
- `enqueue(type, body, options)` returns `Promise<RequestResult>` by creating a QueueItem with `resolve`/`reject`
- High priority: `queue.unshift()`. Normal: `queue.push()`
- `processQueue()` is async — awaits `fireEvent('request-start', startDetail)`, performs fetch, awaits `fireEvent('request-end', endDetail)`, then resolves the Promise
- **Body mutation pattern**: the `startDetail.body` reference is what gets sent to `fetch()`. Internal subscribers (like the state module) can modify this body during `request-start` to inject section IDs
- For GET requests (`/cart.js`), sections are appended as URL query params rather than body
- Fetch headers: `Content-Type: application/json` for object bodies, `x-requested-with: XMLHttpRequest` for FormData/URLSearchParams
- AbortSignal: checked before fetch (skip if already aborted), passed to `fetch()` for in-flight cancellation

Exports: `enqueue()`, `isProcessing()`.

**Test cases** (`queue.spec.ts`) — using `page.route()` to intercept fetch:

- Single request resolves with correct `{ ok, status, body }`
- Multiple requests execute sequentially (second starts only after first completes)
- High-priority request jumps ahead of normal-priority
- AbortSignal cancels pending request (resolves `{ ok: false, status: null, body: null }`)
- AbortSignal cancels in-flight request
- `queue-start`/`queue-end` events fire at queue boundaries
- `request-start`/`request-end` events fire per request
- JSON body sends correct Content-Type
- FormData sends correct headers
- GET request uses GET method with no body
- Network error resolves gracefully (not rejected)

**Test page**: `test-pages/queue-test.html` — loads library with `data-ajax-cart-state` section.

## Phase 5: `src/core/state.ts` + `state.spec.ts`

**State from section HTML** — the key v3 architectural change.

`initState()` (synchronous):

1. Find `<script data-ajax-cart-state>` in the DOM
2. Walk up to find parent `[id^="shopify-section-"]`, extract section ID
3. Parse JSON as initial `State`
4. Subscribe to `request-start` — inject state section ID into request body's `sections` param
5. Subscribe to `request-end` — parse `<script data-ajax-cart-state>` from response section HTML, update state, enrich event detail with `state`/`previousState`/`cart`/`previousCart`

Exports: `initState()`, `getState()`, `getPreviousState()`, `getCart()`, `getPreviousCart()`, `getStateSectionId()`.

**Test cases** (`state.spec.ts`):

- Initial state parsed from DOM script tag
- `getCart()` returns the cart from initial state
- Custom state keys (e.g. `freeShippingRemaining`) accessible via `getState()`
- `getStateSectionId()` returns correct ID
- State section ID is injected into request body (verify via `page.route()` intercepting the outgoing request)
- After request, state updates from response section HTML
- `previousState`/`previousCart` reflect pre-update values
- Missing `data-ajax-cart-state` tag logs error
- Malformed JSON handled gracefully

**Test page**: `test-pages/state-test.html` — Shopify section with state script tag and custom keys.

## Phase 6: `src/index.ts` + `e2e/fixtures.ts`

**Entry point** — wires up core and exposes `window.liquidAjaxCart`:

1. Import core modules
2. Call `initState()` — synchronous DOM read + event subscriptions
3. Build API: `get()`, `add()`, `change()`, `update()`, `clear()` — each calls `enqueue()`
4. Expose read-only properties via `Object.defineProperty`: `cart`, `previousCart`, `state`, `previousState`, `processing`, `init`
5. Fire `init` event
6. Guard with `if (!('liquidAjaxCart' in window))`

**`e2e/fixtures.ts`** — shared Playwright test helpers:

- `buildSectionHtml(sectionId, stateObj)` — builds mock section HTML strings for route mocking
- `waitForInit(page)` — waits for `liquid-ajax-cart:init` event
- `getCart(page)` — evaluates `window.liquidAjaxCart.cart`

## Build order summary

```
1. Playwright setup + smoke test           (verify test pipeline works)
2. src/core/types.ts                      (pure types, no tests needed)
3. src/core/events.ts + spec              (foundational, no deps)
4. src/core/queue.ts + spec               (depends on events)
5. src/core/state.ts + spec               (depends on events, used by queue via events)
6. src/index.ts + e2e/fixtures.ts         (wires everything up)
```

## Verification

After each phase, run `npm test` to confirm all tests pass. After Phase 6, verify the full flow:

1. `npm test` — all spec files pass
2. `npm run webpack-watch` — dev build succeeds
3. Load test page in browser — `window.liquidAjaxCart` API is accessible, `init` is `true`, `cart` returns the initial state
