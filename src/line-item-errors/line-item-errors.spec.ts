import { describe, it, expect, afterEach, vi } from "vitest";
import {
  identityOf,
  slotsFor,
  errorTextFrom,
  handleRequestStart,
  handleRequestEnd,
} from "./line-item-errors";
import type { RequestResult, RequestStartContext, RequestEndContext } from "../core";

const FALLBACK = "We couldn't update your cart. Please try again.";
const ATTR = "data-ajax-cart-item-error";

let mounted: HTMLElement[] = [];
function mount(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  document.body.appendChild(el);
  mounted.push(el);
  return el;
}
afterEach(() => {
  mounted.forEach((el) => el.remove());
  mounted = [];
  vi.restoreAllMocks();
});

function result(over: Partial<RequestResult> = {}): RequestResult {
  return { ok: false, status: 422, body: null, cancelled: false, ...over };
}

function endCtx(over: Partial<RequestEndContext> = {}): RequestEndContext {
  return {
    endpoint: "change",
    body: new FormData(),
    meta: {},
    result: result(),
    ...over,
  } as RequestEndContext;
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

function formBody(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

const KEY = "39897499729985:b1fca88d0e8bf5290f306f808785f744";

// =============================================================================
// identityOf
// =============================================================================

describe("identityOf", () => {
  it("reads line from FormData", () => {
    expect(identityOf(formBody({ line: "3", quantity: "2" }))).toBe("3");
  });

  it("reads id from FormData", () => {
    expect(identityOf(formBody({ id: KEY, quantity: "2" }))).toBe(KEY);
  });

  it("reads line from URLSearchParams", () => {
    expect(identityOf(new URLSearchParams("line=2&quantity=1"))).toBe("2");
  });

  it("reads line from a plain object, stringified", () => {
    expect(identityOf({ line: 4, quantity: 1 })).toBe("4");
  });

  it("reads id from a plain object", () => {
    expect(identityOf({ id: KEY })).toBe(KEY);
  });

  it("prefers line over id when a malformed body carries both", () => {
    expect(identityOf(formBody({ line: "1", id: KEY }))).toBe("1");
    expect(identityOf({ line: 1, id: KEY })).toBe("1");
  });

  it("returns null when neither is present", () => {
    expect(identityOf(formBody({ quantity: "2" }))).toBeNull();
    expect(identityOf({ quantity: 2 })).toBeNull();
    expect(identityOf(null)).toBeNull();
  });

  it("treats a zero line as present, not missing", () => {
    // `0` is falsy — `??` is required here, `||` would drop it.
    expect(identityOf({ line: 0 })).toBe("0");
  });

  it("treats an empty or whitespace-only value as no identity", () => {
    expect(identityOf(formBody({ line: "" }))).toBeNull();
    expect(identityOf(formBody({ id: "   " }))).toBeNull();
    expect(identityOf({ line: "" })).toBeNull();
  });

  it("trims surrounding whitespace, which a token could never carry", () => {
    expect(identityOf(formBody({ line: " 3 " }))).toBe("3");
  });
});

// =============================================================================
// slotsFor
// =============================================================================

describe("slotsFor", () => {
  it("matches either token of a two-identifier slot", () => {
    const root = mount(`<div ${ATTR}="3 ${KEY}"></div>`);
    expect(slotsFor("3", root)).toHaveLength(1);
    expect(slotsFor(KEY, root)).toHaveLength(1);
  });

  it("does not match a partial token", () => {
    const root = mount(`<div ${ATTR}="3 ${KEY}"></div>`);
    expect(slotsFor("39897499729985", root)).toHaveLength(0);
    expect(slotsFor("", root)).toHaveLength(0);
  });

  it("matches a single-token slot only on its own grammar", () => {
    const root = mount(`<div ${ATTR}="${KEY}"></div>`);
    expect(slotsFor(KEY, root)).toHaveLength(1);
    expect(slotsFor("3", root)).toHaveLength(0);
  });

  it("returns every slot carrying the identity", () => {
    const root = mount(`<div ${ATTR}="2"></div><span ${ATTR}="2 ${KEY}"></span>`);
    expect(slotsFor("2", root)).toHaveLength(2);
  });

  it("treats an empty attribute as inert", () => {
    const root = mount(`<div ${ATTR}=""></div>`);
    expect(slotsFor("", root)).toHaveLength(0);
    expect(slotsFor("1", root)).toHaveLength(0);
  });

  it("tolerates extra and irregular whitespace", () => {
    const root = mount(`<div ${ATTR}="  3\n  ${KEY}  "></div>`);
    expect(slotsFor("3", root)).toHaveLength(1);
    expect(slotsFor(KEY, root)).toHaveLength(1);
  });

  // The identity is interpolated into a `~=` selector, so CSS.escape is what
  // stands between a merchant's `change({ id: 'weird"value' })` and a
  // SyntaxError thrown out of the event handler. Unescaped, the quote closes the
  // attribute-value string; these cases fail loudly if the escape is dropped.
  it("does not throw on an identity containing selector syntax", () => {
    const root = mount(`<div ${ATTR}='weird"value'></div>`);
    expect(() => slotsFor('weird"value', root)).not.toThrow();
    expect(slotsFor('weird"value', root)).toHaveLength(1);
    expect(() => slotsFor('"], [x="', root)).not.toThrow();
    expect(slotsFor('"], [x="', root)).toHaveLength(0);
  });

  // `~=` supplies these two by spec — "if value is the empty string, it will
  // never represent anything", likewise a value containing whitespace. Pinned
  // so a move back to a hand-rolled split has to re-earn them: `"".split(/\s+/)`
  // is `[""]`, not `[]`, which silently makes an empty attribute matchable.
  it("never matches an empty or whitespace-bearing identity", () => {
    const root = mount(`<div ${ATTR}=""></div><div ${ATTR}="1 2"></div>`);
    expect(slotsFor("", root)).toHaveLength(0);
    expect(slotsFor("1 2", root)).toHaveLength(0);
  });

  // Divergence from a `/\s+/` split, which treats NBSP as a separator and would
  // match here. `~=` splits on ASCII whitespace only, so a slot authored with
  // `&nbsp;` between its tokens does not match — the no-match warning fires
  // instead, which points the merchant at the real problem in their Liquid.
  it("does not treat a non-breaking space as a token separator", () => {
    // Built from a char code rather than typed inline: a literal NBSP is
    // invisible in source and an editor may silently normalise it to a space.
    const NBSP = String.fromCharCode(160);
    const value = `1${NBSP}2`;
    const root = mount(`<div ${ATTR}="${value}"></div>`);
    expect(slotsFor("1", root)).toHaveLength(0);
    expect(slotsFor("2", root)).toHaveLength(0);
    // Proof the slot exists and its value is a single token, so the two misses
    // above are the operator's tokenising, not a typo in the fixture.
    expect(slotsFor(value, root)).toHaveLength(1);
  });
});

// =============================================================================
// errorTextFrom — one case per captured fixture
// =============================================================================

describe("errorTextFrom", () => {
  it("1 — partial fulfilment (message === description)", () => {
    const text = "Only 3 items were added to your cart due to availability.";
    expect(errorTextFrom(result({ body: { status: 422, message: text, description: text } }))).toBe(
      text,
    );
  });

  it("2 — maximum already in cart", () => {
    const text = "The maximum quantity of this item is already in your cart.";
    expect(errorTextFrom(result({ body: { status: 422, message: text, description: text } }))).toBe(
      text,
    );
  });

  it("3 — cannot add more: description wins over the 'Cart Error' constant", () => {
    expect(
      errorTextFrom(
        result({
          body: {
            status: 422,
            message: "Cart Error",
            description: "You can't add more Health potion to the cart.",
          },
        }),
      ),
    ).toBe("You can't add more Health potion to the cart.");
  });

  it("4 — sold out", () => {
    expect(
      errorTextFrom(
        result({
          body: {
            status: 422,
            message: "Cart Error",
            description: "The product 'Health potion' is already sold out.",
          },
        }),
      ),
    ).toBe("The product 'Health potion' is already sold out.");
  });

  it("5 — non-integer quantity, rendered verbatim despite being developer text", () => {
    const text = "expected String to be a Integer: quantity";
    expect(
      errorTextFrom(result({ body: { status: "bad_request", message: text, description: text } })),
    ).toBe(text);
  });

  it("6 — variant not found", () => {
    expect(
      errorTextFrom(
        result({
          body: { status: 404, message: "Cart Error", description: "Cannot find variant" },
        }),
      ),
    ).toBe("Cannot find variant");
  });

  it("7 — malformed line, under the string spelling of 422", () => {
    const text = "line parameter is invalid.";
    expect(
      errorTextFrom(
        result({ body: { status: "unprocessable_entity", message: text, description: text } }),
      ),
    ).toBe(text);
  });

  it("falls back to message when description is absent", () => {
    expect(errorTextFrom(result({ body: { message: "only message" } }))).toBe("only message");
  });

  it("falls through empty strings rather than blanking the slot", () => {
    expect(errorTextFrom(result({ body: { description: "", message: "" } }))).toBe(FALLBACK);
    expect(errorTextFrom(result({ body: { description: "", message: "used" } }))).toBe("used");
  });

  it("falls through non-string values", () => {
    expect(errorTextFrom(result({ body: { description: { email: ["nope"] } } }))).toBe(FALLBACK);
    expect(errorTextFrom(result({ body: { description: 42, message: "used" } }))).toBe("used");
  });

  it("ignores errors, which this endpoint never returns", () => {
    expect(errorTextFrom(result({ body: { errors: "ignored", description: "used" } }))).toBe(
      "used",
    );
    expect(errorTextFrom(result({ body: { errors: "ignored" } }))).toBe(FALLBACK);
  });

  it("uses the fallback for a null body", () => {
    expect(errorTextFrom(result({ body: null, status: null }))).toBe(FALLBACK);
  });
});

// =============================================================================
// handleRequestStart — clearing
// =============================================================================

describe("handleRequestStart", () => {
  it("clears only the slots matching the requested identity", () => {
    const root = mount(`<div ${ATTR}="1">old one</div><div ${ATTR}="2">old two</div>`);
    handleRequestStart(startCtx({ body: formBody({ line: "1", quantity: "5" }) }));
    expect(root.querySelector(`[${ATTR}="1"]`)!.textContent).toBe("");
    expect(root.querySelector(`[${ATTR}="2"]`)!.textContent).toBe("old two");
  });

  it("clears a slot matched by its key token when the request uses the key", () => {
    const root = mount(`<div ${ATTR}="1 ${KEY}">old</div>`);
    handleRequestStart(startCtx({ body: formBody({ id: KEY, quantity: "5" }) }));
    expect(root.firstElementChild!.textContent).toBe("");
  });

  it("ignores endpoints other than change", () => {
    const root = mount(`<div ${ATTR}="1">old</div>`);
    handleRequestStart(startCtx({ endpoint: "add", body: formBody({ id: "1", quantity: "5" }) }));
    expect(root.firstElementChild!.textContent).toBe("old");
  });

  it("does nothing when the body carries no identity", () => {
    const root = mount(`<div ${ATTR}="1">old</div>`);
    handleRequestStart(startCtx({ body: formBody({ quantity: "5" }) }));
    expect(root.firstElementChild!.textContent).toBe("old");
  });
});

// =============================================================================
// handleRequestEnd — rendering
// =============================================================================

describe("handleRequestEnd", () => {
  const failed = (over: Partial<RequestResult> = {}) =>
    result({ body: { description: "Not enough stock." }, ...over });

  it("renders the error into every slot carrying the identity", () => {
    const root = mount(`<div ${ATTR}="2"></div><span ${ATTR}="2 ${KEY}"></span>`);
    handleRequestEnd(endCtx({ body: formBody({ line: "2" }), result: failed() }));
    expect(root.querySelector(`[${ATTR}="2"]`)!.textContent).toBe("Not enough stock.");
    expect(root.querySelector("span")!.textContent).toBe("Not enough stock.");
  });

  it("matches by key when the request addressed the line by key", () => {
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    handleRequestEnd(endCtx({ body: formBody({ id: KEY }), result: failed() }));
    expect(root.firstElementChild!.textContent).toBe("Not enough stock.");
  });

  it("leaves other lines untouched", () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="2"></div>`);
    handleRequestEnd(endCtx({ body: formBody({ line: "1" }), result: failed() }));
    expect(root.querySelector(`[${ATTR}="2"]`)!.textContent).toBe("");
  });

  it("writes as text, never as markup", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestEnd(
      endCtx({
        body: formBody({ line: "1" }),
        result: failed({ body: { description: "<img src=x onerror=alert(1)>" } }),
      }),
    );
    const slot = root.firstElementChild!;
    expect(slot.querySelector("img")).toBeNull();
    expect(slot.textContent).toBe("<img src=x onerror=alert(1)>");
  });

  it("renders nothing on a successful request", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestEnd(
      endCtx({ body: formBody({ line: "1" }), result: result({ ok: true, status: 200 }) }),
    );
    expect(root.firstElementChild!.textContent).toBe("");
  });

  // A timeout produces this exact shape — `cancelled` is false for a
  // TimeoutError reason (see isCancellation in core/api.ts), so it lands here
  // with network failures rather than being suppressed as a cancellation.
  it("renders the fallback on a network failure or timeout", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestEnd(
      endCtx({
        body: formBody({ line: "1" }),
        result: result({ status: null, body: null, cancelled: false }),
      }),
    );
    expect(root.firstElementChild!.textContent).toBe(FALLBACK);
  });

  it("stays silent on a cancelled request", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestEnd(
      endCtx({
        body: formBody({ line: "1" }),
        result: result({ status: null, body: null, cancelled: true }),
      }),
    );
    expect(root.firstElementChild!.textContent).toBe("");
  });

  it("ignores endpoints other than change", () => {
    const root = mount(`<div ${ATTR}="1"></div>`);
    handleRequestEnd(endCtx({ endpoint: "add", body: formBody({ id: "1" }), result: failed() }));
    expect(root.firstElementChild!.textContent).toBe("");
  });

  it("warns when the identity matches no slot but slots exist", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(`<div ${ATTR}="${KEY}"></div>`);
    handleRequestEnd(endCtx({ body: formBody({ line: "7" }), result: failed() }));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('"7"');
  });

  it("stays silent when the page has no slots at all", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    handleRequestEnd(endCtx({ body: formBody({ line: "7" }), result: failed() }));
    expect(warn).not.toHaveBeenCalled();
  });

  it("does not warn when the body carries no identity", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    mount(`<div ${ATTR}="1"></div>`);
    handleRequestEnd(endCtx({ body: formBody({ quantity: "2" }), result: failed() }));
    expect(warn).not.toHaveBeenCalled();
  });
});
