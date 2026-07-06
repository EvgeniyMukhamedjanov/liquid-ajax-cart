# V3 Sections — Design

The sections module re-renders cart HTML after each cart mutation. It detects re-render containers on the page, asks Shopify to render the sections that feed them, and swaps the fresh content into each container.

## Responsibility — presentational only

The module is **purely presentational**. It never reads, parses, or exposes cart data. Its entire job is: "given a cart mutation, make the marked containers reflect freshly-rendered Shopify HTML." Cart state — including the JSON body, custom Liquid-generated props, and any request-triggering ("reactor") logic — is a separate module's concern and is out of scope here.

This keeps the module single-purpose: it does not care *what* data the HTML carries, only that it replaces the right containers with the right server HTML.

## Markup contract

One attribute marks every re-render container — a **fragment** of section-rendered HTML:

```
data-ajax-cart-fragment="<sectionId>/<name>"
```

Both parts are **required**.

| Part | Meaning |
|---|---|
| `<sectionId>` | The Shopify section that renders this content. Tells the module which section to request. |
| `<name>` | The fragment's identifier, unique within that section. The join key between source and target. |

The token means **"my content is rendered by section `<sectionId>`."** It carries that one meaning on every element, wherever it lives — the section part is *not* "the section I'm inside," it is "the section whose render produces my content."

### Source / target are roles, not separate attributes

The same token marks both ends of a re-render:

- **Sources** are the elements found *inside the freshly-rendered section HTML*, keyed by `<name>`.
- **Targets** are *all on-page elements* carrying that `<sectionId>/<name>` token.

They **overlap** for a self-rendering container (the cart drawer lives in `cart` and is on the page) and **differ** for a cross-section mirror (a header cart-icon is on the page but its content is produced inside `cart`). The module never special-cases this — it reads sources out of the rendered section it requested, and writes to every on-page target with the matching token.

**Content transferred = the source element's children.** The page element's own tag, attributes, and classes stay put; only its inner content is replaced. A header `<span>` and a `cart`-section `<div>` may differ as wrappers — only their children are mirrored.

### Example — cart icon in the header

```liquid
{# sections/cart.liquid — the drawer body and the icon both live here #}
<div  data-ajax-cart-fragment="cart/drawer"> … line items … </div>
<span data-ajax-cart-fragment="cart/icon">{{ cart.item_count }}</span>

{# sections/header.liquid — mirrors the icon, same token #}
<span data-ajax-cart-fragment="cart/icon">{{ cart.item_count }}</span>
```

On any cart mutation the module requests **only** `sections=cart`. It reads the fresh `cart/icon` content and writes it into *every* on-page `cart/icon` (the drawer's and the header's). The heavy `header` section is never rendered.

## Fetch strategy — hybrid, reconciled to server truth

Shopify's Bundled Section Rendering caps at **5 sections per cart request**. The module bundles up to 5 into the mutation request and fetches anything else via the Section Rendering API (`GET /?sections=…`).

It is assumed that the bundled section HTML in a `cart/*.js` response is **fresh** (reflects the just-applied mutation). This resolves architecture open-question E by assumption; if it proves false, the fix is to route everything through `GET /?sections=` instead.

`SECTIONS_PER_REQUEST = 5` is the only place the limit appears.

### On `REQUEST_START` (only `add` / `change` / `update` / `clear`)

`get` (`cart.js`) is **never** augmented and never triggers a re-render.

1. Scan the page for distinct `<sectionId>`s across all `[data-ajax-cart-fragment]` tokens.
2. Inject `sections=<first SECTIONS_PER_REQUEST ids>` into `ctx.body`, merging with any merchant-set `sections` value (dedupe).

That is the handler's only job. It carries **no state** to request-end.

**`clear` is the exception:** it is dispatched with a `null` body, so there is nothing to mutate in place and no bundling happens for it. That is intentional — `clear` falls through to the request-end reconciliation, which finds none of the on-page sections in the (sectionless) response and fetches them all via `GET /?sections=`. The UI ends up correct at the cost of one extra round-trip. `clear` is rare, so this is preferred over giving `clear` a synthetic body purely to bundle. (`add` / `change` / `update` always carry a `FormData`/object body and are bundled normally.)

### On `REQUEST_END` — unified reconciliation

The module does not branch on success vs. error. After every mutation it reconciles every on-page section to server truth:

```
if result.status === null: return            // abort / network failure → do nothing
provided  = result.body?.sections ?? {}       // bundled HTML (empty object on a 422)
onPageIds = distinct on-page section ids       // recomputed here, NOT remembered from start
missing   = onPageIds not present in `provided`
fetched   = missing.length ? await sectionApiGet(missing) : {}   // same task, awaited
render({ ...provided, ...fetched })
```

- **Success ≤5** → `provided` is everything, `missing` is empty, no extra request.
- **Success >5** → `provided` is the bundled 5, `missing` is the overflow → fetched via GET.
- **Error with no sections (e.g. 422)** → `provided` is empty, `missing` is all on-page sections → fetched via GET and still re-rendered, so the UI reflects current server state even after a failed mutation.

The leftover set is **recomputed** at request-end (`onPageIds − keys(provided)`), not stashed on `ctx.meta` or in a closure. Recomputing is simpler and more correct: it reflects the DOM at render time, since the fetch is asynchronous and the page may have changed since request-start.

`status === null` (an abort or genuine network failure) is the only skip case — a follow-up GET would be futile, and an aborted request must not repaint.

### `sectionApiGet(ids)`

Fetches `GET /?sections=<ids>` via the Section Rendering API, chunked at `SECTIONS_PER_REQUEST` per request, results merged. It uses the `api` instance **passed to the request-end listener** — a direct request that bypasses the core queue, so issuing it from inside a queued step does not deadlock. Because `api.#request` awaits the `REQUEST_END` hook, the queue step stays open until rendering (including these GETs) completes, keeping `processing` / `queue-end` accurate.

## Render algorithm

For each `sectionId → html` in the reconciled set:

1. Parse `html` with `DOMParser`.
2. Strip `loading="lazy"` from every `<img>` in the parsed HTML (avoids Safari re-render flicker).
3. Build `name → sourceElement` from `[data-ajax-cart-fragment^="<sectionId>/"]` in the parsed HTML. A duplicate `name` within one section → dev-mode warning, take the first.
4. For every on-page `[data-ajax-cart-fragment="<sectionId>/<name>"]` target, apply content per the rules below.

### Missing matches — clear vs. skip

The behaviour depends on *why* there is no match:

| Situation | Action | Why |
|---|---|---|
| Section rendered, but the `name` is **not** in it | **Clear** the target's children (+ dev-mode warning) | The section rendered fine and genuinely doesn't contain that fragment — a removed conditional fragment, or a typo'd name. Clearing keeps the invariant "target content === source content"; a typo visibly wiping content is a loud, debuggable failure rather than silent staleness. |
| The whole section is **missing/empty** in the response | **Skip** all of that section's targets (keep old children, + dev-mode warning) | We have no data for the section. Emptying the UI over a transient render glitch would be destructive. |

In short: a missing *fragment* (section present) clears; a missing *section* skips.

## The one pluggable seam

```ts
function applyContent(target: Element, source: Element): void
```

This is the **only** place the live DOM is mutated. v1 default:

```ts
function applyContent(target: Element, source: Element): void {
  target.replaceChildren(...[...source.childNodes].map((n) => document.importNode(n, true)));
}
```

`applyContent` is the seam a future **morph** strategy swaps into. It is *why* scroll and static-element preservation are deferred (see below): a morph implementation would preserve focus and scroll position by reconciling nodes in place, making both features unnecessary. Until a morph implementation is set, the default simply replaces children.

## Lifecycle integration

The module subscribes through core's existing surface (`src/core`):

- `on(EVENTS.REQUEST_START, …)` → inject the bundled `sections=` param into `ctx.body`.
- `on(EVENTS.REQUEST_END, …)` → reconcile and render (incl. the awaited `sectionApiGet`).

No new core API is required for v1. The `GET /?sections=` call is a direct `fetch` (or the equivalent on the passed `api`), not a queued core method, so it cannot deadlock the queue.

## Dev-mode warnings

- A target's `<sectionId>/<name>` is not present in that section's render (typo or removed fragment) — fires alongside the clear.
- A `<name>` appears more than once as a source within one rendered section.
- A section was requested but is missing/empty in the response.

## File layout

```
src/sections/
  sections.ts        ← detection, param injection, fetch orchestration, render
  apply-content.ts   ← the applyContent seam (default: replaceChildren)
  sections.spec.ts
  apply-content.spec.ts
  index.ts           ← side-effect init: registers the REQUEST_START / REQUEST_END listeners
```

`src/index.ts` gains a side-effect import of `./sections` alongside the existing `./product-form` import.

## Out of scope for v1 (deferred)

- **Scroll preservation** (`data-ajax-cart-fragment-scroll`) and **static-element preservation** (`data-ajax-cart-static-element`) — revisit once a morph `applyContent` strategy exists, which would obviate both.
- **Standalone "refresh sections" API** (architecture open-question F) — sections re-render only as a side effect of a cart mutation. The reconciliation path already contains the `GET /?sections=` logic a refresh would reuse, so adding it later is cheap.
- **A dedicated post-render event** — merchants use `REQUEST_END` / `QUEUE_END` for now.
- **`sections` on `get` / `cart.js`** — never injected.
- **Any state derivation** — separate module.

## Open questions deferred to other specs

- The morph `applyContent` strategy (its own design): node-reconciliation algorithm, focus/scroll preservation, and whether it replaces or supplements `replaceChildren`.
- Verifying architecture open-questions D and E against the live store (bundled `add.js` section freshness, Section Rendering API freshness immediately after a mutation). Assumed fresh here; verify before relying on it in production.
- How the future state module consumes section HTML (it may read from the same renders this module applies, but the contract is its own).
