# V3 CSS State — Design

> **Status: implemented.** `src/css-classes/`, 67 tests. Demo markup updated.

Adds library-owned CSS classes to merchant-chosen elements while the cart is busy, so a theme can style loading, updating and removal states in CSS alone.

## Module

```
src/css-classes/
  css-classes.ts        identity extraction + project()
  css-classes.spec.ts
  index.ts              side-effect init: subscribes the four handlers
```

Exports from `css-classes.ts`:

```ts
export function markInitialized(): void
export function identitiesOf(endpoint: Endpoint, body: RequestBody | null): Map<string, boolean>
export function project(root?: ParentNode): void
export function handleRequestStart(detail: RequestStartContext): void
export function handleRequestEnd(detail: RequestEndContext): void
export function handleQueueStart(): void
export function handleQueueIdle(): void
export function resetForTests(): void
```

`identitiesOf` returns identity → `removing`. Added to `src/index.ts` after the existing imports; position does not matter (see [Lifecycle](#lifecycle)).

## Markup contract

| Attribute | Placed on | Value |
|---|---|---|
| `data-ajax-cart-item-css` | Any element reflecting one cart line | Whitespace-separated list of the line's identifiers |

```liquid
<div class="line-item" data-ajax-cart-item-css="{{ forloop.index }} {{ item.key }} {{ item.variant_id }}">
```

Three token kinds are valid:

| Token | Shape | Matched by |
|---|---|---|
| line index | 1-based integer | `change` / `update` addressing by `line` |
| item key | contains `:` — always `variantId:hash` (`quantity-input.ts:18`) | `change` / `update` addressing by `id` |
| variant ID | bare integer | `add`, and `change` / `update` by `id` — both document `id` as *either* a line item key or a variant ID |

A value may hold all three, so matching is per-token, not whole-value.

**Line index and variant ID share a shape**, so the vocabulary is not disjoint the way `parseIdentity` (`quantity-input.ts:20`) requires. That is safe here because this module never classifies a token — it compares the identity string from the body against each token verbatim, and the endpoint already determines what the body's value means. A false match would need a line index numerically equal to a variant ID: indices run 1..cart length, variant IDs are 10+ digits.

**An empty value matches nothing** — the element is inert. `~=` gives this for free; it must not be worked around.

### Matching

```ts
function selectorFor(identities: Iterable<string>): string {
  return [...identities].map((id) => `[${ATTR}~="${CSS.escape(id)}"]`).join(",");
}
```

One selector covering every in-flight identity at once, rather than one query per identity. Empty string when there are none — `querySelectorAll("")` throws, so callers check first.

`CSS.escape` is required, not defensive: the identity comes from the request body, so `change({ id: 'weird"value' })` would otherwise close the quote and throw a `SyntaxError` out of the handler. Same escaping as `line-item-errors.ts:52`.

**One `~=` selector, always.** The variant ID must be written as its own token — do not derive it from the `variantId:hash` prefix of an item key. Token-prefix matching cannot be expressed with `~=`, and the `[attr^="id:"], [attr*=" id:"]` workaround is unsound: `~=` tokenizes on any ASCII whitespace, while `*=" id:"` matches only a literal space, so an attribute split across lines in Liquid would silently miss.

## Classes

| Class | Placed on | Set while |
|---|---|---|
| `js-ajax-cart-init` | `<html>` | always, from module load onward |
| `js-ajax-cart-busy` | `<html>` | the queue is processing |
| `js-ajax-cart-item-busy` | matching elements | a request concerns this line |
| `js-ajax-cart-item-removing` | matching elements | that request sets its quantity to 0 |

Invariant: `js-ajax-cart-item-removing` is never set without `js-ajax-cart-item-busy`.

`js-ajax-cart-init` is set once by `markInitialized()` at module load and never removed. It is **not** part of `project()` and reads nothing from `inFlight` — `<html>` sits outside every fragment, so there is nothing to re-assert.

It defines "initialized" as **this module loaded**, not the full bundle. Importing `css-classes` sets it regardless of which other modules are present.

The global classes go on `document.documentElement`, not `body`.

## Routing

No cart state is read. Identities come from the request body, as in `line-item-errors.ts:19`.

| Endpoint | Identities | `removing` when |
|---|---|---|
| `change` | `line` ?? `id` | `quantity == 0` |
| `update` | every key of `updates` | that entry is `0` |
| `clear` | every element on the page (flag-driven) | always |
| `add` | every variant ID in the body | never |
| `get` | none | — |

`line` is read before `id`: a body carrying both is malformed, and `line` is Shopify's documented default.

`add` has three body shapes, all of which must be handled:

- **`{items: [{id, quantity}, …]}`** — [Shopify's primary documented form](https://shopify.dev/docs/api/ajax/reference/cart), and the only one carrying several variants in one request.
- **`{id, quantity}`** — the flat JSON form. Not documented, accepted in practice.
- **`id=…` form-encoded** — what a product form posts. `product-form.ts:62` sends `FormData` built from the merchant's form, whose variant field is `<select name="id">` carrying `{{ variant.id }}` (`product-template.liquid:196`).

`items[0][id]` form-encoding is read too. It is not in the docs, but it is reachable exactly as the bare `id` is: `<ajax-cart-product-form>` posts the merchant's form verbatim, and multi-item bundle forms name their fields that way.

**`items` and a sibling `id` are both read.** A body carrying both is not malformed — Shopify adds every one of them, so there is no precedence to apply and neither may be dropped. Observed behaviour; the docs do not cover the case. Duplicates collapse, since identities are keyed in a Map.

**`quantity` is optional on every `add` shape** — Shopify adds 1 when it is omitted. It is never read here regardless, since an `add` can never be a removal; only the identity matters.

`update` yields a set, unlike `line-item-errors.ts:19` which returns one identity. Two body shapes, both of which must be handled:

- **Object** — `{"abc:123": 0, "def:456": 2}`. Identity is each key, which Shopify allows to be a line item key *or* a variant ID; `removing` is per entry.
- **Array** — `[1, 0, 2]`, or repeated `updates[]` from a serialized cart form (`cart-template.liquid:156`). Positional, so identity is `index + 1`. Shopify requires the array to be the same length as the cart, so position is only a valid identity for a whole-cart update.

Each shape arrives as `Record<string, unknown> | FormData | URLSearchParams`, the same union `sections.ts:77-83` handles. `update.js` keyed by variant ID resolves through this path too, since object keys are used verbatim.

A variant ID matches only elements carrying it as a token. Two consequences:

- **Fan-out.** A cart can hold several lines of one variant — different properties, or automatic discounts splitting them by price — so a variant-ID identity may mark more than one element busy while Shopify touches only one. `add` merges into a line it picks; `update` keyed by variant ID updates only *the first* match. Both are over-approximations the library cannot narrow without cart state, which it deliberately does not read.
- **A variant not in the cart matches nothing.** Only `js-ajax-cart-busy` is set. This covers an `add` of a new variant and an `update` keyed by an absent variant ID — which Shopify treats as an add rather than an error.

## State and projection

```ts
const inFlight = new Map<string, boolean>();   // identity -> removing
let queueBusy = false;
let clearingAll = false;
```

`clear` is carried by a flag rather than by identities in the map. Enumerating the page's tokens at `REQUEST_START` would read a DOM the render then changes, so the delete pass at `REQUEST_END` would recompute a different set and miss what it added. Keeping it out also leaves `identitiesOf` a pure function of the body.

```ts
export function project(root: ParentNode = document): void {
  document.documentElement.classList.toggle(BUSY_CLASS, queueBusy);

  const busySelector = clearingAll ? SELECTOR : selectorFor(inFlight.keys());
  const removingSelector = clearingAll
    ? SELECTOR
    : selectorFor([...inFlight].filter(([, removing]) => removing).map(([identity]) => identity));

  root.querySelectorAll(SELECTOR).forEach((element) => {
    element.classList.toggle(ITEM_BUSY_CLASS, busySelector !== "" && element.matches(busySelector));
    element.classList.toggle(
      ITEM_REMOVING_CLASS,
      removingSelector !== "" && element.matches(removingSelector),
    );
  });
}
```

**Token matching is delegated to `~=` through `Element.matches`, not tokenized in JS.** One `querySelectorAll` either way, but the browser's splitting *is* the definition: hand-rolling it means reimplementing ASCII whitespace exactly, and JS `\s` is not that — it treats NBSP as a separator where `~=` does not. Pinned by the NBSP and newline tests.

`removing` implies `busy` because every removing identity is also in `inFlight`, so the invariant holds without a separate assertion.

**Fully derived, never incremental.** Every call recomputes from `inFlight` and `queueBusy`, so it is idempotent and safe to run at any time. Required, not stylistic: `apply-content.ts:16` calls `replaceChildren` on the fragment target, so every element inside a fragment is destroyed on each reconciling request and the classes must be re-asserted onto the new nodes.

`classList.toggle(name, bool)` — the two-argument form. Never the one-argument flip.

**Re-query, never cache**, for the same reason. No element references may be held between events.

The module writes only classes. Never children, never other attributes.

**No tree traversal.** `project()` is `querySelectorAll` plus a per-element token match, so nested elements each carrying the attribute — a bundle parent and its component rows — need no special handling. Do not add nearest-ancestor logic.

## Lifecycle

```
REQUEST_START → merge identitiesOf(…) into inFlight    → project()
REQUEST_END   → delete those identities from inFlight  → project()
QUEUE_START   → queueBusy = true                       → project()
QUEUE_IDLE    → queueBusy = false; inFlight.clear()    → project()
```

All four subscribe with `document.addEventListener`, **not** core's internal `on()`. `emitter.ts` awaits every internal listener (`:49-57`) before dispatching the DOM event (`:65`), and `sections` subscribes internally with an awaited `reconcile()` (`sections.ts:165-167`) — so the DOM path is guaranteed to run only after the render has fully completed, including any `GET /?sections=` fetch. Precedent: `quantity-input.ts:328-330`.

This is a **correctness requirement, not only a convenience** — see [Removal ordering](#removal-ordering) — as well as what removes the import-order constraint `line-item-errors` carries.

`QUEUE_IDLE`, not `QUEUE_END`: `queue.ts:36` reads `#running`, cleared only after the queue-end hook, so the queue still reports busy throughout `QUEUE_END`. `core.ts:66` also dispatches `QUEUE_IDLE` directly to `document`, so no internal path exists for it. Same choice as `quantity-input.ts:324-326`.

**`inFlight.clear()` on idle is an invariant, not a precaution.** A drained queue means nothing is running, so any surviving entry is stale by definition. It also closes the only route to a permanently stuck class: `api.ts:234` calls `onEnd` outside a `finally`, so a throw between `onStart` (`:195`) and it would skip `REQUEST_END` altogether and leave a class `project()` never revisits. Unreachable today — every path between the two is caught, and `document.dispatchEvent` cannot throw — but not structurally guaranteed, and this makes it self-healing rather than permanent.

The invariant holds under the awaited-request contract only. `task(async (api) => { api.change(a); api.change(b) })` without `await` lets fetches outlive the task, so the queue can idle while requests are still running. The same misuse also lets two concurrent requests share an identity, where the first `REQUEST_END` clears the class while the second is still in flight. Both are what `core.ts`'s deadlock warning steers against; neither justifies refcounting `inFlight`.

No `console.warn` on an identity matching zero elements — partial or zero adoption is normal, and an `add` of a variant not in the cart matches nothing by design.

### Removal ordering

On a successful removal the class is never taken off a *visible* element, because the element is already gone by then:

```
REQUEST_START  (DOM)       removing added, animation starts
   …fetch…
REQUEST_END    (internal)  sections replaceChildren — the row is destroyed
REQUEST_END    (DOM)       project() — nothing left to unclass
```

Reversing those last two steps produces a visible flash: the row snaps back to full opacity and is only then replaced. That is the regression to guard against if this module is ever moved to `on()`, and the reason the DOM path is mandatory rather than preferred.

`removing` is still deleted rather than left in place, because three paths leave the element alive:

- **`status === null`** — network failure, timeout or cancellation. `reconcile` returns early and nothing renders, so the row survives and must be restored or it stays invisible permanently.
- **A 422 where the line still exists** — a quantity-rule rejection of a 0, for example.
- **An element outside any fragment** — never re-rendered, so deletion is the only thing that restores it. Such an element also keeps displaying a line that no longer exists, the same limitation `V3-LINE-ITEM-ERRORS.md:99` records for error slots outside fragments.

## Demo

The attribute is on the line-item row in both `demo/sections/my-cart.liquid` (`.ajax-cart__line-item`) and `demo/sections/cart-template.liquid` (`.cart__row`), and `demo/assets/liquid-ajax-cart.css` styles the two per-line classes.

Two stale v2 hooks were found in that stylesheet. `.js-ajax-cart-processing` (3 rules) was renamed to `.js-ajax-cart-busy`, its v3 equivalent. **`.js-ajax-cart-not-empty` and `.js-ajax-cart-empty` (`:222`, `:225`) are still dead** — v3 dropped both classes and there is no equivalent, so those rules need either a Liquid-side condition or a decision to reinstate the classes.

## Out of scope

- **Optimistic UI for an `add` of a variant not in the cart.** No element exists to class; belongs to the template-based optimistic UI (`V3-ARCHITECTURE.md:19`).
- **Removal animations longer than the request.** The row is destroyed by the re-render before any DOM listener runs. `waitUntil` does not fix this — it delays the queue advancing, not the render, and runs after it. Do not reach for it.
- **Queued-but-not-in-flight lines.** `queue.ts:1-5` holds opaque `fn`s with no identity; exposing them is a core change.
- **Class-name overrides.** Settings module, alongside the fallback text `line-item-errors.ts:9` anticipates.
- **`aria-busy`.** Merchant-written; a live region must exist at page load and fragments re-render on every mutation.
