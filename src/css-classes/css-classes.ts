import type { Endpoint, RequestBody, RequestStartContext, RequestEndContext } from "../core";

const ATTR = "data-ajax-cart-item-css";
const SELECTOR = `[${ATTR}]`;

// Written by this module, never by the merchant — the split from
// `data-ajax-cart-*` is what tells a merchant which names they own. `js-` is
// v2's prefix for a JS-controlled class (`_src-old/const.ts:4`).
const INIT_CLASS = "js-ajax-cart-init";
const BUSY_CLASS = "js-ajax-cart-busy";
const ITEM_BUSY_CLASS = "js-ajax-cart-item-busy";
const ITEM_REMOVING_CLASS = "js-ajax-cart-item-removing";

/** Identity → whether the request addressing it sets the quantity to 0. */
const inFlight = new Map<string, boolean>();

let queueBusy = false;

// `clear` empties the whole cart, so it addresses every element rather than any
// identity. Held as a flag instead of enumerating the page's tokens into
// `inFlight`: enumerating would read the DOM at REQUEST_START, and the render
// that lands before REQUEST_END can change which tokens exist, so the delete
// pass would miss the ones it added.
let clearingAll = false;

/**
 * Adds the init class. Called once at import (`index.ts`), never undone.
 *
 * Not part of `project()`: it reflects that this module loaded, not cart
 * activity, and `<html>` sits outside every fragment so there is nothing to
 * re-assert after a render.
 */
export function markInitialized(): void {
  document.documentElement.classList.add(INIT_CLASS);
}

/** Reads one field across the three body shapes `RequestBody` allows. */
function fieldOf(body: RequestBody | null, name: string): unknown {
  if (body instanceof FormData || body instanceof URLSearchParams) return body.get(name);
  if (body && typeof body === "object") return body[name];
  return null;
}

/**
 * A non-empty trimmed string, or null for anything that cannot address a line.
 * A token list cannot hold whitespace, so a whitespace-only value could never
 * match and is reported as "no identity" rather than as an unmatchable one.
 */
function normalize(raw: unknown): string | null {
  if (raw == null) return null;
  const value = String(raw).trim();
  return value === "" ? null : value;
}

/**
 * Whether a quantity field means "remove this line".
 *
 * `normalize` first so an absent or empty quantity is not a removal — `Number(null)`
 * and `Number("")` are both 0, which would make every body without a quantity
 * look like a deletion. A non-numeric value yields NaN and is not a removal
 * either; Shopify rejects it, and this module does not pre-judge that.
 */
function isRemoval(raw: unknown): boolean {
  const value = normalize(raw);
  return value !== null && Number(value) === 0;
}

/**
 * The `updates` entries of an `update.js` body as `[identity, quantity]` pairs.
 *
 * Two shapes, both reachable, and the positional one is the only place an
 * identity is derived rather than read: an array is 0-indexed while Shopify
 * line numbers are 1-based.
 *
 * - keyed — `{"39…:hash": 0}`, or `updates[39…:hash]=0` when form-encoded. The
 *   key is a line item key or a variant ID.
 * - positional — `[1, 0, 2]`, or repeated `updates[]=1&updates[]=0`, which is
 *   what a serialized cart form posts (`cart-template.liquid:156`). Shopify
 *   requires the array to be the same length as the cart, so position is only a
 *   valid identity for a whole-cart update.
 */
function updateEntries(body: RequestBody | null): Array<[string, unknown]> {
  const entries: Array<[string, unknown]> = [];

  if (body instanceof FormData || body instanceof URLSearchParams) {
    const positional: unknown[] = [];
    // Both are iterable of [name, value]; neither type is assignable to the
    // other, so the shared shape is spelled out rather than narrowed.
    for (const [name, value] of body as Iterable<[string, unknown]>) {
      const match = /^updates\[(.*)\]$/.exec(name);
      if (!match) continue;
      if (match[1] === "") positional.push(value);
      else entries.push([match[1], value]);
    }
    positional.forEach((quantity, index) => entries.push([String(index + 1), quantity]));
    return entries;
  }

  if (body && typeof body === "object") {
    const updates = body.updates;
    if (Array.isArray(updates)) {
      updates.forEach((quantity, index) => entries.push([String(index + 1), quantity]));
    } else if (updates && typeof updates === "object") {
      Object.entries(updates).forEach((entry) => entries.push(entry));
    }
  }

  return entries;
}

/**
 * Every variant ID an `add.js` body addresses.
 *
 * Shapes, in the order they are read:
 *
 * - `{items: [{id, quantity}, …]}` — the only JSON form Shopify documents, and
 *   the only one that can carry several variants in a single request. Per-item
 *   `properties`, `selling_plan` and `parent_id` do not affect identity.
 * - `id=…` form-encoded — what an add-to-cart form posts, which
 *   `product-form.ts:62` forwards verbatim. Also documented.
 * - `{id, quantity}` flat JSON — not documented, accepted in practice, and free
 *   to support since it shares the fallback with the form-encoded read.
 *
 * `items[0][id]` form-encoding is read too. Undocumented, but reachable the same
 * way the bare `id` is: `<ajax-cart-product-form>` sends the merchant's form as
 * built, and multi-item bundle forms name their fields that way.
 *
 * **`items` and a sibling `id` are both read, not one or the other.** A body
 * carrying both is not malformed — Shopify adds every one of them, so there is
 * no precedence to apply. Observed behaviour; the docs do not cover the case.
 * Duplicates collapse anyway, since the caller keys a Map by identity.
 */
function addIdentities(body: RequestBody | null): unknown[] {
  const out: unknown[] = [];

  if (body instanceof FormData || body instanceof URLSearchParams) {
    for (const [name, value] of body as Iterable<[string, unknown]>) {
      if (/^items\[\d+\]\[id\]$/.test(name)) out.push(value);
    }
    out.push(fieldOf(body, "id"));
    return out;
  }

  if (body && typeof body === "object") {
    const items = body.items;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === "object") out.push((item as Record<string, unknown>).id);
      }
    }
    out.push(body.id);
  }

  return out;
}

/**
 * Which lines a request addresses, and whether it removes each one.
 *
 * No cart state is read — everything comes from the body. `clear` returns
 * nothing because it addresses every element rather than an identity; the
 * `clearingAll` flag carries it.
 *
 * The same body yields the same map at REQUEST_START and REQUEST_END, which is
 * what lets the end handler delete exactly what the start handler added.
 */
export function identitiesOf(endpoint: Endpoint, body: RequestBody | null): Map<string, boolean> {
  const out = new Map<string, boolean>();

  if (endpoint === "change") {
    // `line` before `id`: a body carrying both is malformed, and `line` is
    // Shopify's documented default.
    const identity = normalize(fieldOf(body, "line")) ?? normalize(fieldOf(body, "id"));
    if (identity !== null) out.set(identity, isRemoval(fieldOf(body, "quantity")));
    return out;
  }

  if (endpoint === "update") {
    for (const [identity, quantity] of updateEntries(body)) {
      const token = normalize(identity);
      if (token !== null) out.set(token, isRemoval(quantity));
    }
    return out;
  }

  if (endpoint === "add") {
    // Variant IDs, which match only an element carrying one as its own token.
    // An add of a variant not in the cart matches nothing, by design. Never a
    // removal — `add` cannot delete a line.
    for (const raw of addIdentities(body)) {
      const identity = normalize(raw);
      if (identity !== null) out.set(identity, false);
    }
    return out;
  }

  // `clear` (flag-driven) and `get` (reads nothing).
  return out;
}

/**
 * One selector matching every element whose token list contains any of these
 * identities. Empty string when there are none — `querySelectorAll("")` throws,
 * so callers must check before using it.
 *
 * `CSS.escape` is required, not defensive: the identity comes from the request
 * body, so `change({ id: 'weird"value' })` would otherwise close the quote and
 * throw a SyntaxError out of the event handler.
 */
function selectorFor(identities: Iterable<string>): string {
  return [...identities].map((id) => `[${ATTR}~="${CSS.escape(id)}"]`).join(",");
}

/**
 * Re-derives every class from `queueBusy`, `inFlight` and `clearingAll`.
 *
 * **Fully derived, never incremental**, so it is idempotent and safe to run at
 * any time. Required rather than stylistic: `apply-content.ts:16` calls
 * `replaceChildren` on the fragment target, so every element inside a fragment
 * is a new node after each reconciling request and the classes have to be
 * re-asserted onto it.
 *
 * Matching is delegated to `~=` through `Element.matches` rather than tokenized
 * here. One `querySelectorAll` either way, but the browser's token splitting is
 * the definition — hand-rolling it would mean reimplementing ASCII whitespace
 * exactly, and JS `\s` is not that (it treats NBSP as a separator, `~=` does not).
 *
 * Writes only classes: never children, never other attributes.
 */
export function project(root: ParentNode = document): void {
  document.documentElement.classList.toggle(BUSY_CLASS, queueBusy);

  const busySelector = clearingAll ? SELECTOR : selectorFor(inFlight.keys());
  const removingSelector = clearingAll
    ? SELECTOR
    : selectorFor([...inFlight].filter(([, removing]) => removing).map(([identity]) => identity));

  root.querySelectorAll(SELECTOR).forEach((element) => {
    // `removing` implies `busy`: every removing identity is also an in-flight
    // one, so the invariant holds without being asserted separately.
    element.classList.toggle(ITEM_BUSY_CLASS, busySelector !== "" && element.matches(busySelector));
    element.classList.toggle(
      ITEM_REMOVING_CLASS,
      removingSelector !== "" && element.matches(removingSelector),
    );
  });
}

export function handleRequestStart(detail: RequestStartContext): void {
  if (detail.endpoint === "clear") clearingAll = true;
  identitiesOf(detail.endpoint, detail.body).forEach((removing, identity) => {
    inFlight.set(identity, removing);
  });
  project();
}

export function handleRequestEnd(detail: RequestEndContext): void {
  if (detail.endpoint === "clear") clearingAll = false;
  identitiesOf(detail.endpoint, detail.body).forEach((_removing, identity) => {
    inFlight.delete(identity);
  });
  project();
}

export function handleQueueStart(): void {
  queueBusy = true;
  project();
}

/**
 * A drained queue means nothing is running, so any surviving entry is stale by
 * definition — clearing here is an invariant, not a precaution.
 *
 * It also closes the only route to a permanently stuck class: `api.ts:234` calls
 * `onEnd` outside a `finally`, so a throw between `onStart` (`:195`) and it
 * would skip REQUEST_END entirely. Unreachable today, since every path between
 * the two is caught, but this makes it self-healing rather than permanent.
 */
export function handleQueueIdle(): void {
  queueBusy = false;
  clearingAll = false;
  inFlight.clear();
  project();
}

/** Test seam only — the handlers own this state in production. */
export function resetForTests(): void {
  queueBusy = false;
  clearingAll = false;
  inFlight.clear();
}
