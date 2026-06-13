import type { RequestResult } from "../core";

// Default shown when a failed request carries no usable error text.
// When a settings source exists, this becomes the fallback default.
const FALLBACK_TEXT = "We couldn't update your cart. Please try again.";

const SLOT_ATTR = "data-ajax-cart-product-form-error";
const SLOT_FOR_ATTR = "data-ajax-cart-product-form-error-for";
const INPUT_ATTR = "data-ajax-cart-product-form-input";

// ---- element association ---------------------------------------------------
//
// A slot/input belongs to the form by one of two rules:
//   1. out-of-tree, by id — carries an explicit pointer matching the form id
//      (`…-error-for="<id>"` on slots, native `form="<id>"` on inputs);
//   2. in-tree, by containment — nested in the wrapper with no explicit pointer.
// Discovery is attribute-keyed, never `form.elements`, so render and clear
// always operate on the identical set (no aria-invalid leaks).

// In-tree (no explicit pointer) and out-of-tree (pointer === form id) results are
// disjoint by construction — `:not([…-for])` excludes everything the id query matches —
// so the two sets concatenate without any dedup.
function collectSlots(wrapper: HTMLElement, formId: string): Element[] {
  const inTree = wrapper.querySelectorAll(`[${SLOT_ATTR}]:not([${SLOT_FOR_ATTR}])`);
  if (!formId) return [...inTree];
  return [
    ...inTree,
    ...document.querySelectorAll(`[${SLOT_ATTR}][${SLOT_FOR_ATTR}="${CSS.escape(formId)}"]`),
  ];
}

function collectInputs(wrapper: HTMLElement, formId: string): Element[] {
  const inTree = wrapper.querySelectorAll(`[${INPUT_ATTR}]:not([form])`);
  if (!formId) return [...inTree];
  return [...inTree, ...document.querySelectorAll(`[${INPUT_ATTR}][form="${CSS.escape(formId)}"]`)];
}

function formIdOf(wrapper: HTMLElement): string {
  return wrapper.querySelector("form")?.id ?? "";
}

// ---- rendering -------------------------------------------------------------

function renderMessages(slot: Element, messages: string[]): void {
  slot.replaceChildren();
  messages.forEach((msg, i) => {
    if (i > 0) slot.appendChild(document.createElement("br"));
    const span = document.createElement("span");
    span.textContent = msg;
    slot.appendChild(span);
  });
}

function splitSlots(slots: Element[]): {
  keyed: Map<string, Element[]>;
  catchAll: Element[];
} {
  const keyed = new Map<string, Element[]>();
  const catchAll: Element[] = [];
  for (const slot of slots) {
    const key = slot.getAttribute(SLOT_ATTR) ?? "";
    if (key === "") {
      catchAll.push(slot);
    } else {
      const list = keyed.get(key) ?? [];
      list.push(slot);
      keyed.set(key, list);
    }
  }
  return { keyed, catchAll };
}

// ---- response shape parsing ------------------------------------------------

/** A non-array object with at least one key, or null. Empty objects are not usable. */
function asObjectSource(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return Object.keys(value).length > 0 ? (value as Record<string, unknown>) : null;
  }
  return null;
}

/** A non-empty string, or null. */
function asStringSource(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toMessages(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).map((v) => String(v));
}

// ---- public API ------------------------------------------------------------

export function clearErrors(element: HTMLElement): void {
  const formId = formIdOf(element);
  collectSlots(element, formId).forEach((slot) => {
    slot.textContent = "";
  });
  collectInputs(element, formId).forEach((input) => {
    input.removeAttribute("aria-invalid");
  });
}

export function renderErrors(element: HTMLElement, result: RequestResult): void {
  if (!element.isConnected) return;

  const formId = formIdOf(element);
  const { keyed, catchAll } = splitSlots(collectSlots(element, formId));

  const body = result.body as Record<string, unknown> | null;

  // Precedence: object errors → object description → string errors →
  // string description → string message → fallback. Empty objects fall through.
  const objectSource = asObjectSource(body?.errors) ?? asObjectSource(body?.description);

  if (objectSource) {
    const inputs = collectInputs(element, formId);
    const unmatched: string[] = [];

    for (const [key, raw] of Object.entries(objectSource)) {
      const messages = toMessages(raw);
      const slots = keyed.get(key);
      if (slots && slots.length > 0) {
        slots.forEach((slot) => renderMessages(slot, messages));
      } else {
        unmatched.push(...messages);
      }
      inputs
        .filter((input) => input.getAttribute(INPUT_ATTR) === key)
        .forEach((input) => input.setAttribute("aria-invalid", "true"));
    }

    if (unmatched.length > 0) {
      catchAll.forEach((slot) => renderMessages(slot, unmatched));
    }
    return;
  }

  const text =
    asStringSource(body?.errors) ??
    asStringSource(body?.description) ??
    asStringSource(body?.message) ??
    FALLBACK_TEXT;

  catchAll.forEach((slot) => renderMessages(slot, [text]));
}
