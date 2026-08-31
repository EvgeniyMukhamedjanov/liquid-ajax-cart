import { change, isProcessing, EVENTS, parseIdentity } from "../core";

const ATTR = "data-ajax-cart-remove";

/**
 * Sends `change.js` with `quantity=0` for the line `control` identifies.
 *
 * No restore, no no-op guard, no failure-resync: unlike quantity-input.ts's
 * commit(), this control holds no persistent value to keep honest — a failed
 * request just leaves the element as it was, and a removed line's node (this
 * control included) is gone from the DOM once the render lands.
 */
export async function commit(control: Element): Promise<void> {
  // Dropped, not queued: a body built from a `line` index and sent after
  // another mutation would address the wrong item, since removing or adding a
  // line shifts every index after it. Same reasoning as quantity-input.ts.
  if (isProcessing()) return;

  const identity = parseIdentity(control.getAttribute(ATTR) ?? "");
  if (!identity) {
    // Reported on every attempt, not deduped — bounded by user action (one
    // click, one report), and a per-node guard would not survive a render
    // anyway. Same convention as quantity-input.ts's commit().
    console.error(
      `Liquid Ajax Cart: "${ATTR}" must be a line index (1, 2, 3…) or a line item key (containing ":").`,
      control,
    );
    return;
  }

  const body = new FormData();
  body.set(identity.key, identity.value);
  body.set("quantity", "0");

  await change(body, { trigger: { source: "remove", initiator: control } });
}

function handleClick(event: Event): void {
  // `Element`, not `HTMLElement`: an icon (<svg>, <path>) inside the marker
  // extends Element only. Same narrowing as quantity-element.ts's #onClick.
  const target = event.target;
  if (!(target instanceof Element)) return;

  const control = target.closest(`[${ATTR}]`);
  if (!control) return;

  event.preventDefault(); // the href is a no-JS fallback, not decoration
  void commit(control);
}

/**
 * `aria-disabled` on every marked control, owned unconditionally by this
 * module — never `disabled`, since disabling blurs a focused element and no
 * path guarantees a replacing render afterwards.
 */
export function applyBusyState(): void {
  const busy = isProcessing();
  document.querySelectorAll(`[${ATTR}]`).forEach((control) => {
    if (busy) control.setAttribute("aria-disabled", "true");
    else control.removeAttribute("aria-disabled");
  });
}

/**
 * Pure registration — no side effects, so no idempotence flag is needed:
 * addEventListener ignores a repeat of the same (type, callback, capture)
 * triple, and every handler here is a stable module-level reference.
 */
export function initRemove(): void {
  document.addEventListener("click", handleClick);

  // queue-idle, not queue-end: queue.ts clears #running only after the
  // queue-end hook, so isProcessing() still reads true throughout it.
  document.addEventListener(EVENTS.QUEUE_START, applyBusyState);
  document.addEventListener(EVENTS.REQUEST_END, applyBusyState);
  document.addEventListener(EVENTS.QUEUE_IDLE, applyBusyState);
}
