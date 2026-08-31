# V3 Quantity — Design

An input that commits its value to `cart/change.js`, and an optional `<ajax-cart-quantity>` element that adds +/− stepping.

## Scope

Reads quantities from the DOM, writes quantity requests. **Never reads cart state** — the authoritative quantity is the `value` attribute Liquid rendered, refreshed when the sections module re-renders the markup.

Renders no error text. A 422 is reconciled by the sections module (`sections.ts:139-141`); line-item error messaging belongs to the future `line-item-errors/` module, so commits pass `trigger: { source: "quantity", initiator }`.

## Two independent pieces

| | Input binding | Stepper element |
|---|---|---|
| Marker | `data-ajax-cart-quantity-input="<identity>"` | `<ajax-cart-quantity>` |
| File | `quantity-input.ts` | `quantity-element.ts` |
| Listens | Delegated `change` / `keydown` on `document` | Its own buttons and input, inside itself |
| Knows the line item | Yes | No — but requires its input to have one |
| Fires requests | Yes | No — dispatches `change` |

**Neither calls the other.** The element writes `input.value` and dispatches a synthetic `change`; the binding handles it exactly as a human edit. That is the whole runtime contract between them.

One import crosses, in one direction: the element takes the identity attribute's name from the binding, because it requires its input to be cart-connected and the binding is what defines that. The element is an enhancement of the input, so depending on its contract is honest — a shared leaf module would only have hidden the dependency behind ceremony. The binding never imports back, and the selective-import boundary is `src/quantity/` as a whole, so an edge inside it costs nothing.

## Markup

| Marker | Placed on | Role |
|---|---|---|
| `data-ajax-cart-quantity-input="<identity>"` | `input[type="number"]` | Binds the control to a cart line |
| `<ajax-cart-quantity>` | wrapper | Adds +/− stepping to the one `input[type="number"]` inside it |
| `remove-at-min` | `<ajax-cart-quantity>` | Minus at `min` removes the line instead of doing nothing |
| `data-ajax-cart-quantity-plus` / `-minus` | any clickable inside the element | Step buttons |
| `min` / `max` / `step` | `input[type="number"]` | Range and increment, handled natively (see [Parameters](#parameters)) |

### Identity

```
[0-9]+, not all zero   →  change.js  line=<n>   (a leading zero is normalized away: "007" → line=7)
contains ":"            →  change.js  id=<key>
anything else           →  console error, no request
```

Line indices and item keys (`variantId:hash`) are disjoint languages, so this is decidable — unlike v2's `length > 3` heuristic (`_src-old/controls/quantity-input.ts:100`), under which `line="1000"` became a key. An empty value falls into the error branch; no separate case.

**A leading zero is accepted, not rejected** (revised after `V3-REMOVE.md` found Shopify's `cart/change.js` treats `line=01` the same as `line=1`): `parseIdentity` now lives in `src/core/identity.ts`, shared with `remove.ts`, and normalizes a leading zero away rather than erroring — rejecting it would be stricter than the server for no reason. `"0"`/`"00"` still fail; there is no line 0.

`line` is the documented default (Horizon sends only `line`). `id` covers fragments rendering a *subset* of the cart, where `forloop.index` would address the wrong lines, and staleness, where a stale index silently hits the wrong item while a stale key fails harmlessly.

**No attribute = not a quantity control.** Invisible to the binding, and invisible to the element too — `<ajax-cart-quantity>` wraps cart-connected inputs only (v2 parity, `_src-old/controls/quantity-element.ts:32-39`). That is what makes the busy state honest: every stepper on the page is affected by the queue, so dimming on `isProcessing()` is true of all of them rather than of most.

**Local stepping is therefore not supported.** A product-page quantity selector gets no help from this module; the merchant writes their own. Supporting it would mean the element could not tell whether the queue concerns it.

**A quantity control is an `input[type="number"]`, everywhere.** The binding and the stepper element hold the same requirement, so the two halves never disagree about the same markup — a marker on a `type="text"` input, a `<textarea>`, or a wrapper is reported by the binding rather than silently ignored while the element errors about it. v2 also accepted text inputs; requiring `number` buys native numeric keyboards on mobile and native validation, and costs markup a merchant can convert with one attribute.

The element requires *more* than the binding, but only about stepping: the step must also be usable (see [Element requirements](#element-requirements)). Those are stepping concerns, so only the element reports them.

**`<select>` is not supported**, unlike v2. It forced the module to set `disabled` — a select has no `readonly` — which removes the control from the form data set, so a native cart-form POST during a busy queue would submit a short `updates[]` array and Shopify would apply the remaining quantities to the wrong lines. Dropping it makes one rule absolute rather than almost-absolute: **nothing in this module ever sets `disabled`**. Merchants migrating replace the select with an `input[type="number"]`.

### Element requirements

Exactly one **steppable** input among its descendants — zero or several is a console error and the element does nothing (v2 parity, `_src-old/controls/quantity-element.ts:22-30`). One selector defines it, and everything in the element resolves through it:

```
input[type="number"][data-ajax-cart-quantity-input]:not([step="any" i])
```

Two details in that selector are load-bearing:

- **The identity marker is part of it.** Folding it in rather than checking separately means an unmarked input is simply invisible, so the existing "found 0" error covers it with no extra branch.
- **Other inputs are ignored, not counted.** Shopify markup carries `type="hidden"` fields constantly — `id`, section params, line properties — and a bare `input` count would reject those widgets as "more than one input" and disable them entirely.
- **The `i` flag.** `step="any"` means "no allowed value step", so `stepUp()` throws on it — and the keyword is ASCII case-insensitive, while CSS attribute matching is not. Without `i`, `step="ANY"` would pass the check and then fail silently at click time.

`any` is the only `step` value excluded: every malformed one (`abc`, `0`, `-3`, empty) falls back to a step of 1 in the browser and works normally.

A **fractional** step is not excluded either. Shopify quantities are integers — `QuantityRule` types `increment` as `Int!` — so generated markup never carries one, and `step="1.5"` walks 3 → 4 → 5.5 with the 5.5 going to the cart and coming back as `"expected integer"`. That is the same treatment every other server rule gets here; guarding it would cost a check for markup nobody writes.

A `<select>` matches nothing, so a widget built around one reports "found 0".

**A structure error binds nothing, deliberately.** The step markers are normally `<a href="{{ routes.cart_change_url }}?…">` — a no-JS fallback that still changes the quantity server-side — so a widget the library refuses to drive falls back to markup that works. Binding the click handler just to `preventDefault()` would replace a working, if clunky, path with dead buttons. The error is logged at connect, before any click.

**Nesting is unsupported and undetected.** An outer element wrapping an inner one still sees exactly one steppable input — the inner's — so both initialize and a click steps it twice. Nobody writes this, and detecting it costs more than it saves.

```liquid
{# cart line, inside the fragment that re-renders it #}
<div data-ajax-cart-fragment="cart/lines">
<ajax-cart-quantity>
  <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | minus: 1 }}"
     data-ajax-cart-quantity-minus>−</a>
  <input type="number" data-ajax-cart-quantity-input="{{ forloop.index }}"
         value="{{ item.quantity }}" min="0" step="1" autocomplete="off">
  <a href="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | plus: 1 }}"
     data-ajax-cart-quantity-plus>+</a>
</ajax-cart-quantity>
</div>
```

The step markers go on any element — the library only binds `click`. Use `<button type="button">` or `<a href>` so keyboard users can activate them: Enter/Space on a `<div tabindex="0">` fires no `click`, and the library does not synthesize activation. An `href` degrades without JS; the library never requires JS-only markup but guarantees no fallback.

**A marker may wrap an icon.** Click resolution narrows the target to `Element`, not `HTMLElement`, because an inline `<svg>` or `<path>` inside a button extends `Element` only — tightening it would break every stepper with an icon. Resolution then walks up with `closest()` to find the marker.

## Input binding

| Trigger | Action |
|---|---|
| `change` | Commit |
| `keydown` Enter | Commit, `preventDefault()` |
| `keydown` Escape | Restore server value, no request — inert while the queue is busy |

**Escape is inert while the queue is busy**, which makes one rule absolute: nothing in this module writes to a control while a request is in flight. `commit()` already drops, `applyBusyState()` only locks, and the resync runs after a request rather than during one — Escape was the sole exception. It also cannot undo a request already sent, so restoring would paint the attribute over a value the cart is already becoming (type 5, Enter, Escape gives 5, 2, 5). The cost is that Escape is inert during another line request too; nothing is lost, since a second press once idle works.

Escape does not cancel a pending step in the stepper element. Harmless with a `value` attribute — the timer fires, and the no-op guard eats the commit because the restored value already matches the cart. Without one, `restore()` no-ops and the abandoned step commits ~300 ms later; that configuration is now [reported as a markup error](#server-value) rather than supported.

Commit:

1. `isProcessing()` → **drop the commit**, changing nothing on screen.

   Dropping rather than queueing is deliberate: a body built from a `line` index and sent after another mutation would address the wrong item, since removing a line shifts every index after it.

   Changing nothing on screen is also deliberate. `readOnly` blocks new edits but does not suppress the `change` for an edit made *before* the lock, so ordinary commits reach here — Enter then blur, or a blur while the queue is already busy. Restoring here would repaint the server value over an edit whose own request is still in flight, snapping the shopper's 5 back to 2.

   The display is reconciled afterwards instead, by [Resync after a failed request](#resync-after-a-failed-request) — which is where the divergence actually lives, since a request that succeeds ends in a render and one that fails does not.
2. Identity fails the grammar → console error, stop.
3. **Empty value → restore, no request, no error** (ordinary typing). Checked first and separately: `Number("")` is `0`, and `type="number"` blanks unparseable input, so falling through would send `quantity=0` and delete the line. A **non-finite** value (`1e999` parses to `Infinity`) restores too — not because the server disallows it, but because there is nothing meaningful to put in the body.
4. Floor a negative value at 0 — the only correction applied to a typed value — then write the result back only when it differs from what is displayed. The write happens **before** step 5 and regardless of whether a request follows: when the guard below skips the request there is no render, so a typed `-9` against a cart holding 0 would otherwise sit on screen indefinitely. Skipping the write when nothing changed matters because assigning `input.value` moves the caret to the end, and Enter commits without blurring.
5. **No-op guard:** value numerically equal to the server value → no request. Skipped when there is no server value.
6. `FormData` with `line`/`id` + `quantity`, then `change(body, { trigger })`.

Nothing else about the value is corrected — see [Parameters](#parameters). `max` and `step` are never consulted here; they govern the element's stepping only.

**Not even whole-ness.** A fraction is sent as typed and Shopify answers `"expected integer"`, exactly as it answers an over-`max` or off-grid value. Rejecting it client-side would be a copy of a server rule — the thing this module refuses to hold — and would produce a `console.error` no shopper sees plus a field that appears to undo their edit. Once the line-item errors module exists, the server's answer is what they read.

**FormData, not JSON:** both work identically through `api.ts:77-83` and `sections.ts:72-79`, and consumers must handle both shapes anyway since merchants pass arbitrary bodies to the public methods. Matching v2 keeps one dialect across every control.

### Server value

| | Meaning | Use |
|---|---|---|
| `input.value` (property) | Displayed now | Read to build the request; write to change the display |
| `value` attribute (read via `defaultValue`) | What Liquid rendered | **Read only, never written** |

The browser never changes the attribute, so it is a standing record of the cart's quantity — this is what removes the state dependency. Escape, failure restore, the request-end resync, and the no-op guard all read it, via `input.defaultValue`, which despite its name IS the `value` attribute. Writing it would destroy that record.

**Something must re-render the control after a success**, or the attribute goes stale while the cart moves on — and the no-op guard then compares against a stale number and silently drops a later corrective edit. With the sections module that means placing it inside `[data-ajax-cart-fragment]`.

**This is a theme-integration requirement, not something the module checks.** A fragment test would assert one renderer's markup, and the planned morph preserves nodes rather than replacing them — so it would warn at markup that is perfectly fine, which is worse than not warning at all. Only the renderer knows which nodes it covers; this module depends on `../core` alone and does not get to guess.

**A marked input without a `value` is a markup error, not a supported mode.** It disables four things at once — Escape, the failure restore, the resync, and the guard that stops a repeat commit re-sending a quantity the cart already holds — and Liquid renders `value="{{ item.quantity }}"` for every cart line, so its absence is a mistake rather than a choice. An empty attribute reads identically through `defaultValue` and is treated the same.

**Reported, but not refused.** The request still goes: the line and the quantity are both known, so it is correct — only the undo is lost. Refusing would take the cart hostage over a missing attribute. An invalid identity stops instead, because there the line itself is unknown. The check lives in `controlFrom()` rather than `commit()` because Escape never reaches `commit()`, and Escape is the gesture that silently does nothing without a server value.

### Failure handling

> On `result.ok === false`, if the control is **still connected**, restore from the `value` attribute.

`api.ts:175` awaits the end hooks — including the sections render — before resolving, so "still connected" is an exact test for "nothing re-rendered me":

| Failure | Sections module | Binding |
|---|---|---|
| 422 with no section HTML | Re-fetches and re-renders (`sections.ts:139-141`) | Control detached — self-skips |
| Network failure / abort (`status === null`) | Renders nothing (`sections.ts:131`) | Restores from the attribute |

### Resync after a failed request

> On `REQUEST_END`, **if the result was not ok**, restore every marked control from its `value` attribute — except the one the shopper is currently typing in.

A dropped commit leaves a stepped or typed quantity on screen with no request behind it. That is normally harmless, because the in-flight request ends in a render that replaces the node — but not when it *fails*: `sections.ts:131` returns without rendering on `status === null`, so the display keeps a quantity the cart never received and nothing is scheduled to correct it.

Reachable whenever a request starts without an interaction that would flush a pending step — a merchant's auto-add mutation, an app, a programmatic `add()` — and then fails.

**Only on failure, and that distinction is load-bearing.** After a *success* the cart has moved and the `value` attribute may be behind it. If that request rendered, these nodes were replaced and a resync is a no-op; if it did not, restoring would repaint a **correct** display with a **stale** attribute and create the very divergence this exists to prevent. A failure is precisely the case where no render happened *and* the attribute is still the last confirmed truth.

**The focused control is skipped.** v2's equivalent (`_src-old/controls/quantity-input.ts:55-63`) set `disabled` during processing, which blurs the field, so it never met this case; `readonly` keeps focus, so an unconditional resync would wipe an edit in progress.

This is v2's `processingHandler` with the `value` attribute standing in for `getCartState()`. v2 could resync unconditionally because it held the cart; a per-node attribute cannot.

### Browser value restoration

Writing `value` sets the dirty flag, so browsers restore control values on soft reload and bfcache — a page can load displaying `7` while the attribute says `2`. That divergence is only reachable from an **uncommitted** edit (a committed one produced a request, and the render that followed replaced the control), so nothing was ever sent and nothing needs undoing.

**The module does not correct it.** `autocomplete="off"` on the input prevents restoration outright, which is why the documented markup carries it. Resetting values at init instead would mean writing to merchant markup on every page load, and it left button dimming stale — the write dispatches no `change`, so an element that had already computed its states never recomputed them.

Page-level staleness (bfcache, another tab) is owned by "BFcache should be solved" in `V3-ARCHITECTURE.md` plus open question F; any refresh re-renders fragments and gives controls fresh nodes, so quantity needs no changes.

### Busy state

| Event | Action |
|---|---|
| `liquid-ajax-cart:queue-start` | `readonly` on every marked control |
| `liquid-ajax-cart:request-end` | Re-apply to freshly rendered controls |
| `liquid-ajax-cart:queue-idle` | Clear it |

## Stepper element

`connectedCallback` validates the structure (above), then registers everything the instance needs against one `AbortController`: `click` and `change` **on itself**, plus `queue-start` and `queue-idle` on `document`. `disconnectedCallback` aborts the lot and clears any pending timer. Aborting first also makes a re-connected element idempotent rather than double-bound.

**Subscriptions are per instance, and there is no registry.** v2 subscribed per instance too but had no `disconnectedCallback` (`_src-old/controls/quantity-element.ts:44-46`), so under v3's render model it leaked three `document` listeners per line item per mutation. The fix is the cleanup, not avoiding the subscription — so `initQuantityElement()` does nothing but `customElements.define`, and no code walks a list of live elements.

Both element-level events bubble, so no per-child wiring is needed: a click resolves via `event.target.closest("[data-ajax-cart-quantity-plus], [data-ajax-cart-quantity-minus]")`, and the input is re-queried at use time. Buttons or inputs swapped in after connect therefore keep working, and no stale node references are held.

Click: `preventDefault()` → `isProcessing()` ignores → an **empty field** stops here → `input.stepUp()` / `stepDown()` → a result below 0 lands on 0 → unchanged means stop → refresh button states, schedule the debounce.

**An empty field is not a quantity to step from.** Native treats it as 0, so minus would land on `min` — or on 0 with no `min`, removing the line — and plus would collapse a line of 8 down to `min`. Both are data loss from a field the shopper merely cleared.

**Reached only when the input has no `value` attribute.** Clicking a button blurs the input, the `change` that fires runs `commit()`, and its empty-value branch restores the server value before the click handler runs — but `restore()` is a no-op with nothing to restore to, so the field is still empty when the click arrives. `commit()` guards the identical trap on its side.

This guard was originally justified by macOS Safari and Firefox "not blurring on a button click". **That was wrong** — see [Browser facts](#browser-facts).

The `try/catch` around stepping **reports the error**, including the exception itself. No known markup reaches it: the selector excludes both documented throw cases, and an input edited after connect stops matching that selector, so the null check bails first. That is the reason it reports rather than swallowing — a throw here is by definition something the selector does not model, and silence would leave a button that does nothing with no clue why.

Buttons dim by comparing the value against the bounds the buttons actually enforce — which is not simply `min`/`max`. The floor is `max(min ?? 0, 0)`: with `min` absent the browser is unbounded and the click handler stops at 0, and a negative `min` is overridden by that same hard floor. Defaulting the floor to 1 would dim minus at 1 on markup where clicking it still reaches 0 — a control that looks disabled and works.

An empty field must read as "no value", not as 0: `Number("")` is `0`, which would otherwise dim minus as though the field sat at the floor.

**Known limitation.** If `max` is not itself on the step grid, native refuses to step to it while the comparison says the button is live — so plus looks enabled and does nothing, permanently, because the refusal fires no request and therefore no render. Shopify's own rules prevent this: `QuantityRule` requires both `minimum` and `maximum` to be multiples of `increment`, so markup derived from `quantity_rule` always lands on the grid. It is reachable only from hand-written misaligned values, and closing it would mean re-introducing the client-side grid model this module deliberately does not hold. States refresh on connect, on its input's `change`, on its own clicks, and on the two queue events.

Debounce is a per-instance timer, **cancelled on any `change`** — a human commit or the element's own fire. A step still in the window is stale once the value has been committed by another route; left armed it fires after the newer commit and, with the queue busy, repaints the old quantity over the edit in flight. On fire it dispatches `new Event("change", { bubbles: true })` on its input.

### Early flush

A pending step is sent immediately once the shopper turns away from the widget. Debouncing exists to coalesce a burst of clicks; when the burst is over, the remaining delay buys nothing and can lose the step entirely.

**It has to be flushed, because nothing native carries it.** Writing `input.value` from script fires no `change` — verified — so a stepped quantity exists only in this timer. A shopper who clicks `+` and then Checkout navigates away with the step still pending and no request sent.

Two signals, both registered per instance on the element's `AbortController`:

| Signal | Where | Why |
|---|---|---|
| `pointerdown` | `document`, **capture** | Precedes focus movement *and* navigation, so the request leaves before a Checkout click. Capture, because a theme handler calling `stopPropagation()` would otherwise disable every flush on the page. |
| `focusout` | the element | Keyboard only — tabbing away fires no pointer event. |

Both bail when no timer is pending, and when the interaction stays **inside** the element: pressing the other button, or clicking back into the field, is a continuing adjustment, not a departure. `focusout` judges by `relatedTarget`, treating `null` as leaving.

The input is re-queried at flush time rather than captured with the timer, so a node swapped in by a render between click and flush is the one that fires.

**This supersedes v2's `focusout`-only approach** (`_src-old/controls/quantity-element.ts:82-89`) rather than repeating or discarding it. `pointerdown` carries the common case because it depends on no focus behaviour at all and fires before navigation; `focusout` is kept for the keyboard, which produces no pointer event. Ordering makes them safe together: `pointerdown` precedes `focusout`, and whichever runs first clears the timer, so the second finds nothing pending.

`focusout` alone would in fact work in the browsers tested — see [Browser facts](#browser-facts). `pointerdown` leads anyway because it depends on no focus behaviour at all, which is what makes it safe on touch, where a tap need not focus anything.

## Browser facts

Checked rather than assumed, because several decisions here were built on a wrong one.

| Behaviour | Result |
|---|---|
| Typing, then clicking a `<button>` / `<a>` / plain `<div>` / `tabindex` `<div>` | `change` fires and the input blurs — **Chromium and Safari alike**, both step markers |
| Writing `input.value` from script | fires **no** `change` — so a stepped quantity is carried only by the debounce timer |
| `stepUp()` / `stepDown()` | throws on a non-number type and on `step="any"`; snaps an off-grid value onto the grid |
| `[type="number"]` in a selector | matches `type="NUMBER"` — `type` is matched ASCII case-insensitively, unlike `step="any"` |

**The correction that mattered:** macOS Safari and Firefox are known not to *focus* a button on click, and this document previously treated that as "the input does not blur, so `change` never fires". Those are different claims, and the second is false — Safari blurs to the button and fires `change` exactly as Chromium does. Everything that rested on it has been re-derived, and one deferred feature was deleted rather than built.

macOS Firefox is still untested, but nothing now depends on it.

No `request-end` subscription here: a freshly rendered element connects while `isProcessing()` is still `true` (`queue.ts:84`), so `connectedCallback` applies the busy state itself, and elements that weren't replaced already hold the state `queue-start` gave them. The binding cannot do this — a plain `<input>` has no lifecycle callback — which is why it keeps `request-end` in every configuration, wrapped or bare.

## Disabled and ARIA

| State | Input | Buttons |
|---|---|---|
| Busy | `readonly` | `aria-disabled="true"` |
| At `min` (minus) or `max` (plus) | — | `aria-disabled="true"` |

**Nothing in this module ever sets `disabled`, on anything.** Disabling an element blurs it if focused, and no path guarantees a replacing render afterwards — on network failure or abort `sections.ts:131` renders nothing, so the node survives and the focus loss is pure cost. `readonly` keeps focus and caret while blocking edits. Click prevention does not depend on any of this: both handlers return early on `isProcessing()`, and native stepping refuses to pass `min` / `max`. Merchants style `[aria-disabled="true"]`, which they already had to for `<a>`.

### Both attributes are owned by the library

`readonly` on a marked input and `aria-disabled` on a marked step button are **set and cleared unconditionally**. Neither preserves a merchant-authored value, and neither should be written by a theme.

That is not a limitation to work around — it follows from what the markers mean. A merchant who does not want a line edited should not carry `data-ajax-cart-quantity-input` at all, since the marker's whole meaning is "wire this to the cart"; a fixed quantity renders as text, or as a `readonly` input *without* the marker. And a merchant who wants a step button dimmed at a stock ceiling expresses the **bound**, not the state:

```liquid
<input type="number" max="{{ item.variant.inventory_quantity }}" …>
```

— and the library derives the dimming. Setting `aria-disabled` by hand is overwritten on the next refresh, which is every queue transition.

The asymmetry with an earlier design that preserved merchant locks is deliberate: `aria-disabled` on a button is **derived** from `min`/`max` and recomputed constantly, so there is nothing a merchant could author that the library cannot express as a bound.

This drops v2's mechanism, which set `aria-disabled` **and** `disabled` on real buttons (`quantity-element.ts:123-128`) and disabled inputs outright (`quantity-input.ts:51`). Two further v2 bugs are fixed rather than reproduced: the minus-dimming test was a string comparison against a literal `"1"` that ignored the input's `min` (`"01"` slipped through), and `max` was never honoured — plus was never dimmed.

## Ordering facts (verified in core)

- `emitter.ts:41-56` awaits internal listeners, *then* dispatches the DOM event. Since sections renders from an internal listener, DOM listeners always run after the render — no import-order dependency — in the same task, so no flash.
- `addEventListener` ignores a repeat of the same `(type, callback, capture)` triple. `initInputBinding()` is therefore idempotent with no flag of its own, since every handler it registers is a stable module-level reference — a flag would only re-implement what the platform already guarantees.
- `queue.ts:84` clears `#running` *after* `queue-end`. `isProcessing()` is still `true` throughout that hook; `queue-idle` (`core.ts:33`) is the only point it reads `false`. Re-enabling on `queue-end` would disable controls permanently.

## Parameters

| Parameter | Source | Default |
|---|---|---|
| Debounce | module constant, not configurable | 300 ms |
| Minimum / maximum / increment | `min` / `max` / `step` on the input | 1 / unbounded / 1 |

Native HTML instead of library vocabulary; v2's global `quantityTagAllowZero` and `quantityTagDebounce` are both gone.

**Debounce is not configurable.** Its length only governs how long the user waits after their *last* click before the request fires — rapid clicking coalesces regardless — so it is a store-wide preference at most, never a per-widget one. v2 exposed `quantityTagDebounce` and no known store changed it. If demand appears it belongs in the settings module as a global; shipping without it stays reversible, since adding a knob later is backward-compatible and removing one is not.

**The browser owns the arithmetic.** Stepping is `input.stepUp()` / `stepDown()`, so `min`, `max` and `step` behave exactly as the platform defines them — including snapping an off-grid value onto the nearest valid one, and refusing to pass a `max` that is not itself a valid step value. The module holds no model of the range at all.

This requires **`type="number"`** — `stepUp()` throws on `type="text"`, on an `<input>` with no `type` attribute, and on `step="any"`. Rather than test for those after the fact, the element's selector simply doesn't match them, so the single structure check reports the problem (see [Element requirements](#element-requirements)).

That is deliberately a statement of *our* contract, not a copy of the browser's rule. `type="range"` and `type="date"` also support `stepUp()`, but neither is a cart quantity; excluding them is a scope decision. Modelling "what can the browser step?" instead would mean maintaining a duplicate of a platform rule that already drifts — an earlier draft of this check reported a false error on `type="range"` for exactly that reason.

**Typed values are not corrected.** A quantity over `max`, off the `step` grid, or beyond stock is sent as typed; Shopify rejects or caps it, and the render that follows restores the truth. Mirroring those rules client-side would duplicate exactly the state this module refuses to hold — and the module's premise is that the server corrects the DOM.

**`min` constrains the buttons, not the keyboard.** Typing is never validated: a typed `0` removes the line whatever `min` says (v2 behaved this way, so shoppers will not be surprised), and a typed value below a B2B `min` is sent for the server to reject. The +/− buttons, by contrast, obey `min` exactly, because native stepping does.

**The one hard floor is 0, and it applies to both.** A cart line has no representation below 0, so a negative is nonsense rather than merely invalid. The binding floors a typed negative to 0, and stepping **lands on 0** rather than passing it.

Landing on 0 rather than refusing matters whenever the grid skips 0: with `min` absent the step base is the `value` attribute, so `step="2"` from 1 runs `…-3, -1, 1, 3…` and stepping down overshoots to −1. Clamping makes that press remove the line exactly as a step onto 0 would. Refusing instead would leave a dead button and force `remove-at-min` onto markup with no `min` at all.

The floor is not the last line of defence — `commit()` floors negatives too — but it saves a request the binding would only reduce to 0 anyway, and keeps the display honest in the gap before that request lands.

**Writing 0 makes the input invalid, deliberately.** Under `min="6"` it reports `rangeUnderflow`; under a grid that skips 0, `stepMismatch`. That is accurate — 0 is not a valid *quantity* there, because it does not mean a quantity at all. Setting it never throws; the value setter only sanitizes.

The consequence to know about is that **native form submission is blocked while an invalid value sits in the field**. It does not bite here: nothing on a cart page submits natively — the library uses `fetch` — and the state lasts only until the render drops the row, or until a failed request restores the server value. The product-form case that would have mattered is gone with local stepping: `<ajax-cart-quantity>` now wraps cart-connected inputs only, so no `<ajax-cart-product-form>` quantity field is ever written to by this module.

Not worth guarding in code: reverting on invalidity would break `remove-at-min` outright, since 0 is always `rangeUnderflow` under a `min` above 0.

**A removal skips the debounce.** Coalescing exists for accumulating steps and nothing accumulates below 0, so waiting would only delay a destructive action the shopper has already committed to, with nothing on screen to show it registered.

### `remove-at-min`

```liquid
<ajax-cart-quantity remove-at-min>
  <a data-ajax-cart-quantity-minus>−</a>
  <input type="number"
         min="{{ variant.quantity_rule.min }}"
         value="{{ item.quantity }}"
         data-ajax-cart-quantity-input="{{ item.key }}">
  <a data-ajax-cart-quantity-plus>+</a>
</ajax-cart-quantity>
```

For B2B lines where `min` is a genuine `quantity_rule.min` — say 6 — minus at the floor is otherwise a dead press, and the shopper has no way to remove the line with the stepper. This turns that one press into a removal. Above `min` it changes nothing; plus is never affected.

**Detection is free.** `stepDown()` leaving the value unchanged already means "the browser refused to go lower" — nothing reads or interprets `min`, and it respects the step grid for free.

The comparison is **numeric**, not by string: the browser renormalises the text while refusing to change the number, so `value="06"` under `min="6"` comes back as `"6"`. A string comparison would read that as movement and skip the removal, leaving the button inert on that line.

**It lives on the element only**, as a bare attribute — valid HTML there, and the behaviour is the stepper's. A bare input can't express it, which costs nothing: an input with no element has no buttons.

**Nothing changes on the binding side.** It doesn't validate typed values, so a `0` written by the element is passed through like any other. That was not true of an earlier design whose floor was 1 — it would have lifted the `0` straight back, so both halves would have needed the flag.

**Needed exactly when `min` is above 0**, and inert otherwise. The trigger is native *refusing to move*, which going down only happens at a `min` above 0 — every other case (no `min`, `min="0"`, a grid that skips 0) reaches 0 by stepping and removes unaided. So the attribute's name matches its condition, and its absence means something exact: "minus won't remove at `min`".

That precision is why it is not `allow-remove` or `removable`. Removal is *always* possible — by typing `0`, and by stepping wherever 0 is reachable — so nothing is being permitted.

**Dimming follows.** The floor used for `aria-disabled` becomes 0 when the attribute is present, so minus stays live at `min` and dims only once the value reaches 0. A second press there is also guarded, so a line already at 0 can't re-send the removal.

## Dev warnings

Plain `console.error`, never deduped. Deduplication was dropped deliberately: a per-node guard cannot survive a render — the sections module replaces every line item, so each mutation yields a new node and a fresh key — and the two paths that could genuinely flood now report at connect instead.

**Reported by the element at `connectedCallback`** — one message, fired once per connection by construction, so the merchant sees it on page load rather than on first interaction: the element does not contain exactly one `input[type="number"]:not([step="any" i])`. A wrong `type`, a missing `type`, `step="any"`, no input at all, and two competing inputs all surface as that one error with the count attached.

**Reported by the element on click**, in the one case that should be impossible: `stepUp()` / `stepDown()` threw despite the selector having excluded every documented cause. The exception is passed along, since it is the only evidence of what the selector failed to model.

**Reported by the binding on a gesture** — a `change`, an Enter, or an Escape, so all three are bounded by user action. This is also why `handleKeydown` checks the key *before* resolving the control, since it otherwise runs on every keystroke on the page.

| Problem | Then |
|---|---|
| Identity matches neither grammar | **stops** — the line is unknown, so any request would be a guess |
| Marker on anything but an `input[type="number"]` | **stops** — and matches what the element requires, so the two halves never disagree |
| No `value` attribute (or an empty one) | **continues** — line and quantity are both known, so the request is right; only the undo is lost |


Nothing else is reported. A value the server may refuse — over `max`, off the grid, fractional — is not a merchant markup error, so it goes to Shopify and the answer comes back as a line-item error.

## Files

```
src/quantity/
  quantity-input.ts      ← delegated change/keydown, identity, commit, restore, busy state
  quantity-element.ts    ← <ajax-cart-quantity>: own listeners, native stepping, debounce, button states
  index.ts               ← side-effect init: defines the element, starts the binding
  *.spec.ts
```

Both implementation files import only `src/core`, never each other. There is no shared numeric helper: the browser supplies the arithmetic, so neither file holds a model of the range. `src/index.ts` gains `import "./quantity";`.

## Testing

Vitest browser mode, `vi.mock("../core")` stubbing `change` / `isProcessing` (pattern from `product-form.spec.ts:4-6`). Lifecycle events are dispatched as real `CustomEvent`s.

- **commit** — both grammars produce the right `FormData`; invalid grammar errors without requesting; Enter commits and prevents default; Escape restores; a value over `max` and a value off the `step` grid are both sent as typed; the write-back is skipped when nothing changed and happens exactly once when it is not (counted via a value-setter spy, since a `type=number` field has no selection API to assert the caret against); no-op guard; `isProcessing()` leaves the display alone rather than restoring; `trigger` passed.
- **floor** — a typed `0` sends 0 even with `min="1"`; a typed value below a B2B `min` is sent as typed; a typed negative floors to 0 and is written back, even when the request is then skipped; minus obeys `min`, reaches 0 when `min` is absent, and never crosses 0 however fast it is clicked; a removal fires without waiting for the debounce, while a fractional step landing between 0 and 1 still waits; `queue-start` locks and `queue-idle` unlocks through the real registrations, not a direct call.
- **unusable input** — **empty never requests, asserted against `min="0"` where the bug would delete the line**; unparseable text in `type="number"` restores; a fraction is sent as typed with no console error; a non-finite value restores without requesting.
- **resync** — a failed request restores every marked control from its `value` attribute, including one whose commit was dropped while busy; a 422 behaves like a network failure; a SUCCESSFUL request leaves the display alone; the focused control is skipped.
- **failure** — `status === null` on a connected control restores; a replaced control is left untouched; success never restores; `defaultValue` survives a commit.
- **element structure** — zero and two number inputs each error once; `type="text"`, a missing `type`, and `step` in all of `any`/`ANY`/`AnY` error too; `step` in `abc`/`0`/`-3`/`""` are **not** errors and still step (they fall back to 1); a fractional step is not rejected either, and steps onto the browser's grid; hidden inputs alongside the number input are ignored rather than counted.
- **element** — an input without the identity marker is reported as "found 0" and nothing binds; a `change` from another control inside the widget does not cancel a pending step; a button inserted after connect still steps, and so does an input swapped in after connect, which also drives the dimming; a refused step dispatches no `change` at either bound; an identity-less element steps but never calls `change`; an off-grid value snaps rather than adding the step; an empty field is ignored by both buttons; N clicks coalesce into one `change` once the window elapses; a stray `debounce` attribute is inert; disconnect clears the timer and listeners; an outside pointerdown or a departing focusout flushes a pending step, an inside one does not, a theme handler calling stopPropagation cannot suppress it, and the flush reaches the stepped widget rather than the first on the page.
- **subscription** — queue events drive each element independently; a disconnected element stops reacting (its listeners went with the abort); a re-appended one reacts exactly once, not twice; `initQuantityElement()` tolerates repeat calls.
- **remove-at-min** — minus at `min` sends 0, including for non-canonical values (`06`, `6.0`, `6e0`) where the browser renormalises the string and steps normally above it; without the attribute the same press does nothing; a second press at 0 does not re-send; plus at `max` is never turned into a removal; minus stays live at `min` and dims at 0; inert with `min="0"`; a grid that skips 0 (`step="2"` from 1, no `min`) lands on 0 without needing the attribute; asserted end to end that the request carries `quantity=0`.
- **carrier** — a marker on a `type="text"` input, an untyped input, a `<textarea>` or a wrapper is reported once per commit gesture and never requests; a missing or empty `value` attribute is reported on a change AND on an Escape, and still commits; an ordinary keystroke neither resolves the control nor reports, since the key is checked first.
- **escape** — restores from the attribute, requests nothing, is inert while the queue is busy, and works on the next press once idle.
- **states** — `readonly` is applied and cleared unconditionally, clearing even a lock the MERCHANT authored in Liquid; minus is not dimmed at 1 when `min` is absent (0 is reachable), dims at 0 when `min` is negative, and both buttons stay live on an empty field; no path ever sets `disabled` on a button or an input; busy sets `readonly` on inputs and never `disabled` on anything; a focused button keeps focus through queue-start; `min="1"` with `value="01"` dims minus; an element connected mid-queue is busy from `connectedCallback` with no `request-end` involved; an input rendered mid-queue is re-applied on `request-end`.

## Deferred

- **Live controls during processing** — disabling makes dropped intent visible; the alternative reimplements node preservation for one control.
- **Focus restoration** — see below.
- **Controls outside a fragment** — nothing re-renders them after a success. (The failure restore reaches them incidentally; that is not support.)
- **Quantities above 2^53**, in both halves, each closed by one line nobody is writing. `commit()` lets `String(Number(raw))` mangle them — `"12345678901234567890"` becomes `"...567000"`, `1e21` becomes `"1e+21"` — and the element's refusal check reads `stepDown()` on `1e16` as "native refused", so `remove-at-min` deletes the line. Unreachable from Liquid-rendered markup; both are commented at the code with full traces so a review does not re-derive them. `Number.isSafeInteger` is the wrong test in both places: it is false for `1.5`, so it would also reject the fractions this module deliberately forwards.
- **Global `conf()` defaults**, **stepping a `<select>`**.

## Requirements handed to the morph spec

1. Morph must not overwrite the value of the focused input (`ignoreActiveValue`), or it preserves the node and still clobbers typing.
2. Revisit the busy-state decision once morph lands — node preservation is what made "disable while processing" the honest choice.
