import { isProcessing, EVENTS } from "../core";
// One constant, one direction: this element requires a cart-connected input, so
// it depends on the binding's definition of that. The binding never imports
// back, and neither calls the other — they meet at a synthetic `change` event.
import { ATTR as INPUT_ATTR } from "./quantity-input";

const TAG = "ajax-cart-quantity";

// The control this widget steps. Narrowing the selector rather than checking
// the type afterwards states one contract in one place — and it makes the
// widget tolerant of the other inputs Shopify markup routinely carries
// (`type="hidden"` above all), which a bare `input` count would have rejected
// as "more than one".
//
// `step="any"` is the ONE step value that has to be excluded: it is the only
// one HTML defines as "no allowed value step", so stepUp() throws on it. Every
// other invalid step — "abc", "0", "-3", "1.5", "" — silently falls back to 1
// and steps normally, so there is nothing else to filter. The `i` flag is
// load-bearing: the keyword is ASCII case-insensitive, so step="ANY" throws
// too, and without it that markup would slip through and fail silently.
//
// The identity marker is part of the requirement, not merely expected: this
// element only wraps CART-CONNECTED inputs (v2 held the same rule at
// `_src-old/controls/quantity-element.ts:32-39`). That is what makes the busy
// state honest — every stepper is affected by the queue, so dimming on
// `isProcessing()` is true of all of them rather than of most. Folding it into
// the selector rather than checking it separately means an unmarked input is
// simply invisible, and the existing "found 0" error already covers it.
const INPUT = `input[type="number"][${INPUT_ATTR}]:not([step="any" i])`;
const PLUS = "data-ajax-cart-quantity-plus";
const MINUS = "data-ajax-cart-quantity-minus";

// Makes a minus press at `min` remove the line instead of doing nothing. Only
// meaningful when `min` is above 0 — otherwise minus already reaches 0 on its
// own and this is inert. A bare attribute rather than `data-`: it lives on the
// custom element, where any attribute name is valid HTML.
const REMOVE_AT_MIN = "remove-at-min";
// Not configurable per element: debounce length only governs how long the user
// waits after their LAST click before the request fires — rapid clicking is
// coalesced regardless — so it is a store-wide preference at most. If one is
// ever wanted, it belongs in the settings module, not on every stepper.
const DEBOUNCE_MS = 300;

/** Reads a numeric attribute for button state only; never for a request. */
function attrNumber(el: Element | null, name: string, fallback: number): number {
  const raw = el?.getAttribute(name)?.trim();
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export class QuantityElement extends HTMLElement {
  #controller: AbortController | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;

  connectedCallback(): void {
    // connectedCallback fires as soon as the start tag is parsed, before the
    // children exist. Same guard as <ajax-cart-product-form>.
    if (document.readyState !== "loading" || this.querySelector<HTMLInputElement>(INPUT)) {
      this.#init();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => this.#init(), { once: true });
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  /**
   * Recomputes every step button's `aria-disabled`. Never sets `disabled`:
   * that would blur a focused button during a transition with no render behind
   * it. Clicks are already inert — the handler returns early while processing,
   * and stepUp()/stepDown() refuse to pass min/max.
   *
   * The bounds are read straight off the attributes rather than reconciled:
   * when `max` is not itself a valid step value the button dims one step late,
   * which the next render corrects. Not worth a client-side model of the grid.
   */
  refresh(): void {
    const input = this.querySelector<HTMLInputElement>(INPUT);

    // NaN stands for "no value to compare against", covering a missing input
    // and an empty field alike — the empty case has to be mapped explicitly,
    // because Number("") is 0, which would otherwise read as a real quantity.
    // Every comparison against NaN is false, so it needs no further guarding:
    // an unknown value simply never dims a button on bounds.
    const raw = input?.value.trim();
    const current = raw ? Number(raw) : NaN;

    // The floor the buttons actually enforce, which is not simply `min`: with
    // `min` absent native is unbounded and #onClick stops at 0, a negative
    // `min` is overridden by that same hard floor, and `remove-at-min` lets
    // minus travel from `min` down to 0 in one press. Dimming has to agree with
    // what a click does, or the button lies.
    const floor = this.hasAttribute(REMOVE_AT_MIN) ? 0 : Math.max(attrNumber(input, "min", 0), 0);
    const ceiling = attrNumber(input, "max", Infinity);

    this.querySelectorAll(`[${PLUS}], [${MINUS}]`).forEach((button) => {
      const atBound = button.hasAttribute(PLUS) ? current >= ceiling : current <= floor;

      if (isProcessing() || atBound) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
    });
  }

  #init(): void {
    if (!this.isConnected) return;

    // Reported here rather than on interaction: #init runs once per connect, so
    // it needs no dedup, and the merchant learns at page load.
    const inputs = this.querySelectorAll<HTMLInputElement>(INPUT);
    if (inputs.length !== 1) {
      console.error(
        `Liquid Ajax Cart: <${TAG}> must contain exactly one <input type="number" ${INPUT_ATTR}>, found ${inputs.length}.`,
        this,
      );
      // Binding NOTHING is the point, not an oversight. The step markers are
      // normally `<a href="{{ routes.cart_change_url }}?…">`, a no-JS fallback
      // that still changes the quantity server-side — so a widget we have
      // refused to drive falls back to markup that works. Binding #onClick just
      // to preventDefault() would replace a working, if clunky, path with dead
      // buttons. The error is logged here at connect, before any click.
      return;
    }

    // Aborting first keeps a moved / re-appended element from double-binding.
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener("click", this.#onClick, { signal });
    this.addEventListener("change", this.#onChange, { signal });

    // Queue transitions ride the same signal, so disconnecting removes them
    // with everything else. v2 subscribed per instance too, but had no
    // disconnectedCallback — the leak was the missing cleanup, not the
    // subscription. queue-idle rather than queue-end: queue.ts clears #running
    // only after the queue-end hook, so isProcessing() still reads true
    // throughout it.
    document.addEventListener(EVENTS.QUEUE_START, this.#onQueue, { signal });
    document.addEventListener(EVENTS.QUEUE_IDLE, this.#onQueue, { signal });

    // Early flush, on the two ways a shopper can turn away from this widget.
    //
    // `pointerdown`, in the CAPTURE phase and on `document`: it precedes both
    // focus movement and navigation, so a step still inside the debounce window
    // gets its request away before a Checkout click leaves the page — and
    // capture means no handler in between can stop it by halting propagation.
    // It also works regardless of focus, which is why it replaces v2's
    // `focusout` (`_src-old/controls/quantity-element.ts:82-89`) as the primary
    // signal rather than joining it.
    //
    // `focusout` is still needed, but only for the keyboard: tabbing away
    // produces no pointer event at all.
    document.addEventListener("pointerdown", this.#onOutsidePointer, { signal, capture: true });
    this.addEventListener("focusout", this.#onFocusOut, { signal });

    this.refresh();
  }

  #onQueue = (): void => {
    this.refresh();
  };

  /**
   * Sends a pending step now instead of waiting out the debounce.
   *
   * Debouncing exists to coalesce a burst of clicks; once the shopper has
   * turned away, there is no burst left to coalesce and the delay only risks
   * losing the step to a navigation.
   *
   * The input is re-queried rather than taken from the timer, so a node swapped
   * in by a render between the click and the flush is the one that fires.
   */
  #flush(): void {
    if (this.#timer === undefined) return;
    clearTimeout(this.#timer);
    this.#timer = undefined;

    const input = this.querySelector<HTMLInputElement>(INPUT);
    if (input) this.#fire(input);
  }

  #onOutsidePointer = (event: Event): void => {
    // Speed, not correctness — #flush() re-checks this, so removing it changes
    // no behaviour and no test. It is here because this handler runs for every
    // pointerdown anywhere on the page, once per <ajax-cart-quantity> on it,
    // and with nothing pending the contains() walk below is wasted work.
    if (this.#timer === undefined) return;

    // Inside our own widget means the adjustment is still being made — pressing
    // the other button, or clicking back into the field, must not commit a
    // half-made change.
    const target = event.target;
    if (target instanceof Node && this.contains(target)) return;

    this.#flush();
  };

  #onFocusOut = (event: FocusEvent): void => {
    if (this.#timer === undefined) return;

    // Where focus is heading. Tabbing from minus to plus stays inside and must
    // not flush; a null relatedTarget (focus left for nowhere nameable) counts
    // as leaving.
    const next = event.relatedTarget;
    if (next instanceof Node && this.contains(next)) return;

    this.#flush();
  };

  #onChange = (event: Event): void => {
    // This widget's own input only. The listener is on `this`, so every `change`
    // bubbling out of the element arrives here — and the structure check only
    // rejects extra `input[type="number"]`, so a line-property <select> or a
    // gift-wrap checkbox may legitimately sit inside. Without this guard,
    // toggling one within the debounce window silently discards a step:
    //
    //     press + (display 2 -> 3, timer armed), toggle the checkbox
    //       -> its change cancels the timer -> no request ever fires
    //       -> input keeps showing 3 while the cart still holds 2
    //
    // Correct regardless of whether such widgets are "supported": a timer that
    // tracks THIS input's value has no business being cancelled by another
    // control's commit.
    if (event.target !== this.querySelector(INPUT)) return;

    // A `change` from the stepped input — a human commit, or our own #fire —
    // means the value has been committed by some route, so a step still sitting
    // in the debounce window is stale. Left armed, it would fire after the newer
    // commit and re-enter commit() while the queue is busy, repainting the old
    // quantity over the edit in flight.
    clearTimeout(this.#timer);
    this.#timer = undefined;

    // Deferred to a microtask. This element's own listener (on `this`) fires
    // during the bubble phase before quantity-input.ts's delegated listener
    // on `document`, since <ajax-cart-quantity> sits between the input and
    // document. A same-tick synchronous restore — e.g. commit()'s
    // empty-value or non-integer branches — would otherwise be invisible to a
    // refresh computed from the pre-restore value, leaving aria-disabled
    // stale until an unrelated queue event happens to correct it.
    queueMicrotask(() => this.refresh());
  };

  #onClick = (event: Event): void => {
    // Narrowing for `closest()`. Unreachable while this listener lives on
    // `this` — but a cast would become a live TypeError the moment it moved to
    // document-level delegation, where `document` is a possible target and has
    // no `closest()`. quantity-input.ts narrows identically, and there it is
    // reachable.
    //
    // `Element`, NOT `HTMLElement`: an inline SVG icon inside a button makes
    // the target an <svg> or <path>, which extend Element only. Tightening
    // this would break every stepper with an icon.
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest(`[${PLUS}], [${MINUS}]`);
    if (!button || !this.contains(button)) return;

    event.preventDefault(); // the href is a no-JS fallback, not decoration
    if (isProcessing()) return;

    const input = this.querySelector<HTMLInputElement>(INPUT);
    if (!input) return;

    // An empty field carries no quantity to step from, and stepping one anyway
    // treats it as 0 — so minus would land on `min` (or on 0 with no `min`) and
    // remove the line. commit() guards the same trap on its side.
    //
    // Reached only when there is no `value` attribute. Normally the click
    // blurs the input first, the `change` that fires runs commit(), and its
    // empty-value branch restores before this line — but restore() is a no-op
    // with nothing to restore to, so the field is still empty here.
    //
    // This used to be justified by macOS Safari and Firefox "not blurring on a
    // button click". That was wrong: Safari fires `change` and moves focus for
    // both a <button> and an <a>, exactly like Chromium (checked on a real
    // Safari, both markers). The guard survives on the attribute case alone.
    if (input.value.trim() === "") return;

    const before = input.value;

    // The browser owns the arithmetic: stepUp()/stepDown() apply min, max and
    // step exactly as the platform defines them, including snapping an
    // off-grid value onto the nearest valid one.
    //
    // Not reachable through any markup we know of: INPUT excludes both
    // documented throw cases (a non-number type, and step="any"), and an input
    // edited after connect stops matching the selector, so the null check above
    // catches it first. That is precisely why this reports rather than
    // swallowing — if it ever fires, it is something the selector does not
    // model, and the error object is the only clue to what.
    try {
      if (button.hasAttribute(PLUS)) input.stepUp();
      else input.stepDown();
    } catch (error) {
      console.error(`Liquid Ajax Cart: <${TAG}> could not step its <input>.`, error, input, this);
      return;
    }

    // A quantity has no representation below 0, so stepping lands ON 0 rather
    // than passing it. Reachable whenever native is unbounded (`min` absent or
    // negative) or the grid skips 0 — `step="2"` from 1 runs …-3, -1, 1, 3…, so
    // stepping down overshoots to -1. Clamping rather than reverting means that
    // press removes the line, exactly as a step onto 0 would; reverting left a
    // dead button and forced `remove-at-min` on markup that has no `min` at all.
    //
    // `commit()` floors negatives too, so this is not the last line of defence
    // — it saves a request the binding would only reduce to 0 anyway, and keeps
    // the display honest in the gap before that request lands.
    if (Number(input.value) < 0) input.value = "0";

    // Native refused to move at all — the value sits on `min` (minus) or `max`
    // (plus). Distinct from the overshoot above, which lands on 0 and removes
    // like any other step to 0; only a refusal needs opting in, and a refusal
    // going down means `min` is above 0.
    // Compared numerically: the browser renormalises the string while refusing
    // to change the number, so `value="06"` under `min="6"` comes back as "6" —
    // a string comparison would read that as movement and skip this branch,
    // leaving remove-at-min inert. Every other comparison here is numeric.
    //
    // KNOWN AND ACCEPTED — do not "fix" without asking. Numeric equality is
    // wrong above 2^53, where a step is smaller than the float can represent:
    //
    //     min="6" remove-at-min, value="10000000000000000", press minus
    //     stepDown() writes "9999999999999999"   <- the STRING did change
    //     Number(after) === Number(before)       <- but this is TRUE
    //     => read as "refused at min" => remove-at-min writes "0" => line deleted
    //
    // Note the two failure modes are mirror images, so neither comparison is
    // right on its own and combining them does not help — both cases look
    // identical (string changed, number did not):
    //
    //     "06" -> "6"   string changed, number same  => genuinely a refusal
    //     1e16 -> ...   string changed, number same  => genuinely moved
    //
    // Telling them apart needs a magnitude precondition, not a smarter compare:
    // `if (Math.abs(Number(before)) > Number.MAX_SAFE_INTEGER) return;` above.
    // Left open on purpose — a cart line of nine quadrillion is not a scenario,
    // and it cannot be reached from Liquid-rendered markup, only by typing 17+
    // digits into the field by hand.
    if (Number(input.value) === Number(before)) {
      // `remove-at-min` turns that dead press into a removal, for B2B lines
      // where `min` is a real quantity_rule.min (say 6) rather than a floor of
      // 1. Nothing is needed on the binding side: it does not validate typed
      // values, so a 0 arriving from here is passed through like any other.
      const removes = !button.hasAttribute(PLUS) && this.hasAttribute(REMOVE_AT_MIN);
      // Guard the already-removed case, or a second press would re-send 0.
      if (!removes || Number(before) === 0) return;
      input.value = "0";
    }

    this.refresh();
    this.#schedule(input);
  };

  #schedule(input: HTMLInputElement): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;

    // A removal goes immediately. Debouncing exists to coalesce accumulating
    // steps, and nothing accumulates below 0 — so waiting would only delay a
    // destructive action the shopper has already committed to, with no change
    // on screen to show it registered.
    //
    // Tests for a removal, not for smallness. Everything reaching here has
    // passed #onClick, which floors negatives and writes "0" for remove-at-min,
    // so the value is never below 0 and "is a removal" is exactly "is 0". With
    // an integer step the two are the same test; with a fractional one they are
    // not, and `< 1` would send an 0.5 immediately as though it removed the
    // line — skipping the coalescing that would have reached a real 0.
    if (Number(input.value) === 0) {
      this.#fire(input);
      return;
    }

    // Cut short by #flush() when the shopper interacts outside the widget, so
    // this full window only elapses while they are still clicking here.
    this.#timer = setTimeout(() => this.#fire(input), DEBOUNCE_MS);
  }

  #fire(input: HTMLInputElement): void {
    this.#timer = undefined;
    // A render may have dropped the node while the timer was pending; a change
    // event on a detached input reaches nobody.
    if (!input.isConnected) return;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

/**
 * Registering the element is the module's whole setup: each instance subscribes
 * to what it needs in connectedCallback and drops it on disconnect, so there is
 * no registry to keep in sync and nothing to unwind here.
 *
 * No `request-end` subscription anywhere: an element rendered mid-queue applies
 * the busy state from its own connectedCallback, and untouched elements still
 * hold what queue-start gave them.
 */
export function initQuantityElement(): void {
  if (!customElements.get(TAG)) customElements.define(TAG, QuantityElement);
}
