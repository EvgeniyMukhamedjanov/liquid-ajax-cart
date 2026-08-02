import { change, isProcessing, EVENTS } from "../core";

const ATTR = "data-ajax-cart-quantity-input";

export type Identity = { key: "line" | "id"; value: string };

// Shopify line indices are 1-based integers; item keys are always
// `variantId:hash`. The two languages are disjoint, so the check is decidable —
// unlike v2's `length > 3` heuristic, under which line="1000" became a key.
export function parseIdentity(raw: string): Identity | null {
  const value = raw.trim();
  if (/^[1-9][0-9]*$/.test(value)) return { key: "line", value };
  if (value.includes(":")) return { key: "id", value };
  return null;
}

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
  // No restore here. `readOnly` blocks new edits but does not suppress the
  // `change` for an edit made *before* the lock, so this branch is reached by
  // ordinary commits too — Enter then blur, or a blur while the queue is
  // already busy. Restoring would repaint the server value over an edit whose
  // own request is still in flight, snapping the shopper's 5 back to 2.
  //
  // A genuinely dropped step needs no restore either: the queue is busy, so a
  // request is in flight, and every request ends in a section render that
  // replaces this control with server truth.
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
  // hooks (including the sections render) before resolving. The only failure
  // that leaves the node in place is one that rendered nothing.
  if (!result.ok && control.isConnected) restore(control);
}

/**
 * A quantity control is an `input[type="number"]`, matching what the stepper
 * element requires of the input it steps. Anything else carrying the marker is
 * reported: a `<textarea>`, a wrapper, or a `type="text"` input would otherwise
 * fail silently here while the element reported it, so the two halves would
 * disagree about the same markup.
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
  return control;
}

export function handleChange(event: Event): void {
  const control = controlFrom(event.target);
  if (control) void commit(control);
}

export function handleKeydown(event: KeyboardEvent): void {
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
}
