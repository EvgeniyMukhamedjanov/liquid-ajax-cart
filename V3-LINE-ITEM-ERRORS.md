# V3 Line-Item Errors — Design

> **Status: draft.** Seven fixtures captured; error text rendered verbatim.

Renders the error Shopify returns for a failed `cart/change.js` request next to the cart line it concerns.

Scope is that endpoint only. `add.js` errors belong to `product-form/`; discount-form and discount-status are separate future modules (`V3-PRODUCT-FORM-ERRORS.md:9-14`). Fills the gap left by `V3-QUANTITY.md:9` — quantity forwards invalid quantities and renders no text.

## Markup contract

| Attribute | Placed on | Value |
|---|---|---|
| `data-ajax-cart-item-error` | Slot element | Whitespace-separated list of the line's identifiers |

```liquid
<div data-ajax-cart-item-error="{{ forloop.index }} {{ item.key }}"></div>
```

Identifier grammar is the one `parseIdentity` defines (`quantity-input.ts:22`): a line index `^[1-9][0-9]*$`, or an item key containing `:`. The two languages are disjoint, so a mixed list is unambiguous.

**Write both.** They fail under disjoint conditions, so holding both is strictly more robust than either:

| | Breaks when |
|---|---|
| `line` index | a line is added or removed |
| `item.key` | the line's properties or discount allocations change — *"The line item key is not persistent for the lifetime of a line item"* ([Cart API reference](https://shopify.dev/docs/api/ajax/reference/cart)) |

Reachable in practice: a partial-fulfilment 422 (fixture 1) changes the quantity; if that crosses a volume-discount threshold the key changes and only the index token still matches.

Either token alone is valid and matches only requests using that grammar. **An empty value matches nothing** — the slot is inert, which reserves `data-ajax-cart-item-error=""` for a catch-all later without invalidating today's markup.

### Matching

```ts
function slotsFor(identity: string, root: ParentNode = document): Element[] {
  return [...root.querySelectorAll(`[${ATTR}~="${CSS.escape(identity)}"]`)];
}
```

Uses the CSS `~=` (whitespace-separated token list) operator directly — its semantics already match the markup contract: empty and whitespace-bearing values never match (`~=` never matches an empty attribute or a value containing whitespace), and NBSP is not a separator. No hand-written filter needed.

**`CSS.escape()` is required, not defensive.** The identity is interpolated into the selector string and comes from the request body, so a merchant's `change({ id: 'weird"value' })` would otherwise close the quote and throw a `SyntaxError` out of the `REQUEST_END` handler. An earlier draft of this design avoided the selector entirely (JS `.split()` + array filter, "injection-proof by construction, no escaping helper needed") specifically to dodge that hazard — superseded once `CSS.escape()` was confirmed to close it cleanly, at less code than a hand-rolled filter. `~=` remains a valid way for *merchants* to target slots in their own CSS; the token-list markup is unchanged either way.

Rule: **senders carry one identifier, receivers accept a set.** `data-ajax-cart-quantity-input` stays single-valued because it must send one identity; the slot only receives.

## Routing

No cart state. The identity is read from the request body — same union `sections.ts:82-91` handles:

```ts
function identityOf(body: RequestBody | null): string | null {
  if (body instanceof FormData || body instanceof URLSearchParams) {
    const raw = body.get("line") ?? body.get("id");
    return raw == null ? null : String(raw);
  }
  if (body && typeof body === "object") {
    const raw = body.line ?? body.id;
    return raw == null ? null : String(raw);
  }
  return null;
}
```

`line` before `id`: a body carrying both is malformed, and `line` is Shopify's documented default. `trigger.initiator` is not consulted.

**Variant-id fan-out is not supported.** v2 resolved `id=808950810` to every line with that variant via `getCartState()` (`_src-old/messages.ts`). Unreachable from this library — `parseIdentity` accepts the `id` grammar only when the value contains `:` — so only a merchant's own `change({ id: 808950810 })` hits it, and it routes nowhere.

## Lifecycle and ordering

```
on(REQUEST_START) → clear the slots matching this identity
on(REQUEST_END)   → if endpoint === "change" && !result.ok, render into them
```

**Must register after the sections module.** A 422 re-renders the fragment (`sections.ts` reconciles whenever `status !== null`), so a slot written before that render is destroyed and the re-rendered slot comes back empty. `emitter.ts:59-66` runs listeners in subscription order, and subscription happens at import time:

```ts
import "./product-form";
import "./sections";
import "./line-item-errors";   // ← must follow ./sections
import "./quantity";
```

First case where import order in `src/index.ts` carries meaning — record it as a core-layer contract, since every future module writing to the DOM after a request inherits it. No import is added; only an ordering constraint on registration.

**Re-query, never cache.** A cart line is always inside `[data-ajax-cart-fragment]`, so its slot node is replaced on every reconciling request. `product-form.ts:70` can hold a reference guarded by `element.isConnected` because its wrapper sits outside fragments; the same guard here would skip 100% of the time.

## Clearing

On `REQUEST_START`, clear only the slots matching the identity being requested — errors on other lines stay (v2 parity). Redundant on most paths because of the re-render, required on two:

- **`status === null`** (network failure, timeout, or cancellation) — `sections.ts` renders nothing, so a previous error would persist.
- **Slots outside any fragment** — a toast or summary area the renderer never touches.

## Error text

1. string `body.description`
2. string `body.message`
3. fallback constant — `"We couldn't update your cart. Please try again."`

Both rungs read strings only; a non-string falls through. Rendered **verbatim**, no filtering.

**`description` outranks `message`.** Two response generations are in circulation with no version flag: the older sets `message` to the constant `"Cart Error"` with real text in `description`; the newer duplicates the same text into both. Preferring `message` would render "Cart Error" to shoppers on old-shape stores; preferring `description` costs nothing on either.

**No status-based classification.** Three fixtures carry developer text (5, 6, 7), but `body.status` cannot separate them — it is polymorphic (number and reason-phrase spellings of the same status) and both audiences appear under 422. Anything finer would mean pattern-matching English, which breaks on non-English stores. A merchant override map belongs in the settings module if this is ever wanted.

**`errors` is not read**, unlike `add.js`. No `change.js` failure has carried it. If one ever does, the chain falls through to `description`, which every observed shape carries. `product-form/` keeps `errors` because it is observed there and carries per-field routing.

Fallback text is a constant, duplicated from `product-form-errors.ts:5`; both become defaults reading one override when settings lands.

### Difference from v2

`_src-old/messages.ts:getRequestError()` reads `errors || description || message`, returns strings as-is, flattens objects, falls back to `settings.requestErrorText`. Order of `description` before `message` is kept. Differences:

| | v2 | v3 |
|---|---|---|
| `errors` | first in the chain | not read |
| Empty values | `\|\|` truthiness — an empty object `{}` is truthy, wins the chain, flattens to `""`, blanking the slot | explicit non-empty checks (`asStringSource`, `product-form-errors.ts:86-88`) |
| Object handling | flattened | dropped |

### The cart may have changed on a 422

Over-stock is not a clean rejection: Shopify sets the maximum available quantity **and** answers 422. Consequences:

- Sections re-renders (`status !== null`), so the line shows the corrected quantity. The error explains the gap; it is not reporting a no-op.
- Quantity's failure restore (`quantity-input.ts:139`) is a no-op — the control was detached by the render, and its `value` attribute is stale anyway.

## Fixtures

From the Ajax Cart API reference, the [March 4 2025 inventory-message changelog](https://shopify.dev/changelog/cart-ajax-api-inventory-error-message-updates) (which states these messages apply to `add.js`, `change.js`, and `update.js`), and live-store observation.

| # | Case | `status` | `message` | Audience | Source |
|---|---|---|---|---|---|
| 1 | Requested more than available, none yet in cart | `422` | = `description` | shopper | observed |
| 2 | All available inventory already in cart | `422` | = `description` | shopper | changelog |
| 3 | Cannot add more | `422` | `"Cart Error"` | shopper | documented |
| 4 | Variant sold out | `422` | `"Cart Error"` | shopper | documented |
| 5 | Non-integer quantity | `"bad_request"` | = `description` | developer | observed |
| 6 | Variant not found | `404` | `"Cart Error"` | developer | documented (`update.js`) |
| 7 | Malformed `line` | `"unprocessable_entity"` | = `description` | developer | observed |

```json
{"status":422,"message":"Only 3 items were added to your cart due to availability.","description":"Only 3 items were added to your cart due to availability."}
{"status":422,"message":"The maximum quantity of this item is already in your cart.","description":"The maximum quantity of this item is already in your cart."}
{"status":422,"message":"Cart Error","description":"You can't add more Health potion to the cart."}
{"status":422,"message":"Cart Error","description":"The product 'Health potion' is already sold out."}
{"status":"bad_request","message":"expected String to be a Integer: quantity","description":"expected String to be a Integer: quantity"}
{"status":404,"message":"Cart Error","description":"Cannot find variant"}
{"status":"unprocessable_entity","message":"line parameter is invalid.","description":"line parameter is invalid."}
```

Fixtures 3, 4 and 6 interpolate the product name. Fixture 6 is documented for `update.js`; `change.js` accepts the same `id` forms, so assume it applies.

### Never read `body.status`

Four forms across seven fixtures — `422`, `404`, `"bad_request"`, `"unprocessable_entity"` — with 1-4 and 7 being the same HTTP status in two spellings. Use `result.ok` and `result.status`, which `api.ts` takes from the response object.

### Still to capture

Documentation value only; none gate the module.

- **Quantity-rule violations** — B2B `quantity_rule` `{min, max, increment}`. Next-most-likely error a shopper hits.
- **`line` out of range** — fixture 7 covers a malformed `line`; a well-formed out-of-range one may differ.
- **Endpoint attribution for fixture 1** — its wording reads as `add.js` phrasing; the `change.js` string is unconfirmed.

## Render shape

```ts
slot.textContent = text;   // render
slot.textContent = "";     // clear
```

No helper, no element construction.

**Not `product-form-errors.ts:63-72`.** That module wraps each message in a `<span>` and separates them with `<br>` because `add.js` returns `errors` as an object of arrays (`{email: ["can't be blank", "is invalid"]}`) — genuinely several messages per slot. This chain yields one string or none: `description` and `message` are strings in every fixture, and a non-string falls through. The multi-message path would be unreachable, and the `<span>` would be a styling hook for a case that cannot occur — merchants style `[data-ajax-cart-item-error]` directly.

The choice is also the reversible one. Adding wrapper elements later does not break `[data-ajax-cart-item-error]` selectors; removing them after merchants have written `> span` rules would. If an object-shaped `description` ever appears, the renderer grows then.

`textContent` also makes "never `innerHTML` with an API-sourced string" structural rather than a convention, and makes render and clear the same operation — `product-form-errors.ts` clears with `textContent = ""` but renders with `replaceChildren()`.

## Accessibility

The merchant writes every static attribute — `aria-live`, `aria-atomic`, `id`, `aria-describedby`. The library writes none: a live region must exist at page load to be announced reliably, and fragments re-render on every mutation, so library-added attributes would need re-applying each time.

**`aria-invalid` is deferred.** The input that would carry it is the quantity input, and reaching for it means importing quantity's attribute name across a module boundary. `aria-live` on the slot carries the announcement. Resolves `V3-PRODUCT-FORM-ERRORS.md:456` by deferral.

## Liquid

```liquid
<div data-ajax-cart-fragment="cart/lines">
  {% for item in cart.items %}
    <div class="cart-line">
      <ajax-cart-quantity>
        <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | minus: 1 }}"
           data-ajax-cart-quantity-minus>−</a>
        <input type="number"
               data-ajax-cart-quantity-input="{{ forloop.index }}"
               value="{{ item.quantity }}" min="0" step="1" autocomplete="off"
               aria-describedby="ajax-cart-err-{{ item.key }}">
        <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | plus: 1 }}"
           data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>

      <div data-ajax-cart-item-error="{{ forloop.index }} {{ item.key }}"
           id="ajax-cart-err-{{ item.key }}"
           aria-live="polite"
           aria-atomic="true"></div>
    </div>
  {% endfor %}
</div>
```

The slot must sit inside the fragment so it is regenerated on every render. Minimum markup is the slot alone. `demo/sections/my-cart.liquid:123` carries `data-ajax-cart-item-error="{{ forloop.index }} {{ item.key }}"` — both identifiers, per the "write both" rule above.

## Dev warnings

One `console.warn`, no dedup (bounded by failed requests): a `change.js` failure whose identity matched **zero** slots while at least one `[data-ajax-cart-item-error]` exists on the page. Name the identity sent. Diagnoses a slot keyed `{{ item.key }}` while the control sends `line`, or vice versa. Silent when no slots exist.

## Out of scope

- **Catch-all slot** — unmatched errors are dropped and warned; `data-ajax-cart-item-error=""` reserved for it.
- **`update.js`** — multi-line, no per-line attribution.
- **`add.js`** — owned by `product-form/`.
- **Object-keyed field routing** — no observed shape is object-keyed.
- **`aria-invalid`**, **variant-id fan-out**, **settings-driven fallback override**.

## Cancellation (resolved in core)

`RequestResult` carries `cancelled: boolean`. The module returns without rendering when it is set — nobody needs to be told about a request they themselves called off.

Without it a cancellation is indistinguishable from a network failure: both produce `{ok: false, status: null, body: null}`. That was a regression against v2, which had two mechanisms and used one of them:

| v2 | What it was | Did v2 skip rendering? |
|---|---|---|
| `info.cancel` | flag set by user code on `request-start` to cancel before fetch | **yes** — `_src-old/messages.ts:113` |
| `AbortSignal` | stored as `requestState.fetchError = AbortError` (`ajax-api.ts:155,251`) | no — `getRequestError()` never reads `fetchError` |

v3 replaced `info.cancel` with `ctx.abort()` on `RequestStartContext`, and that collapsed into the same result as a network error, so a listener cancelling a request would have produced an error message v2 suppressed. `cancelled` restores parity, covers `AbortSignal` (which v2 got wrong), and fixes `product-form/`, which previously rendered the fallback on a cancelled add.

**A timeout is not a cancellation.** `AbortSignal.timeout()` aborts the signal too, but a request that ran out of time is a real failure the shopper should see — so `isCancellation()` (`api.ts`) excludes a `TimeoutError` reason and timeouts fall in with network failures. Reading `signal.aborted` alone would silently swallow them.

**Why one boolean and not an outcome enum.** An enum (`"response" | "cancelled" | "timeout" | "network-error"`) was considered and rejected: consumers branch on one bit — suppress or report — because timeouts and network failures get identical treatment. Naming them apart would expose a distinction nothing acts on. Adding an enum later is additive if that changes.

## Open questions

- Does any `change.js` failure carry `errors`, or a non-string `description`? Nothing observed does; the chain is trimmed on that basis.
- Is there a third message generation? Two are in circulation with no version flag.
- Should quantity keep forwarding fractional quantities, now that fixture 5 shows the answer is a type error? `V3-QUANTITY.md:128` decided yes assuming the response was readable — belongs to that doc.
- Does a `change.js` 422 bundle section HTML, or does `sections.ts` always fall back to `GET /?sections=`? Affects nothing here; worth recording alongside architecture open questions D and E.
