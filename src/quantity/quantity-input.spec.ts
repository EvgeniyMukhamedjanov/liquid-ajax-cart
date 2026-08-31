import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

// Stub the request layer so commits are observable without hitting fetch or the
// queue. EVENTS and the rest of core stay real.
vi.mock("../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core")>();
  return { ...actual, change: vi.fn(), isProcessing: vi.fn(() => false) };
});

import { change, isProcessing, EVENTS } from "../core";
import { restore, commit, applyBusyState, initInputBinding } from "./quantity-input";

const changeMock = vi.mocked(change);
const isProcessingMock = vi.mocked(isProcessing);

// Register through the real init path rather than adding and removing the same
// module-level handler references per test: a teardown that removes them cannot
// tell its own registration from production's, and would silently disable the
// binding for every test after it if the describe order ever changed.
initInputBinding();

function mount(html: string): HTMLInputElement {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLInputElement;
}

/** Reads a FormData body from the nth call to change(). */
function sentBody(call = 0): Record<string, string> {
  const body = changeMock.mock.calls[call][0] as FormData;
  return Object.fromEntries([...body.entries()].map(([k, v]) => [k, String(v)]));
}

beforeEach(() => {
  changeMock.mockReset();
  changeMock.mockResolvedValue({ ok: true, status: 200, body: {}, cancelled: false });
  isProcessingMock.mockReset();
  isProcessingMock.mockReturnValue(false);
});

afterEach(() => {
  document.body.innerHTML = "";
  // Unconditional, because a test that fails before its own spy.mockRestore()
  // would otherwise leave console.error spied and corrupt every test after it —
  // turning one real failure into a cascade of phantom ones.
  vi.restoreAllMocks();
});

describe("restore", () => {
  it("puts the server value back", () => {
    const el = mount(`<input value="2">`) as HTMLInputElement;
    el.value = "7";
    restore(el);
    expect(el.value).toBe("2");
  });

  it("leaves the control alone when there is no server value", () => {
    const el = mount(`<input>`) as HTMLInputElement;
    el.value = "7";
    restore(el);
    expect(el.value).toBe("7");
  });

  it("never writes the value attribute", () => {
    const el = mount(`<input value="2">`) as HTMLInputElement;
    el.value = "7";
    restore(el);
    expect(el.getAttribute("value")).toBe("2");
    expect(el.defaultValue).toBe("2");
  });
});

describe("commit", () => {
  it("sends line and quantity for a line identity", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
  });

  it("sends id and quantity for a key identity", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="123:abc" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(sentBody()).toEqual({ id: "123:abc", quantity: "5" });
  });

  it("passes trigger metadata", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(changeMock.mock.calls[0][1]).toEqual({
      trigger: { source: "quantity", initiator: el },
    });
  });

  it("errors and sends nothing when the identity is invalid", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="abc" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  // Reported on every attempt, not deduped. A commit needs a change, an Enter,
  // or a debounce flush, so the volume is bounded by user action — and a
  // per-node guard would not survive a render anyway, since the sections module
  // replaces every line item.
  it("reports on every invalid commit", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="abc" value="2">`,
    ) as HTMLInputElement;
    await commit(el);
    await commit(el);
    expect(spy).toHaveBeenCalledTimes(2);
    spy.mockRestore();
  });

  it("does nothing while the queue is processing", async () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
  });

  // `readOnly` blocks new edits but does not suppress the `change` for an edit
  // made before the lock, so an ordinary commit reaches here — Enter then blur,
  // or a blur while the queue is already busy. Restoring would repaint the
  // server value over an edit whose own request is still in flight.
  it("leaves the display alone when reached while the queue is processing", async () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5"; // the edit whose request is already in flight
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(el.value).toBe("5");
  });

  // The whole point of checking empty separately: Number("") is 0, and a
  // type=number field blanks unparseable text. With min="0" that would send
  // quantity=0 and delete the line.
  it("never requests for an empty value, even when min is 0", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2" min="0">`,
    ) as HTMLInputElement;
    el.value = "";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(el.value).toBe("2");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  // Sent as typed, like any other value the server may refuse. Shopify answers
  // "expected integer"; a client-side rejection would only produce a console
  // error the shopper never sees, plus a field that appears to undo their edit.
  it("sends a fractional value as typed rather than rejecting it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "1.5";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "1.5" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  // Not a business rule the server owns — "Infinity" is not a quantity in any
  // sense, so there is nothing meaningful to put in the request body.
  it("restores rather than sending a non-finite value", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "1e999"; // parses to Infinity
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(el.value).toBe("2");
  });

  // The server owns what a quantity may be. Over max, off the step grid, or
  // beyond stock — all sent as typed, and corrected by the render that follows.
  it("sends a value over max as typed rather than clamping it", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2" min="1" max="10">`,
    ) as HTMLInputElement;
    el.value = "99";
    await commit(el);
    expect(el.value).toBe("99");
    expect(sentBody()).toEqual({ line: "3", quantity: "99" });
  });

  it("sends a value off the step grid as typed", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="3" min="1" step="2">`,
    ) as HTMLInputElement;
    el.value = "4";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "4" });
  });

  // `min` constrains the +/- buttons, not the keyboard. Typing 0 removes the
  // line whatever min says — long-standing behaviour merchants expect from v2.
  it("sends a typed 0 even when min is 1", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="5" min="1">`,
    ) as HTMLInputElement;
    el.value = "0";
    await commit(el);
    expect(el.value).toBe("0");
    expect(sentBody()).toEqual({ line: "3", quantity: "0" });
  });

  it("sends a typed value below a B2B min as typed", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="6" min="6">`,
    ) as HTMLInputElement;
    el.value = "2";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "2" });
  });

  // The one hard floor: a cart line has no representation below 0, so a
  // negative is nonsense rather than merely invalid. It becomes a removal
  // rather than being sent for the server to reject.
  it("floors a typed negative to 0 rather than sending it", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="5">`,
    ) as HTMLInputElement;
    el.value = "-4";
    await commit(el);
    expect(el.value).toBe("0");
    expect(sentBody()).toEqual({ line: "3", quantity: "0" });
  });

  // Counts assignments to input.value rather than reading it back, because the
  // observable consequence — the caret jumping to the end — cannot be asserted
  // on a type=number field, which does not support the selection API.
  function countValueWrites(el: HTMLInputElement): () => number {
    const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!;
    let writes = 0;
    Object.defineProperty(el, "value", {
      configurable: true,
      get: () => desc.get!.call(el),
      set: (v) => {
        writes++;
        desc.set!.call(el, v);
      },
    });
    return () => writes;
  }

  // The guard exists so the caret does not jump on an Enter that changes
  // nothing. Without it every commit reassigns the value, and a shopper
  // pressing Enter mid-field is thrown to the end of it.
  it("does not write the value back when nothing changed", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    const writes = countValueWrites(el);
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
    expect(writes()).toBe(0); // 5 is already displayed
  });

  it("writes the value back exactly once when it was corrected", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "007";
    const writes = countValueWrites(el);
    await commit(el);
    expect(el.value).toBe("7");
    expect(writes()).toBe(1);
  });

  it("normalises the display to what was sent", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "007";
    await commit(el);
    expect(el.value).toBe("7");
    expect(sentBody()).toEqual({ line: "3", quantity: "7" });
  });

  it("does not request when the value already equals the server value", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "2";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("still writes the floored value back when the request is skipped", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="0" min="0">`,
    ) as HTMLInputElement;
    el.value = "-9";
    await commit(el);
    // Floored to 0, which is already the server value — so no request, but the
    // field must still show 0 rather than the -9 that was typed.
    expect(changeMock).not.toHaveBeenCalled();
    expect(el.value).toBe("0");
  });

  it("requests when there is no server value to compare against", async () => {
    const el = mount(`<input type="number" data-ajax-cart-quantity-input="3">`) as HTMLInputElement;
    el.value = "2";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "2" });
  });

  it("restores a still-connected control when the request fails", async () => {
    changeMock.mockResolvedValue({ ok: false, status: null, body: null, cancelled: false });
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(el.value).toBe("2");
  });

  it("leaves a detached control alone when the request fails", async () => {
    changeMock.mockResolvedValue({ ok: false, status: null, body: null, cancelled: false });
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    const promise = commit(el);
    el.remove(); // stands in for a section render replacing the node
    await promise;
    expect(el.value).toBe("5");
  });

  it("does not restore after a successful request", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(el.value).toBe("5");
  });

  it("leaves the value attribute untouched throughout", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(el.getAttribute("value")).toBe("2");
  });
});

/** Lets the floating promise inside the handlers settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("resync after a failed request", () => {
  function endRequest(ok: boolean, status: number | null): void {
    document.dispatchEvent(
      new CustomEvent(EVENTS.REQUEST_END, { detail: { result: { ok, status, body: null } } }),
    );
  }

  // The gap this closes: a commit dropped while the queue was busy leaves the
  // stepped value on screen, and a request that fails at the network level
  // renders nothing (sections.ts:131), so nothing else would ever correct it.
  it("restores a control whose commit was dropped while busy", () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "3"; // stepped, then commit() was dropped by the isProcessing guard

    endRequest(false, null);
    expect(el.value).toBe("2");
  });

  // A success may have moved the cart past the attribute. If it rendered, these
  // nodes were replaced and this is moot; if it did not, restoring would repaint
  // a CORRECT display with a STALE attribute and create the divergence.
  it("leaves the display alone after a successful request", () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "3"; // committed and confirmed; the attribute simply has not caught up

    endRequest(true, 200);
    expect(el.value).toBe("3");
  });

  it("restores on a 422 as well as a network failure", () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "9";

    endRequest(false, 422);
    expect(el.value).toBe("2");
  });

  // v2 set `disabled`, which blurs, so it never met this case. `readonly` keeps
  // focus, so an unconditional resync would wipe an edit in progress.
  it("does not wipe the field the shopper is typing in", () => {
    document.body.innerHTML = `
      <input type="number" data-ajax-cart-quantity-input="3" value="2">
      <input type="number" data-ajax-cart-quantity-input="4" value="5">`;
    const [focused, other] = [...document.querySelectorAll("input")] as HTMLInputElement[];
    focused.value = "7";
    other.value = "8";
    focused.focus();

    endRequest(false, null);
    expect(focused.value).toBe("7"); // still being edited
    expect(other.value).toBe("5"); // resynced
  });

  it("restores every marked control, not only the one that requested", () => {
    document.body.innerHTML = `
      <input type="number" data-ajax-cart-quantity-input="1" value="2">
      <input type="number" data-ajax-cart-quantity-input="2" value="4">`;
    const [a, b] = [...document.querySelectorAll("input")] as HTMLInputElement[];
    a.value = "3";
    b.value = "9";

    endRequest(false, null);
    expect([a.value, b.value]).toEqual(["2", "4"]);
  });
});

describe("carrier validation", () => {
  // The binding and the stepper element must agree about the same markup: the
  // element requires input[type="number"], so a marker on anything else has to
  // be reported here rather than silently ignored while the element errors.
  it.each([
    ['<input type="text" data-ajax-cart-quantity-input="3" value="2">', "input"],
    ['<input data-ajax-cart-quantity-input="3" value="2">', "input"],
    ['<textarea data-ajax-cart-quantity-input="3">2</textarea>', "textarea"],
    ['<div data-ajax-cart-quantity-input="3"><span>2</span></div>', "div"],
  ])("reports a marker on %s", (html, tag) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(html);
    const el = document.querySelector(tag) as HTMLElement;

    el.dispatchEvent(new Event("change", { bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(changeMock).not.toHaveBeenCalled();
  });

  // The value attribute is the module's whole substitute for cart state, so
  // its absence disables Escape, the failure restore, the request-end resync
  // and the no-op guard at once. Liquid always renders it for a cart line, so
  // a marked input without one is a markup error, not a supported mode.
  it("reports a marked input with no value attribute", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<input type="number" data-ajax-cart-quantity-input="3">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "5";

    el.dispatchEvent(new Event("change", { bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // An empty attribute is exactly as useless as a missing one as a record of
  // the cart's quantity, and reads the same through defaultValue.
  it("reports an empty value attribute too", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="">`);
    document.querySelector("input")?.dispatchEvent(new Event("change", { bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Reports and CONTINUES, unlike the carrier and identity errors. We know the
  // line and the quantity, so the request is still correct — only the undo is
  // lost. Refusing would take the cart hostage over a missing attribute.
  it("still commits despite the missing attribute", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<input type="number" data-ajax-cart-quantity-input="3">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "5";

    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
  });

  // Escape never reaches commit(), which is why the check lives in controlFrom
  // — and Escape is the gesture that silently does nothing without the value.
  it("reports on Escape, not only on commit gestures", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<input type="number" data-ajax-cart-quantity-input="3">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "5";

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(el.value).toBe("5"); // and Escape did nothing, which is the point
  });

  // Deliberately no test that a control outside [data-ajax-cart-fragment] is
  // reported. That check was written and removed: it asserts ONE renderer's
  // markup, and the planned morph preserves nodes rather than replacing them,
  // so it would warn at markup that is fine. See controlFrom().

  it("stays silent when the attribute is present", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "5";

    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(spy).not.toHaveBeenCalled();
  });

  // Runs on every keystroke on the page, so the key is checked before the
  // control is resolved — otherwise typing anywhere would walk the DOM, and
  // typing in a mis-marked control would log once per character.
  it("does not resolve or report on an ordinary keystroke", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<input type="text" data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;

    "abc".split("").forEach((key) => {
      el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("delegation", () => {
  it("commits on a change event", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
  });

  it("ignores events from unmarked elements", async () => {
    const el = mount(`<input value="2">`) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("commits on Enter and prevents the default form submission", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    const event = new KeyboardEvent("keydown", { key: "Enter", cancelable: true, bubbles: true });
    el.dispatchEvent(event);
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
    expect(event.defaultPrevented).toBe(true);
  });

  it("restores on Escape without requesting", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();
    expect(el.value).toBe("2");
    expect(changeMock).not.toHaveBeenCalled();
  });

  // Escape cannot undo a request that has been sent, so repainting the server
  // value over an in-flight edit would make the field assert something false
  // until the render lands — 5, then 2, then 5 again.
  it("does not restore while the queue is processing", async () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5"; // committed by Enter; its request is still running

    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();
    expect(el.value).toBe("5");
    expect(changeMock).not.toHaveBeenCalled();
  });

  // The cost of the guard above, asserted so it is a decision rather than a
  // surprise: a second press once the queue idles works.
  it("restores on the next Escape once the queue is idle", async () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(el.value).toBe("5");

    isProcessingMock.mockReturnValue(false);
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await flush();
    expect(el.value).toBe("2");
  });

  it("ignores other keys", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    await flush();
    expect(el.value).toBe("5");
    expect(changeMock).not.toHaveBeenCalled();
  });
});

describe("busy state", () => {
  it("makes inputs readonly while processing and never disabled", () => {
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(el.readOnly).toBe(true);
    expect(el.disabled).toBe(false);

    isProcessingMock.mockReturnValue(false);
    applyBusyState();
    expect(el.readOnly).toBe(false);
  });

  it("keeps a focused input focused", () => {
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.focus();

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(document.activeElement).toBe(el);
  });

  // The spec singles out unconditional clearing as the deliberate reversal of a
  // design that preserved a merchant's own `readonly`. Asserting it with a lock
  // the LIBRARY set passes under either implementation, so the lock here is
  // authored in the markup — the only fixture that tells them apart.
  it("clears a merchant-authored readonly, rather than preserving it", () => {
    mount(`<input type="number" readonly data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    expect(el.readOnly).toBe(true); // as rendered

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(el.readOnly).toBe(true);

    isProcessingMock.mockReturnValue(false);
    applyBusyState();
    expect(el.readOnly).toBe(false); // the library owns it outright
  });
});

describe("initInputBinding", () => {
  it("commits on a real change event once wired", async () => {
    initInputBinding();
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
  });

  it("re-applies the busy state when a control is rendered mid-queue", () => {
    initInputBinding();
    isProcessingMock.mockReturnValue(true);
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="2">`); // fresh node, not readonly
    const el = document.querySelector("input") as HTMLInputElement;
    expect(el.readOnly).toBe(false);

    // A well-formed detail, even though this test only cares about readOnly:
    // restoreAfterFailure() shares this registration and now reads
    // detail.result.ok directly. `ok: true` makes it a no-op so it cannot
    // interfere with the assertion below.
    document.dispatchEvent(
      new CustomEvent(EVENTS.REQUEST_END, {
        detail: { result: { ok: true, status: 200, body: null, cancelled: false } },
      }),
    );
    expect(el.readOnly).toBe(true);
  });

  // Registered, but until now never dispatched here: the busy-state tests call
  // applyBusyState() directly, and the only lifecycle event this file fired was
  // request-end. Deleting either registration therefore shipped green — losing
  // queue-idle leaves every quantity field readonly for the life of the page
  // after one request, and losing queue-start leaves them editable during one.
  it("locks on queue-start and unlocks on queue-idle", () => {
    initInputBinding();
    mount(`<input type="number" data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;

    isProcessingMock.mockReturnValue(true);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    expect(el.readOnly).toBe(true);

    isProcessingMock.mockReturnValue(false);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} }));
    expect(el.readOnly).toBe(false);
  });
});
