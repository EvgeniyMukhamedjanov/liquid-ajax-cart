# V3 Product-Form Errors — Design

Adds error rendering to the existing `<ajax-cart-product-form>` element. Scope is limited to errors produced by `cart/add.js` requests this element fires. Line-item errors, discount-form errors, and discount-status messages are separate modules and out of scope here.

## Why this lives in `product-form/` and not a standalone `messages/` module

Each Shopify-side error surface has its own response shape, its own routing key, and its own lifecycle:

| Surface | Trigger | Routing key | Lives in |
|---|---|---|---|
| Form errors | `!result.ok` on `cart/add.js` | Shopify response `errors` key | `product-form/` |
| Line-item errors | `!result.ok` on `cart/change.js` | item key parsed from request body | `line-item-errors/` (future) |
| Discount-form errors | `!result.ok` on discount submission | input `name=` | `discount-form/` (future) |
| Discount-status messages | `result.ok` on `cart/update.js` with `discount_codes[].applicable === false` | discount code value | `discount-status/` (future) |

The only shared logic is "set `textContent` on a DOM element" and "subscribe to a lifecycle event." That's not enough mass to justify a shared module, and a single "messages" module would either need to know about every Shopify response shape or import from every feature module (violates v3's "modules never import from each other" rule).

Co-locating each surface with its owning module keeps each module small, single-purpose, and independently importable.

## Markup contract

Slots and inputs are normally placed by the merchant **inside** the `<ajax-cart-product-form>` subtree, but may also live **outside** it and associate by the form's `id` (see [Element association](#element-association)).

| Attribute | Placed on | Role | Multiplicity |
|---|---|---|---|
| `data-ajax-cart-product-form-error` | Slot element | Catch-all slot | Zero or more per form |
| `data-ajax-cart-product-form-error="<error key>"` | Slot element | Field-keyed slot; value matches a key in Shopify's response `errors` object | Zero or more per form |
| `data-ajax-cart-product-form-input="<error key>"` | Input element | Marks the input as the target of `aria-invalid` wiring when an error with this key arrives. Decoupled from the slot — input wiring and slot rendering are independent | Zero or more per input |
| `data-ajax-cart-product-form-error-for="<form id>"` | Slot element | Associates an **out-of-tree** slot (one living outside the wrapper) with the form by its `id`. On an in-tree slot, re-points it to a *different* form (or away from this one). | Zero or more per slot |

Out-of-tree **inputs** associate via the native HTML `form="<form id>"` attribute — no custom attribute is needed, since the browser already exposes form-membership intent through `form=`.

The catch-all receives: string `body.errors`, `body.description`, `body.message`, network/transport failures, and any object-keyed errors that don't match a field-keyed slot. Multiple catch-all slots inside the same form all receive the same text (intentional — a merchant may want both inline and toast-style placements).

The slot and input attributes both use the **Shopify response key** as their value. They are deliberately parallel: a merchant who wants both error text AND input highlighting writes the same key in both places. A merchant who only wants one of the two writes only that attribute.

### Element association

A slot or input "belongs to" a form by one of two rules, evaluated per element:

1. **Out-of-tree, by `id`.** A slot with `data-ajax-cart-product-form-error-for="<id>"` or an input with native `form="<id>"` belongs to the form whose `id` matches `<id>`, wherever it sits in the document. This lets merchants place toast-style catch-alls or field slots outside the `<ajax-cart-product-form>` wrapper (e.g., in a sticky header or a cart drawer).
2. **In-tree, by containment.** A slot/input inside the wrapper that does **not** carry an explicit out-of-tree pointer belongs to the form it is nested within.

**Partition rule (no double-claim).** An in-tree element that explicitly points elsewhere — `data-…-error-for="<other id>"` on a slot, or `form="<other id>"` on an input — is **not** claimed by containment. It belongs only to the form it names, mirroring how native `form=` reassigns an input out of its containing form. An element pointing at its *own* form's id is filled exactly once (containment and the id pointer resolve to the same form; discovery dedupes, and `replaceChildren` makes a repeat write idempotent anyway).

**Empty / missing form id.** If the form has no `id`, out-of-tree pointers are inert: the library must never let `data-…-error-for=""` or `form=""` match the empty-valued attribute. Guard by skipping the id-based query entirely when the form id is absent or empty.

**Discovery keys off attributes, never `form.elements`.** Both `renderErrors` and `clearErrors` find their targets by attribute query (containment query for in-tree, `[…-for="<id>"]` / `[form="<id>"]` for out-of-tree) — *not* by reading the live `form.elements` collection. `form.elements` is live membership and can drift between the submit that set `aria-invalid` and the next submit's `clearErrors`: an input that left the collection in between would never be cleared, leaking `aria-invalid` onto an element the cleanup can no longer reach. Attribute-keyed discovery guarantees render and clear always operate on the identical set, so there is nothing to leak.

### Shopify response keys — merchant docs reference

Shopify normalizes line-item property names in the `cart/add.js` response `errors` object. The keys do **not** match the input's `name=` — the `properties[…]` wrapping and the human-readable label are stripped. Merchants who want field-keyed routing write the response key in both `data-ajax-cart-product-form-error` and `data-ajax-cart-product-form-input`.

Currently documented keys (gift-card recipient form):

| Input `name=` | Shopify response `errors` key | Slot/input attribute value |
|---|---|---|
| `properties[Recipient email]` | `email` | `email` |
| `properties[Recipient name]` | `name` | `name` |
| `properties[Message]` | `message` | `message` |
| `properties[Send on]` | `send_on` | `send_on` |

Source-of-truth verified by tracing `Shopify/horizon`'s `gift-card-recipient-form.js` field map back through `product-form.js`, which passes `response.errors` unmodified into its event.

**The library has zero hardcoded knowledge of these keys.** When `cart/add.js` returns `errors: { email: [...] }`, the library looks for `[data-ajax-cart-product-form-error="email"]` slots and `[data-ajax-cart-product-form-input="email"]` inputs and routes accordingly. If Shopify adds new validated property families in the future, merchants can adopt them immediately — the library needs no update for routing to work. Only the docs reference table above gets a new row.

Most other `cart/add.js` failures (out-of-stock, selling-plan conflicts, generic cart errors) return a string in `description` or `message` and route to the catch-all slot. Field-keyed slots primarily matter for gift cards today.

### Accessibility — merchant writes all static attributes

The library does not auto-augment slots with `role` / `aria-live` / `aria-atomic` / `id` / `aria-describedby`. Merchants write them in Liquid. Reasons:

1. Live regions must exist in the DOM at page load to be announced reliably (per current screen-reader behavior). Static attributes belong in static markup.
2. Cart sections re-render from server HTML on every cart change. Library-augmented attributes would have to be re-applied after each re-render; merchant-written attributes are fresh from Liquid every time.
3. Merchants who want to override defaults (e.g., `aria-live="assertive"` on a field slot) don't fight library logic.

**Exception — `aria-invalid` is library-owned.** It is the one a11y attribute the library writes, because it is *transient error state*, not static markup: it has no meaningful page-load value (a never-submitted form has nothing invalid) and must flip with every request result. The merchant opts in by marking an input with `data-ajax-cart-product-form-input="<key>"`; from then on the library sets `aria-invalid="true"` on a matching error and removes it on the next `clearErrors`. **Merchants must not write `aria-invalid` in Liquid on marked inputs** — any value there is treated as library-managed and will be cleared on the next submit. (Removing the attribute is equivalent to `aria-invalid="false"` for assistive tech, so nothing is lost.)

Recommended Liquid pattern (full WCAG — input highlighting works at every level below this too):

```liquid
<ajax-cart-product-form>
  <form action="{{ routes.root_url }}cart/add" method="post">
    <input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}">

    <label>
      Recipient email
      <input type="email"
             name="properties[Recipient email]"
             data-ajax-cart-product-form-input="email"
             aria-describedby="ajax-cart-err-email">
    </label>
    <div data-ajax-cart-product-form-error="email"
         id="ajax-cart-err-email"
         aria-live="polite"
         aria-atomic="true"></div>

    <label>
      Recipient name
      <input type="text"
             name="properties[Recipient name]"
             data-ajax-cart-product-form-input="name"
             aria-describedby="ajax-cart-err-name">
    </label>
    <div data-ajax-cart-product-form-error="name"
         id="ajax-cart-err-name"
         aria-live="polite"
         aria-atomic="true"></div>

    <button type="submit">Send gift</button>

    <div data-ajax-cart-product-form-error
         role="alert"
         aria-atomic="true"></div>
  </form>
</ajax-cart-product-form>
```

**Minimum markup for input highlighting + error text only** (no live-region a11y, no `id` / `aria-describedby` coordination):

```liquid
<input type="email"
       name="properties[Recipient email]"
       data-ajax-cart-product-form-input="email">
<div data-ajax-cart-product-form-error="email"></div>
```

That alone gets the merchant: error text in the slot, `aria-invalid="true"` on the input for `[aria-invalid="true"]` CSS targeting. Adding `aria-live` / `aria-atomic` on the slot upgrades to live-region announcement; adding `id` / `aria-describedby` upgrades to full screen-reader description-on-focus. Each layer is an independent merchant choice.

**Even more minimal — slot or input alone is valid:**

```liquid
<!-- Just the error text, no input highlighting -->
<div data-ajax-cart-product-form-error="email"></div>

<!-- Just the input highlighting, no inline error text (catch-all elsewhere shows the message) -->
<input name="properties[Recipient email]" data-ajax-cart-product-form-input="email">
```

The two attributes are independent. The library matches them only by their shared response-key value, never by DOM proximity.

### `aria-errormessage` vs `aria-describedby`

`aria-describedby` is the recommended wiring for slot↔input association. `aria-errormessage` (ARIA 1.2) has no support in NVDA or VoiceOver as of 2026; W3C has an open issue (#2048) considering its deprecation. Documentation and examples will only show `aria-describedby`.

## Runtime behavior

The module hooks into the existing submission lifecycle in `product-form.ts`:

```
submit
  └─ clearErrors(element)       ← before add()
  └─ add(formData, {meta})
       └─ then((result) => !result.ok && renderErrors(element, result))
       └─ finally(() => element.removeAttribute('processing'))
```

No global event subscription. Each form handles only its own request, eliminating any chance of cross-form pollution.

### `clearErrors(element)`

Resolve the form's associated slots and inputs (in-tree by containment plus out-of-tree by form `id`, applying the [partition rule](#element-association)).

For each associated `[data-ajax-cart-product-form-error]` slot:
- Set `textContent = ""`.

For each associated `[data-ajax-cart-product-form-input]` input:
- Remove `aria-invalid`.

The library fully owns `aria-invalid` on marked inputs (see the a11y section), so there is no per-element tracking to consult — every marked input is simply reset. Removing the attribute is semantically identical to `aria-invalid="false"` for assistive tech. Because discovery is attribute-keyed (never `form.elements`), the exact set cleared here matches the set `renderErrors` wrote to — no marked input can drift out of reach between calls.

### `renderErrors(element, result)`

1. Re-query the form's associated `[data-ajax-cart-product-form-error]` slots — in-tree by containment plus out-of-tree by form `id`, applying the [partition rule](#element-association). (Re-query, don't cache — handles section re-renders cleanly.)
2. Split into `keyed: Map<string, Element[]>` and `catchAll: Element[]`.
3. Determine the source of errors. Shopify's response shapes vary; the library walks a precedence chain:
   - **Object errors:** if `result.body.errors` is a non-null object (not array), per-key routing applies.
   - **Object description:** else if `result.body.description` is a non-null object, per-key routing applies. (Gift-card responses currently duplicate the same object into both `errors` and `description`; preferring `errors` and falling through to `description` covers both shapes without double-rendering.)
   - **String errors:** else if `result.body.errors` is a non-empty string, catch-all only.
   - **String description:** else if `result.body.description` is a non-empty string, catch-all only.
   - **String message:** else if `result.body.message` is a non-empty string, catch-all only. Note: Shopify's gift-card `message` field has an awkward field-name duplication (e.g., `"Validation failed: Email Email can't be blank"`); using it last keeps it as a true last-resort over the cleaner `errors` / `description` content.
   - **No info:** hardcoded English default (`"We couldn't update your cart. Please try again."`). Catch-all only.
4. For object errors:
   - For each `(key, messages: string[])`:
     - **Slot rendering:** if `keyed.has(key)`, write `messages` into all matching slots via the shared `renderMessages` helper (see Render shape); otherwise push every entry of `messages` onto an `unmatched: string[]` accumulator. Keys themselves are not rendered — only the message texts.
     - **Input wiring (via response-key attribute):** find the form's associated inputs matching `[data-ajax-cart-product-form-input="<key>"]` — in-tree by containment plus out-of-tree by native `form="<id>"`, applying the [partition rule](#element-association); escape the value with `CSS.escape`. For each match, set `aria-invalid="true"`. Runs independently of slot presence — merchants who only want input highlighting (no inline slot) get it by marking the input alone, and vice versa.
   - Catch-all (if any slots present and `unmatched.length > 0`): write `unmatched` into every catch-all slot via the same `renderMessages` helper, so multiple messages are `<br>`-separated for consistency with field-keyed slots.
5. For string / no-info: write the single message into every catch-all slot via the same `renderMessages` helper (as `renderMessages(slot, [message])`) — **not** by setting `textContent` directly. All rendering, object-form and string-form alike, goes through the one helper so every message ends up wrapped in a `<span>`. This keeps the per-message styling hook and DOM shape identical regardless of error source.

### Render shape

All rendering goes through a single helper. Each message is wrapped in its own `<span>`; multiple messages are separated by `<br>` elements. Never use `innerHTML` with API-sourced strings.

```ts
function renderMessages(slot: Element, messages: string[]): void {
  slot.replaceChildren();
  messages.forEach((msg, i) => {
    if (i > 0) slot.appendChild(document.createElement("br"));
    const span = document.createElement("span");
    span.textContent = msg;
    slot.appendChild(span);
  });
}
```

DOM output:
- 1 message: `<div data-…-error="email"><span>can't be blank</span></div>`
- 2 messages: `<div data-…-error="email"><span>can't be blank</span><br><span>is invalid</span></div>`

**Why spans + `<br>` instead of bare text + `<br>`:**

Spans give merchants a per-message styling hook that bare text nodes can't. CSS selectors like `[data-ajax-cart-product-form-error] > span` work consistently regardless of message count. This costs one extra DOM node per message — negligible.

**Why `<br>` instead of CSS-driven block layout:**

`<br>` provides a readable default with zero CSS. A span-only design would render messages inline (`can't be blankis invalid`) until the merchant added `display: block` themselves — a poor failure mode for merchants who copy the minimum markup without reading layout docs.

**Why not `<ul><li>`:**

Error messages display inline, not as bulleted lists. `<br>` avoids forcing merchants to reset `list-style` / `padding` / `margin` and matches modern form-error patterns (Stripe Elements, Material Web). With the recommended `aria-atomic="true"` on slots, screen-reader announcements are equivalent either way.

### Customizing the rendering shape

Merchants who want alternative layouts hide the `<br>` and style spans:

```css
/* Comma-separated inline */
[data-ajax-cart-product-form-error] br { display: none; }
[data-ajax-cart-product-form-error] > span + span::before {
  content: ", ";
}

/* Block stack with custom spacing */
[data-ajax-cart-product-form-error] br { display: none; }
[data-ajax-cart-product-form-error] > span {
  display: block;
  margin-block-end: 4px;
}

/* Pill chips */
[data-ajax-cart-product-form-error] br { display: none; }
[data-ajax-cart-product-form-error] > span {
  display: inline-block;
  padding: 2px 8px;
  background: var(--error-bg);
  border-radius: 999px;
  margin-inline-end: 4px;
}
```

`<br>` accepts `display: none` cleanly in all evergreen browsers. No library-shipped CSS is required — defaults render acceptably; custom layouts are purely additive.

### Disconnected element

If `element.isConnected === false` when the response arrives (e.g., a section re-render replaced the wrapper), `renderErrors` returns without touching anything. The replacement element on the page is responsible for its own future errors. The original element's `processing` attribute is still cleared (existing behavior preserved).

## File layout

```
src/product-form/
  product-form.ts             ← submission + processing; ~5 new lines calling into errors
  product-form-errors.ts      ← new: clearErrors, renderErrors, response parsing, a11y wiring
  product-form-errors.spec.ts ← new
  product-form.spec.ts        ← unchanged (existing tests stay green)
  index.ts                    ← unchanged
```

`product-form-errors.ts` exports two functions and holds one internal constant:

```ts
export function clearErrors(element: HTMLElement): void
export function renderErrors(element: HTMLElement, result: RequestResult): void

const FALLBACK_TEXT = "We couldn't update your cart. Please try again.";
```

No hardcoded Shopify-key → input-name map. The library routes purely by attribute value matching the response key. The set of known Shopify response keys lives in merchant-facing documentation, not in the library code — when Shopify ships new validated property fields, merchants can adopt them immediately without waiting for a library release.

No `aria-invalid` tracking state is needed: the library owns `aria-invalid` on every `[data-ajax-cart-product-form-input]` element, so `clearErrors` just resets all marked inputs and `renderErrors` sets the matching ones. There is nothing to remember between calls.

## Hardcoded fallback

The fallback text is a constant in `product-form-errors.ts`. When a settings source is designed later, the constant becomes a default and the module reads the override.

## Known Shopify response shapes (test fixtures)

Real `cart/add.js` 422 responses captured from the live gift-card recipient flow. The implementation's `renderErrors` must handle each of these correctly. These should ship as JSON fixtures alongside `product-form-errors.spec.ts`.

### Observed shape conventions

- `status` is **not reliable** and the library never reads it. In gift-card validation it is the numeric HTTP status (`422`), but other failures put a non-numeric string there (`"bad_request"` in `variant-not-sent` below). Routing is driven entirely by `result.ok` from the HTTP layer plus the `errors`/`description`/`message` body fields — `body.status` is ignored.
- `errors` and `description` both contain the **same object** in gift-card validation — duplicated per-field. Precedence: read `errors` first, ignore `description` to avoid double-rendering.
- `message` is a single string with `"Validation failed: <FieldName> <error text>"` formatting that awkwardly duplicates the field name. When multiple fields fail, the per-field clauses are comma-joined into one string (see `all-fields-invalid` below). Catch-all only; never used when object-form `errors`/`description` is present.
- A single response can carry **multiple field keys** at once (see `all-fields-invalid` below). Each key routes independently to its matching slot/input; unmatched keys accumulate into the catch-all. Each key's value is always `string[]`, so the helper must handle multi-message rendering even though observed data shows one message per key.
- The object can contain a field key literally named `message` (the gift-card "Message" property). This is an object-form **field error**, completely distinct from the top-level `message` **string**. The precedence chain reads the whole `errors` / `description` object as object-form before it ever considers the top-level string `message`, so the collision is harmless — but tests must lock it in.

### Fixtures

```json
// missing-email.json — Persona forgot Recipient email
{
  "status": 422,
  "description": { "email": ["Email can't be blank"] },
  "errors":      { "email": ["Email can't be blank"] },
  "message": "Validation failed: Email Email can't be blank"
}
```

```json
// invalid-email.json — Persona typed bad email format
{
  "status": 422,
  "description": { "email": ["Email is invalid"] },
  "errors":      { "email": ["Email is invalid"] },
  "message": "Validation failed: Email Email is invalid"
}
```

```json
// invalid-send-on.json — Persona chose an invalid date
{
  "status": 422,
  "description": { "send_on": ["Send on must be a valid date"] },
  "errors":      { "send_on": ["Send on must be a valid date"] },
  "message": "Validation failed: Send on Send on must be a valid date"
}
```

```json
// name-too-long.json — Persona's Recipient name exceeded 255 chars
{
  "status": 422,
  "description": { "name": ["Name is too long (maximum is 255 characters)"] },
  "errors":      { "name": ["Name is too long (maximum is 255 characters)"] },
  "message": "Validation failed: Name Name is too long (maximum is 255 characters)"
}
```

```json
// message-too-long.json — Persona's Message exceeded 200 chars
{
  "status": 422,
  "description": { "message": ["Message is too long (maximum is 200 characters)"] },
  "errors":      { "message": ["Message is too long (maximum is 200 characters)"] },
  "message": "Validation failed: Message Message is too long (maximum is 200 characters)"
}
```

```json
// all-fields-invalid.json — Persona got every gift-card field wrong at once.
// Demonstrates (a) multiple field keys in one response, (b) the object-form
// "message" field key colliding namewise with the top-level "message" string.
{
  "status": 422,
  "description": {
    "send_on": ["Send on must be a valid date"],
    "name":    ["Name is too long (maximum is 255 characters)"],
    "message": ["Message is too long (maximum is 200 characters)"],
    "email":   ["Email can't be blank"]
  },
  "errors": {
    "send_on": ["Send on must be a valid date"],
    "name":    ["Name is too long (maximum is 255 characters)"],
    "message": ["Message is too long (maximum is 200 characters)"],
    "email":   ["Email can't be blank"]
  },
  "message": "Validation failed: Send on Send on must be a valid date, Name Name is too long (maximum is 255 characters), Message Message is too long (maximum is 200 characters), Email Email can't be blank"
}
```

### Non-gift-card 422 fixtures (string `description`, no `errors` field)

Captured from live `cart/add.js` failures unrelated to gift cards. These always route to the catch-all slot.

```json
// max-in-cart.json — adding more than available inventory
{
  "status": 422,
  "message": "The maximum quantity of this item is already in your cart.",
  "description": "The maximum quantity of this item is already in your cart."
}
```

```json
// variant-not-found.json — invalid variant id submitted
{
  "status": 422,
  "message": "Cart Error",
  "description": "Cannot find variant"
}
```

```json
// variant-sold-out.json — variant inventory hit zero
{
  "status": 422,
  "message": "The product 'Limited Product - L / Blue' is already sold out.",
  "description": "The product 'Limited Product - L / Blue' is already sold out."
}
```

```json
// variant-not-sent.json — id/items parameter missing or malformed (e.g. empty submit)
{
  "status": "bad_request",
  "message": "Parameter Missing or Invalid",
  "description": "Required parameter missing or invalid: items"
}
```

**Key observation from `variant-not-found`:** `message` and `description` differ. `description` carries the informative text (`"Cannot find variant"`); `message` is the generic `"Cart Error"`. The precedence chain (string `description` before string `message`) ensures the merchant sees the informative one. This is a meaningful test assertion — proves the precedence chain isn't just an arbitrary order.

**Key observation from `variant-not-sent`:** a second instance of the same precedence (`description` = `"Required parameter missing or invalid: items"` beats the generic `message` = `"Parameter Missing or Invalid"`), and the first fixture where `status` is a non-numeric string (`"bad_request"`). It locks in that the library routes purely on `result.ok` + body text fields and never inspects `body.status`.

### Required test cases derived from these fixtures

**Gift-card object-form fixtures (`missing-email` etc.):**

1. **Field-keyed slot receives the message** — for each fixture, a slot with the matching key gets the message; `name="properties[…]"` input with matching `data-ajax-cart-product-form-input` gets `aria-invalid="true"`.
2. **Catch-all receives unmatched** — same fixtures with no field-keyed slot present route the message into a catch-all slot. Key itself is not rendered, only the message text.
3. **`description` ignored when `errors` is present** — both fixture fields contain identical content; the slot should receive the message exactly once, not twice.
4. **No double-render across slot duplicates** — two catch-all slots inside the same form both receive the same message exactly once each.
5. **Input wiring runs even without a slot** — `data-ajax-cart-product-form-input="email"` alone (no matching error slot) still receives `aria-invalid="true"`.
6. **Slot rendering runs even without a marked input** — `data-ajax-cart-product-form-error="email"` alone (no matching `data-…-input`) still receives the message; no `aria-invalid` wiring fires.
7. **`clearErrors` reverses both** — removes `aria-invalid` from previously-marked inputs only; clears textContent from all error slots.
14. **Multiple field keys route independently** — `all-fields-invalid` fixture with slots/inputs for all four keys (`send_on`, `name`, `message`, `email`): each slot receives only its own message and each marked input gets `aria-invalid="true"`; no key's text leaks into another's slot.
15. **Mixed matched/unmatched keys** — `all-fields-invalid` with slots present for only `email` and `name`: those two get their messages; the `send_on` and `message` texts accumulate into the catch-all (key names are not rendered, only the message texts), `<br>`-separated.
16. **Object-form `message` key ≠ top-level `message` string** — `all-fields-invalid` with a `data-ajax-cart-product-form-error="message"` slot receives `"Message is too long (maximum is 200 characters)"` (the field error), NOT the top-level `"Validation failed: …"` string. Proves the precedence chain treats the object as object-form before considering the top-level string.

**Non-gift-card string-form fixtures (`max-in-cart`, `variant-not-found`, `variant-sold-out`):**

8. **Catch-all receives the description** — slot gets `textContent` set to `description` value. No `aria-invalid` wiring fires (no per-field key to match).
9. **Precedence: `description` wins over `message`** — `variant-not-found` fixture, where they differ, must produce `"Cannot find variant"` in the catch-all, not `"Cart Error"`.
10. **No field-keyed slot fires for string-form errors** — even if the form has `data-ajax-cart-product-form-error="email"` slots, a string-form error doesn't put text into them; catch-all only.

**Synthetic shape cases (not from captured fixtures, derived from the precedence chain):**

11. **Bare `{ errors: "Cart Error" }`** — observed in community reports — string `errors`, catch-all only. Proves precedence chain handles this position too.
12. **Network failure / fetch reject** — core `api.ts` resolves with `{ ok: false, status: null, body: null }` — fallback English text into catch-all.
13. **`!result.ok` with empty body** — `{ ok: false, status: 500, body: {} }` — fallback English text into catch-all.

## Out of scope

- Line-item errors (separate module, future)
- Discount-form / discount-status (separate modules, future)
- Settings module / global fallback override (future)
- Dev-mode a11y warnings (deferred optional polish)
- `meta.errorTarget` escape hatch (dropped; no real use case)
- `aria-errormessage` wiring (poor screen-reader support)
- Automatic focus management on submit failure (could be useful, but out of scope for v1)
- Optimistic clearing on successful response (sections module re-renders the markup; nothing to clear)

## Open questions deferred to other specs

- Where the global fallback text setting ultimately lives (separate "settings" or "core configuration" spec)
- Whether the line-item-errors module reuses the same `aria-invalid` wiring helper (decide when designing that module)
- Where the merchant-facing reference table of known Shopify response keys lives (README, guide, or both). The library code never carries this knowledge — only docs do. As Shopify ships new validated property families (installments, subscriptions with structured inputs, future gift-card extensions), the docs grow; the library doesn't change.
