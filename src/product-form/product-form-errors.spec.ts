import { describe, it, expect, afterEach } from "vitest";
import { clearErrors, renderErrors } from "./product-form-errors";
import type { RequestResult } from "../core";

import missingEmail from "./fixtures/missing-email.json";
import invalidEmail from "./fixtures/invalid-email.json";
import invalidSendOn from "./fixtures/invalid-send-on.json";
import nameTooLong from "./fixtures/name-too-long.json";
import messageTooLong from "./fixtures/message-too-long.json";
import allFieldsInvalid from "./fixtures/all-fields-invalid.json";
import maxInCart from "./fixtures/max-in-cart.json";
import variantNotFound from "./fixtures/variant-not-found.json";
import variantSoldOut from "./fixtures/variant-sold-out.json";
import variantNotSent from "./fixtures/variant-not-sent.json";

// Must match the FALLBACK_TEXT constant inside product-form-errors.ts.
const FALLBACK_TEXT = "We couldn't update your cart. Please try again.";

// ---- helpers ---------------------------------------------------------------

let mounted: HTMLElement[] = [];

/** Build a connected subtree (renderErrors ignores disconnected elements). */
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
});

/** Wrap a Shopify response body into a failed RequestResult. */
function fail(body: Record<string, unknown> | null, status: number | null = 422): RequestResult {
  return { ok: false, status, body };
}

/** Catch-all slot when key omitted; field-keyed slot otherwise. */
function errorSlot(el: HTMLElement, key = ""): HTMLElement {
  return el.querySelector(`[data-ajax-cart-product-form-error="${key}"]`) as HTMLElement;
}

function input(el: HTMLElement, key: string): HTMLElement {
  return el.querySelector(`[data-ajax-cart-product-form-input="${key}"]`) as HTMLElement;
}

/** The per-message <span> texts rendered into a slot. */
function messages(slot: Element): (string | null)[] {
  return [...slot.querySelectorAll("span")].map((s) => s.textContent);
}

// ---- gift-card object-form fixtures ---------------------------------------

describe("renderErrors — gift-card object-form errors", () => {
  const SINGLE_FIELD = [
    { name: "missing-email", body: missingEmail, key: "email", msg: "Email can't be blank" },
    { name: "invalid-email", body: invalidEmail, key: "email", msg: "Email is invalid" },
    {
      name: "invalid-send-on",
      body: invalidSendOn,
      key: "send_on",
      msg: "Send on must be a valid date",
    },
    {
      name: "name-too-long",
      body: nameTooLong,
      key: "name",
      msg: "Name is too long (maximum is 255 characters)",
    },
    {
      name: "message-too-long",
      body: messageTooLong,
      key: "message",
      msg: "Message is too long (maximum is 200 characters)",
    },
  ];

  // Case 1
  SINGLE_FIELD.forEach(({ name, body, key, msg }) => {
    it(`[${name}] writes the message to the keyed slot and marks the input aria-invalid`, () => {
      const el = mount(`
        <input data-ajax-cart-product-form-input="${key}">
        <div data-ajax-cart-product-form-error="${key}"></div>
      `);
      renderErrors(el, fail(body));
      expect(messages(errorSlot(el, key))).toEqual([msg]);
      expect(input(el, key).getAttribute("aria-invalid")).toBe("true");
    });
  });

  // Case 2
  it("routes the message to the catch-all when no keyed slot exists; key name is not rendered", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail(missingEmail));
    expect(messages(errorSlot(el))).toEqual(["Email can't be blank"]);
    expect(errorSlot(el).textContent).not.toContain("email");
  });

  // Case 3
  it("ignores `description` when `errors` is present (no double render)", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="email"></div>`);
    renderErrors(el, fail(missingEmail));
    // errors + description carry identical content; must appear exactly once.
    expect(messages(errorSlot(el, "email"))).toEqual(["Email can't be blank"]);
  });

  // Case 4
  it("renders into every duplicate catch-all slot exactly once each", () => {
    const el = mount(`
      <div class="a" data-ajax-cart-product-form-error></div>
      <div class="b" data-ajax-cart-product-form-error></div>
    `);
    renderErrors(el, fail(missingEmail));
    expect(messages(el.querySelector(".a")!)).toEqual(["Email can't be blank"]);
    expect(messages(el.querySelector(".b")!)).toEqual(["Email can't be blank"]);
  });

  // Case 5
  it("wires aria-invalid on a marked input even with no matching slot", () => {
    const el = mount(`<input data-ajax-cart-product-form-input="email">`);
    renderErrors(el, fail(missingEmail));
    expect(input(el, "email").getAttribute("aria-invalid")).toBe("true");
  });

  // Case 6
  it("renders into a slot even with no marked input; no aria-invalid fires", () => {
    const el = mount(`
      <div data-ajax-cart-product-form-error="email"></div>
      <input name="properties[Recipient email]">
    `);
    renderErrors(el, fail(missingEmail));
    expect(messages(errorSlot(el, "email"))).toEqual(["Email can't be blank"]);
    expect(el.querySelector("[aria-invalid]")).toBeNull();
  });
});

// ---- clearErrors ----------------------------------------------------------

describe("clearErrors", () => {
  // Case 7
  it("clears slot text and removes aria-invalid the module set", () => {
    const el = mount(`
      <input data-ajax-cart-product-form-input="email">
      <div data-ajax-cart-product-form-error="email"></div>
    `);
    renderErrors(el, fail(missingEmail));
    clearErrors(el);
    expect(errorSlot(el, "email").textContent).toBe("");
    expect(input(el, "email").hasAttribute("aria-invalid")).toBe(false);
  });

  it("clears catch-all slots too", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail(maxInCart));
    clearErrors(el);
    expect(errorSlot(el).textContent).toBe("");
  });
});

// ---- non-gift-card string-form fixtures -----------------------------------

describe("renderErrors — string-form errors", () => {
  // Case 8
  it("writes a string `description` to the catch-all; no aria-invalid fires", () => {
    const el = mount(`
      <div data-ajax-cart-product-form-error></div>
      <input data-ajax-cart-product-form-input="email">
    `);
    renderErrors(el, fail(maxInCart));
    expect(messages(errorSlot(el))).toEqual([
      "The maximum quantity of this item is already in your cart.",
    ]);
    expect(el.querySelector("[aria-invalid]")).toBeNull();
  });

  it("[variant-sold-out] writes the description to the catch-all", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail(variantSoldOut));
    expect(messages(errorSlot(el))).toEqual([
      "The product 'Limited Product - L / Blue' is already sold out.",
    ]);
  });

  // Case 9
  it("prefers string `description` over `message` when they differ (variant-not-found)", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail(variantNotFound));
    expect(messages(errorSlot(el))).toEqual(["Cannot find variant"]);
    expect(errorSlot(el).textContent).not.toContain("Cart Error");
  });

  // Case 9b — missing-parameter shape; note `status` is the string "bad_request"
  // (the library reads result.ok, never body.status, so it routes like any other
  // string-form error: informative `description` over generic `message`).
  it("[variant-not-sent] prefers description over message despite a string `status`", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail(variantNotSent, 400));
    expect(messages(errorSlot(el))).toEqual(["Required parameter missing or invalid: items"]);
    expect(errorSlot(el).textContent).not.toContain("Parameter Missing or Invalid");
  });

  // Case 10
  it("never fills field-keyed slots for string-form errors; catch-all only", () => {
    const el = mount(`
      <div data-ajax-cart-product-form-error="email"></div>
      <div data-ajax-cart-product-form-error></div>
    `);
    renderErrors(el, fail(maxInCart));
    expect(errorSlot(el, "email").textContent).toBe("");
    expect(messages(errorSlot(el))).toEqual([
      "The maximum quantity of this item is already in your cart.",
    ]);
  });
});

// ---- synthetic precedence / fallback cases --------------------------------

describe("renderErrors — synthetic precedence & fallback", () => {
  // Case 11
  it("handles a bare string `errors` value, catch-all only", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail({ errors: "Cart Error" }));
    expect(messages(errorSlot(el))).toEqual(["Cart Error"]);
  });

  // Case 12
  it("falls back to default text on a network failure (null body)", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, { ok: false, status: null, body: null });
    expect(messages(errorSlot(el))).toEqual([FALLBACK_TEXT]);
  });

  // Case 13
  it("falls back to default text on an empty body", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, { ok: false, status: 500, body: {} });
    expect(messages(errorSlot(el))).toEqual([FALLBACK_TEXT]);
  });

  it("uses string `errors` ahead of string `message`", () => {
    const el = mount(`<div data-ajax-cart-product-form-error></div>`);
    renderErrors(el, fail({ errors: "from errors", message: "from message" }));
    expect(messages(errorSlot(el))).toEqual(["from errors"]);
  });
});

// ---- multi-field (the new all-fields-invalid fixture) ----------------------

describe("renderErrors — multiple field keys", () => {
  // Case 14
  it("routes every field key to its own slot/input independently, no cross-leak", () => {
    const el = mount(`
      <input data-ajax-cart-product-form-input="email">
      <div data-ajax-cart-product-form-error="email"></div>
      <input data-ajax-cart-product-form-input="name">
      <div data-ajax-cart-product-form-error="name"></div>
      <input data-ajax-cart-product-form-input="send_on">
      <div data-ajax-cart-product-form-error="send_on"></div>
      <input data-ajax-cart-product-form-input="message">
      <div data-ajax-cart-product-form-error="message"></div>
    `);
    renderErrors(el, fail(allFieldsInvalid));

    expect(messages(errorSlot(el, "email"))).toEqual(["Email can't be blank"]);
    expect(messages(errorSlot(el, "name"))).toEqual([
      "Name is too long (maximum is 255 characters)",
    ]);
    expect(messages(errorSlot(el, "send_on"))).toEqual(["Send on must be a valid date"]);
    expect(messages(errorSlot(el, "message"))).toEqual([
      "Message is too long (maximum is 200 characters)",
    ]);

    ["email", "name", "send_on", "message"].forEach((k) =>
      expect(input(el, k).getAttribute("aria-invalid")).toBe("true"),
    );
  });

  // Case 15
  it("sends only unmatched keys to the catch-all (in object key order), keyed slots get their own", () => {
    const el = mount(`
      <div data-ajax-cart-product-form-error="email"></div>
      <div data-ajax-cart-product-form-error="name"></div>
      <div data-ajax-cart-product-form-error></div>
    `);
    renderErrors(el, fail(allFieldsInvalid));

    expect(messages(errorSlot(el, "email"))).toEqual(["Email can't be blank"]);
    expect(messages(errorSlot(el, "name"))).toEqual([
      "Name is too long (maximum is 255 characters)",
    ]);
    // send_on and message have no keyed slot → accumulate into catch-all, key order preserved.
    expect(messages(errorSlot(el))).toEqual([
      "Send on must be a valid date",
      "Message is too long (maximum is 200 characters)",
    ]);
    expect(errorSlot(el).textContent).not.toContain("send_on");
  });

  // Case 16
  it("treats the object `message` field key as a field error, not the top-level message string", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="message"></div>`);
    renderErrors(el, fail(allFieldsInvalid));
    expect(messages(errorSlot(el, "message"))).toEqual([
      "Message is too long (maximum is 200 characters)",
    ]);
    expect(errorSlot(el, "message").textContent).not.toContain("Validation failed");
  });
});

// ---- render shape ---------------------------------------------------------

describe("renderErrors — render shape", () => {
  it("renders a single message as one <span>, no <br>", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="email"></div>`);
    renderErrors(el, fail({ errors: { email: ["can't be blank"] } }));
    const slot = errorSlot(el, "email");
    expect(slot.querySelectorAll("span")).toHaveLength(1);
    expect(slot.querySelectorAll("br")).toHaveLength(0);
    expect(slot.querySelector("span")!.textContent).toBe("can't be blank");
  });

  it("separates multiple messages with <br> in span/br/span order", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="email"></div>`);
    renderErrors(el, fail({ errors: { email: ["can't be blank", "is invalid"] } }));
    const slot = errorSlot(el, "email");
    expect(messages(slot)).toEqual(["can't be blank", "is invalid"]);
    expect([...slot.childNodes].map((n) => n.nodeName)).toEqual(["SPAN", "BR", "SPAN"]);
  });

  it("replaces previous content on re-render", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="email"></div>`);
    renderErrors(el, fail(missingEmail));
    renderErrors(el, fail(invalidEmail));
    expect(messages(errorSlot(el, "email"))).toEqual(["Email is invalid"]);
  });

  it("never parses API strings as HTML (uses textContent)", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="email"></div>`);
    const payload = "<img src=x onerror=alert(1)>";
    renderErrors(el, fail({ errors: { email: [payload] } }));
    const slot = errorSlot(el, "email");
    expect(slot.querySelector("img")).toBeNull();
    expect(slot.querySelector("span")!.textContent).toBe(payload);
  });
});

// ---- out-of-tree association via form id ----------------------------------
//
// Slots/inputs may live outside the wrapper and associate by the form's id:
// slots via `data-ajax-cart-product-form-error-for="<id>"`, inputs via the
// native `form="<id>"`. The module finds them by attribute query — NOT
// form.elements — so render and clear always see the same set (form.elements
// is live membership and can drift between submit and clear, leaking
// aria-invalid onto an element it can no longer reach).

describe("renderErrors / clearErrors — out-of-tree association", () => {
  /** Mounts a container; the wrapper passed to render/clear is `[data-wrapper]`. */
  function setup(containerHTML: string): { container: HTMLElement; wrapper: HTMLElement } {
    const container = document.createElement("div");
    container.innerHTML = containerHTML;
    document.body.appendChild(container);
    mounted.push(container);
    const wrapper = container.querySelector("[data-wrapper]") as HTMLElement;
    return { container, wrapper };
  }

  // The core "multiple places" ask.
  it("fills both in-tree and out-of-tree slots wired to the form id", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper>
        <form id="gift-form"></form>
        <div class="inTree" data-ajax-cart-product-form-error="email"></div>
      </div>
      <div class="outTree"
           data-ajax-cart-product-form-error="email"
           data-ajax-cart-product-form-error-for="gift-form"></div>
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(messages(container.querySelector(".inTree")!)).toEqual(["Email can't be blank"]);
    expect(messages(container.querySelector(".outTree")!)).toEqual(["Email can't be blank"]);
  });

  it("fills an out-of-tree catch-all slot wired to the form id (string error)", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper><form id="f1"></form></div>
      <div class="toast"
           data-ajax-cart-product-form-error
           data-ajax-cart-product-form-error-for="f1"></div>
    `);
    renderErrors(wrapper, fail(maxInCart));
    expect(messages(container.querySelector(".toast")!)).toEqual([
      "The maximum quantity of this item is already in your cart.",
    ]);
  });

  it("marks an out-of-tree input wired via native form= as aria-invalid", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper><form id="f1"></form></div>
      <input class="oot" data-ajax-cart-product-form-input="email" form="f1">
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(container.querySelector(".oot")!.getAttribute("aria-invalid")).toBe("true");
  });

  it("clears both in-tree and out-of-tree slots and inputs (leak-free)", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper>
        <form id="f1"></form>
        <input class="inInput" data-ajax-cart-product-form-input="email">
        <div class="inSlot" data-ajax-cart-product-form-error="email"></div>
      </div>
      <input class="ootInput" data-ajax-cart-product-form-input="email" form="f1">
      <div class="ootSlot"
           data-ajax-cart-product-form-error="email"
           data-ajax-cart-product-form-error-for="f1"></div>
    `);
    renderErrors(wrapper, fail(missingEmail));
    clearErrors(wrapper);
    expect(container.querySelector(".inSlot")!.textContent).toBe("");
    expect(container.querySelector(".ootSlot")!.textContent).toBe("");
    expect(container.querySelector(".inInput")!.hasAttribute("aria-invalid")).toBe(false);
    expect(container.querySelector(".ootInput")!.hasAttribute("aria-invalid")).toBe(false);
  });

  // The decisive case behind choosing attribute-query over form.elements: a
  // marked input that is NOT a member of form.elements is still marked AND
  // cleared, because discovery keys off the attribute, not form membership.
  it("marks and clears a marked input that is not in form.elements", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper>
        <form id="f1"></form>
        <input class="loose" data-ajax-cart-product-form-input="email">
      </div>
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(container.querySelector(".loose")!.getAttribute("aria-invalid")).toBe("true");
    clearErrors(wrapper);
    expect(container.querySelector(".loose")!.hasAttribute("aria-invalid")).toBe(false);
  });

  it("ignores slots/inputs wired to a different form id", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper><form id="mine"></form></div>
      <div class="other"
           data-ajax-cart-product-form-error="email"
           data-ajax-cart-product-form-error-for="someone-else"></div>
      <input class="otherInput" data-ajax-cart-product-form-input="email" form="someone-else">
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(container.querySelector(".other")!.textContent).toBe("");
    expect(container.querySelector(".otherInput")!.hasAttribute("aria-invalid")).toBe(false);
  });

  // Partition rule: an in-tree element explicitly wired to ANOTHER form is not
  // claimed by containment — mirrors how native form= reassigns an input.
  it("does not fill an in-tree slot explicitly wired to another form", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper>
        <form id="mine"></form>
        <div class="stray"
             data-ajax-cart-product-form-error="email"
             data-ajax-cart-product-form-error-for="other"></div>
      </div>
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(container.querySelector(".stray")!.textContent).toBe("");
  });

  it("does not mark an in-tree input explicitly associated to another form", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper>
        <form id="mine"></form>
        <input class="stray" data-ajax-cart-product-form-input="email" form="other">
      </div>
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(container.querySelector(".stray")!.hasAttribute("aria-invalid")).toBe(false);
  });

  // No form id → out-of-tree pointers are inert (must not match [...-for=""]).
  it("ignores -error-for pointers when the form has no id", () => {
    const { container, wrapper } = setup(`
      <div data-wrapper><form></form></div>
      <div class="oot"
           data-ajax-cart-product-form-error="email"
           data-ajax-cart-product-form-error-for=""></div>
    `);
    renderErrors(wrapper, fail(missingEmail));
    expect(container.querySelector(".oot")!.textContent).toBe("");
  });
});

// ---- precedence & shape matrix --------------------------------------------
//
// Synthetic, sentinel-driven coverage of every precedence rung and shape,
// independent of the captured fixtures (which can't prove *which* field was
// read, since errors === description in them). Distinct sentinels per field
// make the source unambiguous.
//
// Decided behaviour: an empty object ({}) is NOT usable — the chain falls
// through to the next property, and to FALLBACK_TEXT if none remain.

describe("renderErrors — precedence & shape matrix", () => {
  const E_OBJ = { email: ["E_obj"] };
  const D_OBJ = { email: ["D_obj"] };
  const E_STR = "E_str";
  const D_STR = "D_str";
  const M_STR = "M_str";

  /** keyed slot + catch-all + marked input, so one mount asserts content,
   *  shape-routing, and aria together. */
  function matrixMount(): HTMLElement {
    return mount(`
      <input data-ajax-cart-product-form-input="email">
      <div class="keyed" data-ajax-cart-product-form-error="email"></div>
      <div class="catch" data-ajax-cart-product-form-error></div>
    `);
  }

  type Row = {
    name: string;
    body: Record<string, unknown> | null;
    keyed?: string[];
    catchAll?: string[];
    aria?: boolean;
  };

  const CASES: Row[] = [
    // A. each rung as the sole usable source
    { name: "rung1 — object errors only", body: { errors: E_OBJ }, keyed: ["E_obj"], aria: true },
    {
      name: "rung2 — object description only",
      body: { description: D_OBJ },
      keyed: ["D_obj"],
      aria: true,
    },
    { name: "rung3 — string errors only", body: { errors: E_STR }, catchAll: ["E_str"] },
    { name: "rung4 — string description only", body: { description: D_STR }, catchAll: ["D_str"] },
    { name: "rung5 — string message only", body: { message: M_STR }, catchAll: ["M_str"] },
    { name: "rung6 — empty body falls back", body: {}, catchAll: [FALLBACK_TEXT] },
    { name: "rung6 — null body falls back", body: null, catchAll: [FALLBACK_TEXT] },

    // B. pairwise precedence (distinct content; loser must be absent)
    {
      name: "object errors over object description",
      body: { errors: E_OBJ, description: D_OBJ },
      keyed: ["E_obj"],
      aria: true,
    },
    {
      name: "object errors over all strings",
      body: { errors: E_OBJ, description: D_STR, message: M_STR },
      keyed: ["E_obj"],
      aria: true,
    },
    {
      name: "object description over string errors",
      body: { errors: E_STR, description: D_OBJ },
      keyed: ["D_obj"],
      aria: true,
    },
    {
      name: "object description over string message",
      body: { description: D_OBJ, message: M_STR },
      keyed: ["D_obj"],
      aria: true,
    },
    {
      name: "string errors over string description",
      body: { errors: E_STR, description: D_STR },
      catchAll: ["E_str"],
    },
    {
      name: "string errors over string message",
      body: { errors: E_STR, message: M_STR },
      catchAll: ["E_str"],
    },
    {
      name: "string description over string message",
      body: { description: D_STR, message: M_STR },
      catchAll: ["D_str"],
    },

    // C. degenerate / non-routable shapes — skipped by the chain
    {
      name: "array errors is not object-form",
      body: { errors: ["x"], description: D_STR },
      catchAll: ["D_str"],
    },
    {
      name: "empty-string fields are skipped",
      body: { errors: "", description: "", message: M_STR },
      catchAll: ["M_str"],
    },
    {
      name: "null fields are skipped",
      body: { errors: null, description: D_STR },
      catchAll: ["D_str"],
    },

    // D. empty-object fall-through (decided behaviour)
    {
      name: "empty {} errors falls through to message",
      body: { errors: {}, message: M_STR },
      catchAll: ["M_str"],
    },
    {
      name: "empty {} errors and description falls back",
      body: { errors: {}, description: {} },
      catchAll: [FALLBACK_TEXT],
    },
    {
      name: "empty {} errors lets object description win",
      body: { errors: {}, description: D_OBJ },
      keyed: ["D_obj"],
      aria: true,
    },

    // E. object routing sanity
    {
      name: "object key with no keyed slot goes to catch-all",
      body: { errors: { foo: ["bar"] } },
      catchAll: ["bar"],
    },
  ];

  CASES.forEach(({ name, body, keyed = [], catchAll = [], aria = false }) => {
    it(name, () => {
      const el = matrixMount();
      renderErrors(el, body === null ? { ok: false, status: null, body: null } : fail(body));
      expect(messages(el.querySelector(".keyed")!)).toEqual(keyed);
      expect(messages(el.querySelector(".catch")!)).toEqual(catchAll);
      expect(el.querySelector("input")!.hasAttribute("aria-invalid")).toBe(aria);
    });
  });

  // bespoke — needs a `message`-keyed slot, can't share matrixMount
  it("treats an object key named `message` as a field error, not the top-level string", () => {
    const el = mount(`<div data-ajax-cart-product-form-error="message"></div>`);
    renderErrors(el, fail({ errors: { message: ["field_msg"] }, message: "TOP" }));
    expect(messages(errorSlot(el, "message"))).toEqual(["field_msg"]);
    expect(errorSlot(el, "message").textContent).not.toContain("TOP");
  });
});

// ---- edge cases -----------------------------------------------------------

describe("renderErrors — edge cases", () => {
  it("does nothing when the element is disconnected", () => {
    const el = document.createElement("div");
    el.innerHTML = `<div data-ajax-cart-product-form-error="email"></div>`;
    // never appended to the document → isConnected === false
    renderErrors(el, fail(missingEmail));
    expect(el.querySelector('[data-ajax-cart-product-form-error="email"]')!.textContent).toBe("");
  });

  it("matches keys that require CSS escaping in selectors", () => {
    const el = mount(
      `<input data-ajax-cart-product-form-input='a"b'>` +
        `<div data-ajax-cart-product-form-error='a"b'></div>`,
    );
    renderErrors(el, fail({ errors: { 'a"b': ["bad"] } }));
    expect(messages(el.querySelector(`[data-ajax-cart-product-form-error='a"b']`)!)).toEqual([
      "bad",
    ]);
    expect(
      el.querySelector(`[data-ajax-cart-product-form-input='a"b']`)!.getAttribute("aria-invalid"),
    ).toBe("true");
  });
});
