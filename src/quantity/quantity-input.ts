import {
  change,
  isProcessing,
  EVENTS,
  parseIdentity,
  type WaitUntilEvent,
  type RequestEndContext,
} from "../core";

/**
 * The marker that binds a control to a cart line — and the definition of
 * "cart-connected" for the whole module.
 *
 * Exported for `quantity-element.ts`, which requires its input to carry it. The
 * import goes that way and only that way: the element is an enhancement of the
 * input, so it may depend on this contract, while the binding never learns the
 * element exists. Nothing else crosses — the two communicate at runtime through
 * a synthetic `change` event, not by calling each other.
 */
export const ATTR = "data-ajax-cart-quantity-input";

/**
 * Puts back the quantity the cart holds, as Liquid rendered it.
 *
 * `defaultValue` is the `value` ATTRIBUTE, despite the name — and nothing,
 * browser or library, ever writes it. That is what lets this module work
 * without cart state. Empty means there is nothing to restore to.
 */
export function restore(control: HTMLInputElement): void {
  if (control.defaultValue === "") return;
  control.value = control.defaultValue;
}

// Both errors below fire from a commit — a change, an Enter, or a debounce
// flush — so they are bounded by user action rather than by a loop, and need no
// dedup. (A per-node guard would not have survived a render anyway: the
// sections module replaces every line item, so each mutation yields a new node
// and a fresh key.)

export async function commit(control: HTMLInputElement): Promise<void> {
  // Dropped, not queued: a body built from a `line` index and sent after
  // another mutation would address the wrong item, since removing a line
  // shifts every index after it.
  //
  // No restore here either. `readOnly` blocks new edits but does not suppress
  // the `change` for an edit made *before* the lock, so this branch is reached
  // by ordinary commits too — Enter then blur, or a blur while the queue is
  // already busy. Restoring would repaint the server value over an edit whose
  // own request is still in flight, snapping the shopper's 5 back to 2.
  //
  // The display a genuinely dropped commit leaves behind is reconciled by
  // restoreAfterFailure() instead. Do not "fix" it here: this branch cannot
  // tell the two callers apart.
  if (isProcessing()) return;

  const identity = parseIdentity(control.getAttribute(ATTR) ?? "");
  if (!identity) {
    console.error(
      `Liquid Ajax Cart: "${ATTR}" must be a line index (1, 2, 3…) or a line item key (containing ":").`,
      control,
    );
    return;
  }

  const raw = control.value.trim();
  // Checked before Number(): Number("") is 0, and a type=number field blanks
  // unparseable text — falling through would send quantity=0 and delete the line.
  if (raw === "") {
    restore(control);
    return;
  }

  // Only what cannot be serialised is rejected, not what the server disallows.
  // A fraction is sent as typed and Shopify answers "expected integer" — the
  // same contract as an over-`max` or off-grid value, and once the line-item
  // errors module exists the shopper sees that answer. A console error here
  // would be invisible to them, and restoring would look like the field
  // silently undoing their edit.
  //
  // Infinity is different: `1e999` parses to it, and "Infinity" is not a
  // quantity in any sense, so there is nothing meaningful to send.
  //
  // KNOWN AND ACCEPTED — do not "fix" without asking. This guard stops at
  // non-finite and deliberately does NOT reject values above 2^53, even though
  // the String() round-trip below mangles them:
  //
  //     "12345678901234567890"    -> "12345678901234567000"   silently wrong
  //     "1000000000000000000000"  -> "1e+21"                  sent verbatim
  //
  // So a shopper who types 21 digits sees the field rewritten to "1e+21" and
  // that string reaches change.js. `Math.abs(parsed) > Number.MAX_SAFE_INTEGER`
  // would close it in one line — MAX_SAFE_INTEGER, not the 1e21 exponential
  // threshold, since precision dies first. Left open on purpose: the shopper
  // typed nonsense into a quantity box, Shopify rejects it either way, and the
  // only cost is an ugly string in a field they filled with garbage. Nothing
  // reaches the cart wrongly.
  //
  // Note `Number.isSafeInteger` is the WRONG test here — it is false for 1.5,
  // so it would also reject fractions, undoing the paragraph above.
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    restore(control);
    return;
  }

  // Typed values are not validated. Over `max`, off the `step` grid, below a
  // B2B `min`, beyond stock — all sent as typed, and corrected by the render
  // that follows. `min` constrains the +/- buttons, not the keyboard: mirroring
  // it here would duplicate state this module deliberately does not hold, and a
  // typed 0 removing the line is long-standing behaviour merchants expect.
  //
  // The single exception is a hard one: a cart line has no representation below
  // 0, so a negative quantity is nonsense rather than merely invalid. It floors
  // to 0 — which removes — rather than being sent for the server to reject.
  const value = parsed < 0 ? 0 : parsed;
  // Write the property, never the attribute. Skipped when nothing changed,
  // because assigning value moves the caret and Enter commits without blurring.
  if (String(value) !== control.value) control.value = String(value);

  // The `value` attribute, i.e. the cart's own quantity — see restore().
  const server = control.defaultValue;
  if (server !== "" && Number(server) === value) return;

  const body = new FormData();
  body.set(identity.key, identity.value);
  body.set("quantity", String(value));

  const result = await change(body, {
    trigger: { source: "quantity", initiator: control },
  });

  // Still connected means no render replaced this node — api.ts awaits the end
  // hooks (including the sections render) before resolving. The only outcome
  // that leaves the node in place without a render is one where the server
  // never saw the request — a genuine failure, or a `request-start` listener
  // that vetoed it via `abort()`. Both are treated the same: a veto is not
  // "another request will land and fix this" the way a superseding request
  // would be — nothing lands, the cart is unchanged, and leaving the display
  // showing the rejected value would be indistinguishable from success.
  if (!result.ok && control.isConnected) restore(control);
}

/**
 * Resolves the marked control behind a gesture, reporting markup that carries
 * the marker but cannot honour it.
 *
 * Two different problems, reported differently:
 *
 * - **Wrong carrier** — a `<textarea>`, a wrapper, a `type="text"` input. Stops,
 *   because a quantity control is an `input[type="number"]` everywhere; the
 *   stepper element requires the same, so without this the two halves would
 *   disagree about the same markup, one silent and one reporting.
 * - **No `value` attribute** — reports and CONTINUES. We know which line and
 *   what quantity, so the request is still correct; what is lost is the ability
 *   to undo. Refusing would take the cart hostage over a missing attribute,
 *   which is worse than the degradation. An invalid identity stops instead
 *   precisely because there the line itself is unknown.
 *
 * Reporting is safe at this frequency because every caller is a commit gesture
 * — a `change`, an Enter, or an Escape — never a keystroke.
 */
function controlFrom(target: EventTarget | null): HTMLInputElement | null {
  if (!(target instanceof Element)) return null;

  const control = target.closest(`[${ATTR}]`);
  if (!control) return null;

  if (!(control instanceof HTMLInputElement) || control.type !== "number") {
    console.error(`Liquid Ajax Cart: "${ATTR}" must be on an <input type="number">.`, control);
    return null;
  }

  // The attribute is this module's whole substitute for cart state, so its
  // absence disables four things at once rather than one: Escape, the failure
  // restore in commit(), the request-end resync, and the no-op guard that stops
  // a repeat commit re-sending a quantity the cart already holds.
  //
  // Checked here rather than in commit() because Escape never reaches commit(),
  // and Escape is exactly the gesture that silently does nothing without it.
  // The message carries the fix rather than the reasoning: it ships in the
  // production bundle, and the "why" above costs nothing there.
  if (control.defaultValue === "") {
    console.error(`Liquid Ajax Cart: "${ATTR}" needs value="{{ item.quantity }}".`, control);
  }

  // NOT checked here: whether anything will re-render this control after a
  // success. It matters — the `value` attribute goes stale otherwise, and the
  // no-op guard then silently drops a later corrective edit — but this module
  // cannot answer it. A `[data-ajax-cart-fragment]` test would assert one
  // renderer's markup, and the planned morph preserves nodes instead of
  // replacing them, so that test would warn at markup that is perfectly fine.
  // A false dev warning is worse than none: it teaches merchants to ignore the
  // console. Only the renderer knows which nodes it covers; this module depends
  // on `../core` alone and does not get to guess. Documented in V3-QUANTITY.md
  // as a theme-integration requirement instead.
  return control;
}

function handleChange(event: Event): void {
  const control = controlFrom(event.target);
  if (control) void commit(control);
}

function handleKeydown(event: KeyboardEvent): void {
  // Key first: this runs on every keystroke anywhere on the page, and resolving
  // the control would mean a closest() walk — and a possible console error —
  // per character typed.
  if (event.key !== "Enter" && event.key !== "Escape") return;

  const control = controlFrom(event.target);
  if (!control) return;

  if (event.key === "Enter") {
    event.preventDefault();
    void commit(control);
    return;
  }

  // Inert while the queue is busy, which makes one rule absolute: nothing in
  // this module writes to a control while a request is in flight. commit()
  // already drops here, applyBusyState() only locks, and restoreAfterFailure()
  // runs after a request rather than during one — Escape was the sole exception,
  // and an exception like that has to be remembered by every later change.
  //
  // What it prevents: type 5, Enter (request for 5 in flight), Escape. Restoring
  // would paint the attribute's 2 over a value the cart is already becoming, so
  // the field asserts something false until the render lands and flips it back
  // — 5, 2, 5. Escape cannot undo a request that has been sent, and pretending
  // otherwise is worse than not responding.
  //
  // What it costs: Escape is also inert during ANOTHER line's request. Nothing
  // is lost — a second press once the queue idles works, a success replaces the
  // node, and a failure hits restoreAfterFailure(). The precise alternative,
  // tracking WHICH control is in flight, was declined: it is module state, and
  // the same state was already declined for the busy-drop bug, which was real
  // cart divergence rather than a repaint.
  if (isProcessing()) return;

  // KNOWN AND ACCEPTED — do not "fix" without asking. Escape does not cancel a
  // pending step in <ajax-cart-quantity>. With a `value` attribute that is
  // harmless: restore() puts the cart's quantity back, so when the timer fires
  // ~300ms later commit() finds display === attribute and the no-op guard sends
  // nothing. Without one, restore() no-ops and the abandoned step DOES commit:
  //
  //     no value attr: type 3, press +, press Escape
  //       -> restore() no-op, timer survives, commit(4) at 300ms
  //
  // But controlFrom() has already reported that markup, so the case lives in a
  // configuration this module calls an error. Cancelling it would mean the
  // element listening for Escape on itself — five lines, no cross-import, and
  // still no way to repaint the stepped value it cannot restore.
  restore(control);
}

/**
 * `readonly` on a marked control is owned by this module — set on queue-start,
 * cleared on queue-idle, unconditionally. There is no merchant-authored lock to
 * preserve: a line the merchant does not want edited should not carry the
 * marker at all, since the marker's whole meaning is "wire this to the cart".
 *
 * Never `disabled`: disabling blurs a focused element, and no path guarantees a
 * replacing render afterwards. `readonly` blocks edits and keeps focus.
 */
export function applyBusyState(): void {
  const busy = isProcessing();
  document.querySelectorAll(`[${ATTR}]`).forEach((control) => {
    if (control instanceof HTMLInputElement) control.readOnly = busy;
  });
}

/**
 * Puts every control back to the last quantity the server confirmed, after a
 * request that did not update the cart.
 *
 * A commit made while the queue is busy is dropped rather than queued —
 * deliberately, because a request built from a `line` index and sent after
 * another mutation would address the wrong item. The display is left showing
 * the dropped value on the assumption that a render will correct it, which is
 * true right up until the in-flight request fails: `sections.ts:131` returns
 * without rendering when `status === null`. That leaves a quantity on screen
 * that the cart never received, with nothing scheduled to reconcile it.
 *
 * NEVER on success. After a success the cart has moved and the `value`
 * attribute may be behind it — if that request rendered, the nodes were
 * replaced and this would be a no-op anyway; if it did not, restoring would
 * repaint a correct display with a stale attribute and *create* the
 * divergence. A non-success is precisely the case where no render happened AND
 * the attribute is still the last confirmed truth.
 *
 * This is v2's `processingHandler` (`_src-old/controls/quantity-input.ts:55-63`)
 * with the `value` attribute standing in for `getCartState()`. v2 could resync
 * unconditionally because it held the cart; reading a per-node attribute cannot.
 *
 * Runs on a cancelled request too, not only a failed one. `cancelled` exists so
 * error-rendering modules can stay silent about a request nobody wants reported
 * — it does not promise anything else will correct the display. The one caller
 * of `abort()` this library exposes is a `request-start` listener, and the
 * natural use of that hook is a merchant vetoing a request outright: the server
 * never saw it, the cart did not move, and nothing else is coming to reconcile
 * this control. Skipping the restore there would leave the field showing a
 * value the cart rejected, indistinguishable from a value it accepted — worse
 * than an ordinary failure, which does restore.
 */
function restoreAfterFailure(event: WaitUntilEvent<RequestEndContext>): void {
  // Reached without a cast because core/events.d.ts maps this event name onto
  // DocumentEventMap. `result` is required there, so a detail that lacks it
  // throws rather than quietly skipping the restore — the previous
  // `detail?.result` / `?.ok !== false` spelling turned a broken contract into a
  // silent no-op, which is the same failure mode the registration test below
  // exists to catch.
  if (event.detail.result.ok) return;

  document.querySelectorAll(`[${ATTR}]`).forEach((control) => {
    // Skip a field being typed in. v2 set `disabled`, which blurs, so it never
    // met this case; `readonly` keeps focus, so here a resync would wipe an
    // edit in progress.
    if (control instanceof HTMLInputElement && control !== document.activeElement) {
      restore(control);
    }
  });
}

/**
 * Pure registration — no side effects, so no idempotence flag is needed:
 * addEventListener ignores a repeat of the same (type, callback, capture)
 * triple, and every handler here is a stable module-level reference.
 */
export function initInputBinding(): void {
  document.addEventListener("change", handleChange);
  document.addEventListener("keydown", handleKeydown);

  // queue-idle, not queue-end: queue.ts clears #running only after the
  // queue-end hook, so isProcessing() still reads true throughout it.
  document.addEventListener(EVENTS.QUEUE_START, applyBusyState);
  document.addEventListener(EVENTS.REQUEST_END, applyBusyState);
  document.addEventListener(EVENTS.QUEUE_IDLE, applyBusyState);

  // Runs after the sections module, which renders from an internal listener —
  // emitter.ts dispatches the DOM event only once those have completed. So a
  // request that rendered has already replaced these nodes by now.
  document.addEventListener(EVENTS.REQUEST_END, restoreAfterFailure);
}
