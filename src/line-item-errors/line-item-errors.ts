import type { RequestBody, RequestResult, RequestStartContext, RequestEndContext } from "../core";

const ATTR = "data-ajax-cart-item-error";
const SELECTOR = `[${ATTR}]`;

// Shown when a failed request carries no usable error text. Duplicated from
// product-form-errors.ts rather than shared: modules never import each other.
// When a settings module exists, both become defaults reading one override.
const FALLBACK_TEXT = "We couldn't update your cart. Please try again.";

/**
 * The identifier the request addressed the line by — `line` index or `id` key,
 * whichever the body carries.
 *
 * `line` is checked first: a body carrying both is malformed, and `line` is
 * Shopify's documented default. The three body shapes match the union
 * `injectSections` already handles in sections.ts.
 */
export function identityOf(body: RequestBody | null): string | null {
  if (body instanceof FormData || body instanceof URLSearchParams) {
    return normalize(body.get("line") ?? body.get("id"));
  }
  if (body && typeof body === "object") {
    return normalize(body.line ?? body.id);
  }
  return null;
}

/**
 * `null` for anything that cannot address a line: absent, or empty once
 * trimmed. A token list cannot hold whitespace, so a value that is only
 * whitespace could never match a slot — reporting it as "no identity" keeps
 * the no-match warning for genuine mismatches.
 */
function normalize(raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  return value === "" ? null : value;
}

/**
 * Every slot whose token list contains this identity. A slot may carry both a
 * line index and an item key — see V3-LINE-ITEM-ERRORS.md for why both.
 *
 * `CSS.escape` is required, not defensive: the identity comes from the request
 * body, so `change({ id: 'weird"value' })` would otherwise close the quote and
 * throw a SyntaxError out of the event handler.
 *
 * `~=` semantics — empty and whitespace-bearing values never match, and NBSP is
 * not a separator — are pinned by the slotsFor tests.
 */
export function slotsFor(identity: string, root: ParentNode = document): Element[] {
  return [...root.querySelectorAll(`[${ATTR}~="${CSS.escape(identity)}"]`)];
}

/** A non-empty string, or null. Empty values fall through to the next rung. */
function asText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/**
 * `description` → `message` → fallback.
 *
 * `description` outranks `message` because two response generations are in
 * circulation with no version flag: the older sets `message` to the constant
 * "Cart Error" and puts the real text in `description`, the newer duplicates
 * the same text into both. Preferring `message` would render "Cart Error" to
 * shoppers on old-shape stores; preferring `description` costs nothing.
 *
 * `errors` is not read. No captured change.js failure carries it — unlike
 * add.js, where it is object-shaped and drives per-field routing.
 *
 * Whatever this returns is rendered verbatim. Some responses are addressed to
 * developers rather than shoppers ("expected String to be a Integer: quantity"),
 * and nothing in the response separates the two: `body.status` is polymorphic
 * (422, 404, "bad_request", "unprocessable_entity" — the first and last being
 * the same status in two spellings) and both audiences appear under 422.
 * Anything finer would mean pattern-matching English.
 */
export function errorTextFrom(result: RequestResult): string {
  const body = result.body;
  return asText(body?.description) ?? asText(body?.message) ?? FALLBACK_TEXT;
}

export function handleRequestStart(detail: RequestStartContext): void {
  if (detail.endpoint !== "change") return;
  const identity = identityOf(detail.body);
  if (identity === null) return;
  slotsFor(identity).forEach((slot) => {
    slot.textContent = "";
  });
}

export function handleRequestEnd(detail: RequestEndContext): void {
  const { endpoint, body, result } = detail;
  if (endpoint !== "change" || result.ok) return;

  // Nobody needs to be told about a request they themselves called off.
  if (result.cancelled) return;

  const identity = identityOf(body);
  if (identity === null) return;

  const slots = slotsFor(identity);

  if (slots.length === 0) {
    // Only when the merchant has adopted the module somewhere — a theme with no
    // slots at all is not misconfigured, it just does not use this feature.
    if (document.querySelector(SELECTOR)) {
      console.warn(
        `Liquid Ajax Cart: a failed cart/change.js request for "${identity}" matched no "${ATTR}" slot. ` +
          `The slot's value must contain the same identifier the request sends.`,
      );
    }
    return;
  }

  const text = errorTextFrom(result);
  slots.forEach((slot) => {
    slot.textContent = text;
  });
}
