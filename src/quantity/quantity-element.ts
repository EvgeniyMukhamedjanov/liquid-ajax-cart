import { isProcessing, EVENTS } from "../core";

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
const INPUT = 'input[type="number"]:not([step="any" i])';
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
        `Liquid Ajax Cart: <${TAG}> must contain exactly one <input type="number">, found ${inputs.length}.`,
        this,
      );
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

    this.refresh();
  }

  #onQueue = (): void => {
    this.refresh();
  };

  #onChange = (): void => {
    // Any change on this input — a human commit, or our own #fire — means the
    // value has been committed by some route, so a step still sitting in the
    // debounce window is stale. Left armed, it would fire after the newer
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
    // Normally unreachable: clicking a button blurs the input, and the `change`
    // that fires restores the server value before this runs. But macOS Safari
    // and Firefox do not move focus on a button click — the same behaviour that
    // makes `focusout` useless for flushing the debounce — so there the field is
    // still empty when the click arrives.
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
    // It is also the ONLY protection for a local stepper (an input with no
    // identity, as on a product page): its synthetic `change` reaches no cart
    // line, so no request starts, so `isProcessing()` never blocks a further
    // click and the value would walk 0 → -1 → -2. A cart-connected input is
    // also floored by the binding, so there this saves a wasted request.
    if (Number(input.value) < 0) input.value = "0";

    // Native refused to move at all — the value sits on `min` (minus) or `max`
    // (plus). Distinct from the overshoot above, which lands on 0 and removes
    // like any other step to 0; only a refusal needs opting in, and a refusal
    // going down means `min` is above 0.
    // Compared numerically: the browser renormalises the string while refusing
    // to change the number, so `value="06"` under `min="6"` comes back as "6" —
    // a string comparison would read that as movement and skip this branch,
    // leaving remove-at-min inert. Every other comparison here is numeric.
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
    if (Number(input.value) < 1) {
      this.#fire(input);
      return;
    }

    // TODO: nothing flushes this early. See "Early flush of a pending debounce"
    // in V3-QUANTITY.md — v2's focusout approach no-ops on macOS Safari; a
    // module-level pointerdown capture listener is the way to add it.
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
