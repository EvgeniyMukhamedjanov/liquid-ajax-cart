import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  markInitialized,
  identitiesOf,
  project,
  handleRequestStart,
  handleRequestEnd,
  handleQueueStart,
  handleQueueIdle,
  resetForTests,
} from "./css-classes";
import type { RequestBody, RequestStartContext, RequestEndContext } from "../core";

// Must match the constants inside css-classes.ts. Duplicated rather than
// imported so a rename has to be made deliberately in both places: these are
// the module's public contract, and a test that renames itself alongside the
// source would not notice the contract breaking.
const ATTR = "data-ajax-cart-item-css";
const INIT = "js-ajax-cart-init";
const BUSY = "js-ajax-cart-busy";
const ITEM_BUSY = "js-ajax-cart-item-busy";
const ITEM_REMOVING = "js-ajax-cart-item-removing";

const KEY = "39897499729985:b1fca88d0e8bf5290f306f808785f744";
const VARIANT = "39897499729985";

let mounted: HTMLElement[] = [];
function mount(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}

beforeEach(() => {
  resetForTests();
});

afterEach(() => {
  mounted.forEach((el) => el.remove());
  mounted = [];
  resetForTests();
  document.documentElement.classList.remove(INIT, BUSY);
});

function formBody(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

function startCtx(over: Partial<RequestStartContext> = {}): RequestStartContext {
  return {
    endpoint: "change",
    body: new FormData(),
    meta: {},
    abort: () => {},
    ...over,
  } as RequestStartContext;
}

function endCtx(over: Partial<RequestEndContext> = {}): RequestEndContext {
  return {
    endpoint: "change",
    body: new FormData(),
    meta: {},
    result: { ok: true, status: 200, body: null, cancelled: false },
    ...over,
  } as RequestEndContext;
}

/** `identitiesOf`, entries sorted so assertions do not depend on insertion order. */
function sortedIdentitiesOf(
  endpoint: Parameters<typeof identitiesOf>[0],
  body: RequestBody | null,
) {
  return [...identitiesOf(endpoint, body)].sort(([a], [b]) => a.localeCompare(b));
}

// =============================================================================
// markInitialized
// =============================================================================

describe("markInitialized", () => {
  it("adds the init class to <html>", () => {
    expect(document.documentElement.classList.contains(INIT)).toBe(false);
    markInitialized();
    expect(document.documentElement.classList.contains(INIT)).toBe(true);
  });

  it("is idempotent", () => {
    markInitialized();
    markInitialized();
    expect(document.documentElement.className.match(new RegExp(INIT, "g"))).toHaveLength(1);
  });

  it("is not touched by project()", () => {
    markInitialized();
    project();
    expect(document.documentElement.classList.contains(INIT)).toBe(true);
  });
});

// =============================================================================
// identitiesOf — change
// =============================================================================

// The plain-FormData reads are deliberately absent: breaking that branch of
// `fieldOf` fails 24 tests across the DOM-level groups, so asserting it here
// documents the body shape without adding coverage. Every case below is one
// that nothing else in the suite catches.
describe("identitiesOf — change", () => {
  it("reads line from URLSearchParams", () => {
    expect(sortedIdentitiesOf("change", new URLSearchParams("line=2&quantity=1"))).toEqual([
      ["2", false],
    ]);
  });

  it("reads line from a plain object", () => {
    expect(sortedIdentitiesOf("change", { line: 2, quantity: 1 })).toEqual([["2", false]]);
  });

  it("prefers line over id when a malformed body carries both", () => {
    expect(sortedIdentitiesOf("change", formBody({ line: "3", id: KEY, quantity: "1" }))).toEqual([
      ["3", false],
    ]);
  });

  it("marks removing when quantity is the string 0", () => {
    expect(sortedIdentitiesOf("change", formBody({ line: "1", quantity: "0" }))).toEqual([
      ["1", true],
    ]);
  });

  it("marks removing when quantity is the number 0", () => {
    expect(sortedIdentitiesOf("change", { line: 1, quantity: 0 })).toEqual([["1", true]]);
  });

  it("does not mark removing when quantity is absent", () => {
    // Number(null) is 0 — the guard against reading every quantity-less body as
    // a deletion.
    expect(sortedIdentitiesOf("change", formBody({ line: "1" }))).toEqual([["1", false]]);
  });

  it("does not mark removing when quantity is empty", () => {
    expect(sortedIdentitiesOf("change", formBody({ line: "1", quantity: "" }))).toEqual([
      ["1", false],
    ]);
  });

  it("does not mark removing when quantity is not a number", () => {
    expect(sortedIdentitiesOf("change", formBody({ line: "1", quantity: "abc" }))).toEqual([
      ["1", false],
    ]);
  });

  it("yields nothing for a body with no addressing field", () => {
    expect(sortedIdentitiesOf("change", formBody({ quantity: "1" }))).toEqual([]);
  });

  it("yields nothing for a whitespace-only identity", () => {
    expect(sortedIdentitiesOf("change", formBody({ line: "   ", quantity: "1" }))).toEqual([]);
  });

  it("yields nothing for a null body", () => {
    expect(sortedIdentitiesOf("change", null)).toEqual([]);
  });
});

// =============================================================================
// identitiesOf — update
// =============================================================================

describe("identitiesOf — update", () => {
  it("reads the keyed object form", () => {
    expect(sortedIdentitiesOf("update", { updates: { [KEY]: 0, "other:hash": 2 } })).toEqual([
      [KEY, true],
      ["other:hash", false],
    ]);
  });

  it("reads the positional array form as 1-based line numbers", () => {
    expect(sortedIdentitiesOf("update", { updates: [1, 0, 2] })).toEqual([
      ["1", false],
      ["2", true],
      ["3", false],
    ]);
  });

  it("reads the form-encoded keyed form", () => {
    expect(sortedIdentitiesOf("update", formBody({ [`updates[${KEY}]`]: "0" }))).toEqual([
      [KEY, true],
    ]);
  });

  it("reads the form-encoded positional form in order", () => {
    const fd = new FormData();
    fd.append("updates[]", "1");
    fd.append("updates[]", "0");
    expect(sortedIdentitiesOf("update", fd)).toEqual([
      ["1", false],
      ["2", true],
    ]);
  });

  it("resolves a variant-ID key through the same path", () => {
    expect(sortedIdentitiesOf("update", { updates: { [VARIANT]: 0 } })).toEqual([[VARIANT, true]]);
  });

  it("ignores non-updates fields", () => {
    expect(
      sortedIdentitiesOf("update", formBody({ note: "hi", "attributes[gift]": "yes" })),
    ).toEqual([]);
  });

  it("yields nothing when updates is absent", () => {
    expect(sortedIdentitiesOf("update", {})).toEqual([]);
  });
});

// =============================================================================
// identitiesOf — add, clear, get
// =============================================================================

describe("identitiesOf — add, clear, get", () => {
  const VARIANT_B = "41234567890123";

  it("reads every variant from the JSON items array", () => {
    // Shopify's primary documented add.js shape, and the only one that can
    // carry several variants in one request.
    expect(
      sortedIdentitiesOf("add", {
        items: [
          { id: VARIANT, quantity: 1 },
          { id: VARIANT_B, quantity: 2 },
        ],
      }),
      // Order is sortedIdentitiesOf's, not the body's: "39…" sorts before "41…".
    ).toEqual([
      [VARIANT, false],
      [VARIANT_B, false],
    ]);
  });

  it("reads a single-item items array", () => {
    expect(sortedIdentitiesOf("add", { items: [{ id: VARIANT, quantity: 2 }] })).toEqual([
      [VARIANT, false],
    ]);
  });

  it("marks nothing as removing even when an items entry has quantity 0", () => {
    expect(sortedIdentitiesOf("add", { items: [{ id: VARIANT, quantity: 0 }] })).toEqual([
      [VARIANT, false],
    ]);
  });

  it("yields nothing for an empty items array", () => {
    expect(sortedIdentitiesOf("add", { items: [] })).toEqual([]);
  });

  it("skips an items entry carrying no id", () => {
    expect(sortedIdentitiesOf("add", { items: [{ quantity: 1 }, { id: VARIANT }] })).toEqual([
      [VARIANT, false],
    ]);
  });

  it("reads both items and a sibling top-level id", () => {
    // Not an either/or: Shopify adds every one of them, so there is no
    // precedence to apply and neither may be dropped.
    expect(sortedIdentitiesOf("add", { id: "99999", items: [{ id: VARIANT }] })).toEqual([
      [VARIANT, false],
      ["99999", false],
    ]);
  });

  it("reads both bracket-indexed items and a sibling id when form-encoded", () => {
    const fd = new FormData();
    fd.append("items[0][id]", VARIANT);
    fd.append("id", "99999");
    expect(sortedIdentitiesOf("add", fd)).toEqual([
      [VARIANT, false],
      ["99999", false],
    ]);
  });

  it("collapses a duplicate identity appearing in both places", () => {
    expect(sortedIdentitiesOf("add", { id: VARIANT, items: [{ id: VARIANT }] })).toEqual([
      [VARIANT, false],
    ]);
  });

  it("reads bracket-indexed form-encoded items", () => {
    const fd = new FormData();
    fd.append("items[0][id]", VARIANT);
    fd.append("items[0][quantity]", "1");
    fd.append("items[1][id]", VARIANT_B);
    fd.append("items[1][quantity]", "3");
    expect(sortedIdentitiesOf("add", fd)).toEqual([
      [VARIANT, false],
      [VARIANT_B, false],
    ]);
  });

  it("ignores an items[N][quantity] field with no matching id", () => {
    const fd = new FormData();
    fd.append("items[0][quantity]", "1");
    expect(sortedIdentitiesOf("add", fd)).toEqual([]);
  });

  it("reads the flat JSON form", () => {
    expect(sortedIdentitiesOf("add", { id: VARIANT, quantity: 2 })).toEqual([[VARIANT, false]]);
  });

  it("reads a flat id with no quantity", () => {
    // Shopify accepts this and adds 1. Not in the docs, but the quantity is
    // irrelevant to this module either way — an add is never a removal, so the
    // only thing that matters is that the identity is still found.
    expect(sortedIdentitiesOf("add", { id: VARIANT })).toEqual([[VARIANT, false]]);
  });

  it("reads a form-encoded id with no quantity", () => {
    expect(sortedIdentitiesOf("add", formBody({ id: VARIANT }))).toEqual([[VARIANT, false]]);
  });

  it("reads an items entry with no quantity", () => {
    expect(sortedIdentitiesOf("add", { items: [{ id: VARIANT }] })).toEqual([[VARIANT, false]]);
  });

  it("reads the variant ID from an add", () => {
    expect(sortedIdentitiesOf("add", formBody({ id: VARIANT, quantity: "1" }))).toEqual([
      [VARIANT, false],
    ]);
  });

  it("never marks an add as removing, even at quantity 0", () => {
    expect(sortedIdentitiesOf("add", formBody({ id: VARIANT, quantity: "0" }))).toEqual([
      [VARIANT, false],
    ]);
  });

  it("yields nothing for an add with no variant", () => {
    expect(sortedIdentitiesOf("add", formBody({ quantity: "1" }))).toEqual([]);
  });

  it("yields nothing for clear — the flag drives it", () => {
    expect(sortedIdentitiesOf("clear", null)).toEqual([]);
  });

  it("yields nothing for get", () => {
    expect(sortedIdentitiesOf("get", null)).toEqual([]);
  });
});

// =============================================================================
// project — matching
// =============================================================================

describe("project — matching", () => {
  it("marks an element whose token list contains the identity", () => {
    const root = mount(`<div ${ATTR}="2 ${KEY} ${VARIANT}"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "2", quantity: "1" }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("matches on the variant-ID token for a change addressed by variant ID", () => {
    // `change.js` documents `id` as either a line item key OR a variant ID, so
    // this is a first-class shape, not merchant improvisation.
    const root = mount(`<div ${ATTR}="2 ${KEY} ${VARIANT}"></div>`);
    handleRequestStart(startCtx({ body: { id: VARIANT, quantity: 3 } }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("matches on the item key token", () => {
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    handleRequestStart(startCtx({ body: formBody({ id: KEY, quantity: "1" }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("matches on the variant-ID token for an add", () => {
    const root = mount(`<div ${ATTR}="2 ${KEY} ${VARIANT}"></div>`);
    handleRequestStart(startCtx({ endpoint: "add", body: formBody({ id: VARIANT }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("leaves an element alone when no token matches", () => {
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "5", quantity: "1" }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("does NOT match a variant ID against the item key's prefix", () => {
    // The reason the variant ID must be written as its own token: `~=` is exact
    // token match, and deriving from `variantId:hash` is explicitly rejected.
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    handleRequestStart(startCtx({ endpoint: "add", body: formBody({ id: VARIANT }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("marks each line of a multi-item add", () => {
    const other = "41234567890123";
    const root = mount(
      `<div ${ATTR}="1 ${VARIANT}"></div><div ${ATTR}="2 ${other}"></div><div ${ATTR}="3 55555"></div>`,
    );
    handleRequestStart(
      startCtx({
        endpoint: "add",
        body: { items: [{ id: VARIANT, quantity: 1 }, { id: other }] },
      }),
    );
    const [a, b, c] = [...root.querySelectorAll(`[${ATTR}]`)];
    expect(a.classList.contains(ITEM_BUSY)).toBe(true);
    expect(b.classList.contains(ITEM_BUSY)).toBe(true);
    expect(c.classList.contains(ITEM_BUSY)).toBe(false);
    expect(root.querySelectorAll(`.${ITEM_REMOVING}`)).toHaveLength(0);
  });

  it("marks every element sharing the identity", () => {
    const root = mount(`<div ${ATTR}="1 ${VARIANT}"></div><div ${ATTR}="2 ${VARIANT}"></div>`);
    handleRequestStart(startCtx({ endpoint: "add", body: formBody({ id: VARIANT }) }));
    expect(root.querySelectorAll(`.${ITEM_BUSY}`)).toHaveLength(2);
  });

  it("never matches an empty or whitespace-bearing value", () => {
    const root = mount(`<div ${ATTR}=""></div><div ${ATTR}="   "></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    expect(root.querySelectorAll(`.${ITEM_BUSY}`)).toHaveLength(0);
  });

  it("does not treat a non-breaking space as a token separator", () => {
    // JS `\s` would split here; ASCII-whitespace tokenizing, which `~=` uses,
    // does not. Delegating to Element.matches is what keeps these in step.
    const nbsp = String.fromCharCode(160);
    const root = mount(`<div ${ATTR}="1${nbsp}2"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("tokenizes across a newline, as `~=` does", () => {
    const root = mount(`<div ${ATTR}="1\n  ${KEY}"></div>`);
    handleRequestStart(startCtx({ body: formBody({ id: KEY, quantity: "1" }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("survives an identity containing selector metacharacters", () => {
    // Set via setAttribute, not innerHTML: a `"` in markup would close the
    // attribute and never reach the DOM as part of the value.
    const nasty = 'weird"value';
    const root = mount(`<div></div>`);
    const el = root.firstElementChild!;
    el.setAttribute(ATTR, nasty);

    expect(() => handleRequestStart(startCtx({ body: { id: nasty, quantity: 1 } }))).not.toThrow();
    expect(el.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("only touches elements inside the given root", () => {
    const inside = mount(`<div ${ATTR}="1"></div>`);
    const outside = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    outside.firstElementChild!.classList.remove(ITEM_BUSY);

    project(inside);

    expect(inside.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
    expect(outside.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });
});

// =============================================================================
// project — removing
// =============================================================================

describe("project — removing", () => {
  it("marks removing at quantity 0", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "0" }) }));
    const el = root.firstElementChild!;
    expect(el.classList.contains(ITEM_REMOVING)).toBe(true);
    expect(el.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("never sets removing without busy", () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="2"></div>`);
    handleRequestStart(startCtx({ endpoint: "update", body: { updates: { 1: 0, 2: 5 } } }));
    root.querySelectorAll(`[${ATTR}]`).forEach((el) => {
      if (el.classList.contains(ITEM_REMOVING)) {
        expect(el.classList.contains(ITEM_BUSY)).toBe(true);
      }
    });
  });

  it("marks only the zeroed line of a multi-line update", () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="2"></div>`);
    handleRequestStart(startCtx({ endpoint: "update", body: { updates: [0, 4] } }));
    const [first, second] = [...root.querySelectorAll(`[${ATTR}]`)];
    expect(first.classList.contains(ITEM_REMOVING)).toBe(true);
    expect(second.classList.contains(ITEM_BUSY)).toBe(true);
    expect(second.classList.contains(ITEM_REMOVING)).toBe(false);
  });

  it("marks every element removing during a clear", () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="${KEY}"></div>`);
    handleRequestStart(startCtx({ endpoint: "clear", body: null }));
    expect(root.querySelectorAll(`.${ITEM_REMOVING}`)).toHaveLength(2);
    expect(root.querySelectorAll(`.${ITEM_BUSY}`)).toHaveLength(2);
  });

  it("releases every element when the clear ends", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ endpoint: "clear", body: null }));
    handleRequestEnd(endCtx({ endpoint: "clear", body: null }));
    expect(root.querySelectorAll(`.${ITEM_REMOVING}`)).toHaveLength(0);
    expect(root.querySelectorAll(`.${ITEM_BUSY}`)).toHaveLength(0);
  });
});

// =============================================================================
// project — derived, not incremental
// =============================================================================

describe("project — derived, not incremental", () => {
  it("is idempotent", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "0" }) }));
    const before = root.firstElementChild!.className;
    project();
    expect(root.firstElementChild!.className).toBe(before);
    project();
    expect(root.firstElementChild!.className).toBe(before);
  });

  it("re-asserts onto a node that replaced the original", () => {
    // What sections does on every reconciling request: replaceChildren swaps the
    // node, so the class has to come back from state rather than be preserved.
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);

    root.replaceChildren();
    root.innerHTML = `<div ${ATTR}="1"></div>`;
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);

    project();
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("strips a class the merchant's markup shipped with", () => {
    const root = mount(`<div ${ATTR}="1" class="${ITEM_BUSY}"></div>`);
    project();
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("leaves the merchant's own classes untouched", () => {
    const root = mount(`<div ${ATTR}="1" class="line-item featured"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    handleRequestEnd(endCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    expect(root.firstElementChild!.className).toBe("line-item featured");
  });

  it("writes no attributes and no children", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "0" }) }));
    const el = root.firstElementChild!;
    expect(el.childNodes).toHaveLength(0);
    expect([...el.attributes].map((a) => a.name).sort()).toEqual([ATTR, "class"].sort());
  });
});

// =============================================================================
// Lifecycle
// =============================================================================

describe("lifecycle", () => {
  it("clears the class when the request ends", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    const body = formBody({ line: "1", quantity: "0" });
    handleRequestStart(startCtx({ body }));
    handleRequestEnd(endCtx({ body }));
    const el = root.firstElementChild!;
    expect(el.classList.contains(ITEM_BUSY)).toBe(false);
    expect(el.classList.contains(ITEM_REMOVING)).toBe(false);
  });

  it("releases the class when the request failed", () => {
    // handleRequestEnd never reads detail.result — release is unconditional, not
    // a success branch. Without this the whole failure path rests on the two
    // end-to-end tests.
    const root = mount(`<div ${ATTR}="1"></div>`);
    const failed = formBody({ line: "1", quantity: "0" });
    handleRequestStart(startCtx({ body: failed }));
    expect(root.firstElementChild!.classList.contains(ITEM_REMOVING)).toBe(true);

    handleRequestEnd(
      endCtx({
        body: failed,
        result: { ok: false, status: 422, body: null, cancelled: false },
      }),
    );

    const el = root.firstElementChild!;
    expect(el.classList.contains(ITEM_REMOVING)).toBe(false);
    expect(el.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("releases the class when the request was cancelled", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    const cancelled = formBody({ line: "1", quantity: "0" });
    handleRequestStart(startCtx({ body: cancelled }));

    handleRequestEnd(
      endCtx({
        body: cancelled,
        result: { ok: false, status: null, body: null, cancelled: true },
      }),
    );

    expect(root.firstElementChild!.classList.contains(ITEM_REMOVING)).toBe(false);
  });

  it("leaves other lines untouched across a request", () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="2"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "1" }) }));
    const [, second] = [...root.querySelectorAll(`[${ATTR}]`)];
    expect(second.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("sets and clears the global busy class", () => {
    handleQueueStart();
    expect(document.documentElement.classList.contains(BUSY)).toBe(true);
    handleQueueIdle();
    expect(document.documentElement.classList.contains(BUSY)).toBe(false);
  });

  it("drops a stale identity on idle, so a missed request-end self-heals", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "0" }) }));
    // REQUEST_END never arrives — api.ts calls onEnd outside a finally.
    expect(root.firstElementChild!.classList.contains(ITEM_REMOVING)).toBe(true);

    handleQueueIdle();

    expect(root.firstElementChild!.classList.contains(ITEM_REMOVING)).toBe(false);
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("drops a stale clear on idle too", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ endpoint: "clear", body: null }));
    handleQueueIdle();
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("keeps a line busy while a second request for another line runs", () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="2"></div>`);
    const first = formBody({ line: "1", quantity: "1" });
    const second = formBody({ line: "2", quantity: "1" });

    handleRequestStart(startCtx({ body: first }));
    handleRequestStart(startCtx({ body: second }));
    handleRequestEnd(endCtx({ body: first }));

    const [a, b] = [...root.querySelectorAll(`[${ATTR}]`)];
    expect(a.classList.contains(ITEM_BUSY)).toBe(false);
    expect(b.classList.contains(ITEM_BUSY)).toBe(true);
  });

  it("ignores a get request entirely", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestStart(startCtx({ endpoint: "get", body: null }));
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });
});
