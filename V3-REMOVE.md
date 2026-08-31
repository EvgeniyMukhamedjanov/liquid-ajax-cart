# V3 Remove — Spec

> **Status: implemented.** `src/remove/`, `src/core/identity.ts`. 23 tests (`remove.spec.ts` 19, `index.spec.ts` 4) plus 7 in `core/identity.spec.ts`, shared with `quantity-input.ts`.

Click control. Sends `cart/change.js`, `quantity=0`, for one line (`line` index or `id` key). Standalone control, not tied to `<ajax-cart-quantity>`.

Complements, doesn't replace:
- `data-ajax-cart-quantity-input` typed `0` (`quantity-input.ts`)
- `remove-at-min` on `<ajax-cart-quantity>` (`quantity-element.ts`)

Not built: v2-style generic `data-ajax-cart-request-button` (href-parsed, multi-endpoint). One endpoint, one action.

## Markup

| Attribute | On | Value |
|---|---|---|
| `data-ajax-cart-remove` | any clickable element | identity: line index or item key |

```liquid
<a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity=0"
   data-ajax-cart-remove="{{ forloop.index }}">Remove</a>

<button type="button" data-ajax-cart-remove="{{ item.key }}">Remove</button>
```

`href` = no-JS fallback only, never read. Identity comes from the attribute value.

## Identity

```
[0-9]+, not all zero   →  line=<n>   (a leading zero is normalized away: "007" → line=7)
contains ":"            →  id=<key>
else                    →  console.error, no request
```

Loosened from an earlier draft of this doc, which specified `^[1-9][0-9]*$` and rejected any leading zero outright. Shopify's `cart/change.js` treats `line=01` the same as `line=1`, so a leading zero is an alternate spelling of a real line index, not malformed input — rejecting it client-side would be stricter than the server for no reason. `"0"`/`"00"` still fail, since there is no line 0.

**Shared module: `src/core/identity.ts`.** Move (not copy) `Identity` type + `parseIdentity()` out of `quantity-input.ts:15-25`. Export from `src/core/index.ts`. `quantity-input.ts` and `remove.ts` both import `{ parseIdentity, type Identity }` from `../core`.

Implementation order:
1. `src/core/identity.ts` — move `Identity`/`parseIdentity` from `quantity-input.ts`.
2. Export from `src/core/index.ts`.
3. `quantity-input.ts` → import from `../core`, delete local copy.
4. Move `describe("parseIdentity", ...)` from `quantity-input.spec.ts` → new `src/core/identity.spec.ts`.
5. Run quantity suite, then build `remove.ts`.

## Commit algorithm

Delegated `click` on `document`.

1. `event.target.closest("[data-ajax-cart-remove]")`, typed `Element` (not `HTMLElement`, for icon children). No match → ignore.
2. `event.preventDefault()`.
3. `isProcessing()` → drop, no request.
4. `parseIdentity()` fails → `console.error`, stop. Not deduped — matches `quantity-input.ts`'s actual `commit()`, which reports every attempt rather than using `warnOnce` (bounded by user gestures; a per-node guard wouldn't survive a render anyway).
5. `FormData` `{line|id, quantity: "0"}` → `change(body, { trigger: { source: "remove", initiator: element } })`.

No restore, no no-op guard, no failure-resync, no server-value tracking — control holds no persistent value.

## Busy state

| Event | Action |
|---|---|
| `queue-start` | `aria-disabled="true"` on every `[data-ajax-cart-remove]` |
| `request-end` | re-apply to freshly rendered elements |
| `queue-idle` | clear |

Never `disabled`. No import-order constraint (subscribes on public DOM events only).

## Accessibility

`<button type="button">` or `<a href>` only — no synthetic activation for `tabindex` divs. `aria-disabled` unconditional, not merchant-preserved.

## Integration (no action needed)

- `line-item-errors.ts`: keys off request body (`identityOf`), works unmodified.
- `js-ajax-cart-item-removing` (css-classes): keys off `change` body `quantity=0`, works unmodified.

## Out of scope

- `add`/`update`/`clear` via link.
- Confirmation prompts.
- Optimistic hide-before-response.

## Files

```
src/core/
  identity.ts        NEW — Identity type, parseIdentity()
  identity.spec.ts    NEW — moved from quantity-input.spec.ts
  index.ts             touch — export parseIdentity/Identity

src/quantity/
  quantity-input.ts     touch — import from ../core
  quantity-input.spec.ts touch — drop parseIdentity tests

src/remove/
  remove.ts           delegated click, identity parse, commit, busy state
  index.ts            side-effect init
  remove.spec.ts

src/index.ts          touch — import "./remove" (position-independent, like css-classes)
```

## Testing

- identity → correct `FormData` per grammar; invalid → error (not deduped), no request
- click resolution → icon child resolves via `closest()`; outside click ignored; `preventDefault` always fires on match
- `isProcessing()` → drop, no request
- busy state → `aria-disabled` set/cleared/reapplied per table; never `disabled`; focus retained
- no writes to marker element itself

## Open questions

- `data-ajax-cart-remove-all` for multi-select UIs — no known demand.
