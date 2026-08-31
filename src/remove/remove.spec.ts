import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

// Stub the request layer so commits are observable without hitting fetch or the
// queue. EVENTS and the rest of core stay real.
vi.mock("../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core")>();
  return { ...actual, change: vi.fn(), isProcessing: vi.fn(() => false) };
});

import { change, isProcessing, EVENTS } from "../core";
import { commit, applyBusyState, initRemove } from "./remove";

const changeMock = vi.mocked(change);
const isProcessingMock = vi.mocked(isProcessing);

// Registered once, through the real init path, exactly like
// quantity-input.spec.ts: a teardown that adds/removes the same module-level
// handler per test cannot tell its own registration from production's.
initRemove();

function mount(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild as Element;
}

/** Reads a FormData body from the nth call to change(). */
function sentBody(call = 0): Record<string, string> {
  const body = changeMock.mock.calls[call][0] as FormData;
  return Object.fromEntries([...body.entries()].map(([k, v]) => [k, String(v)]));
}

/** Lets the floating promise inside the delegated click handler settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

beforeEach(() => {
  changeMock.mockReset();
  changeMock.mockResolvedValue({ ok: true, status: 200, body: {}, cancelled: false });
  isProcessingMock.mockReset();
  isProcessingMock.mockReturnValue(false);
});

afterEach(() => {
  document.body.innerHTML = "";
  // Unconditional: a test that fails before its own spy.mockRestore() would
  // otherwise leave console.error spied and corrupt every test after it.
  vi.restoreAllMocks();
});

describe("commit", () => {
  it("sends line and quantity=0 for a line identity", async () => {
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "0" });
  });

  it("sends id and quantity=0 for a key identity", async () => {
    const el = mount(`<a data-ajax-cart-remove="123:abc">Remove</a>`);
    await commit(el);
    expect(sentBody()).toEqual({ id: "123:abc", quantity: "0" });
  });

  it("passes trigger metadata", async () => {
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    await commit(el);
    expect(changeMock.mock.calls[0][1]).toEqual({
      trigger: { source: "remove", initiator: el },
    });
  });

  it("errors and sends nothing when the identity is invalid", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(`<a data-ajax-cart-remove="abc">Remove</a>`);
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Bounded by user action (one click = one gesture), same as
  // quantity-input.ts's commit(): a per-node dedup guard would not survive a
  // render anyway, since a removed or re-rendered line gets a fresh node.
  it("reports on every invalid commit, not deduped", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(`<a data-ajax-cart-remove="abc">Remove</a>`);
    await commit(el);
    await commit(el);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("does nothing while the queue is processing", async () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
  });
});

describe("click resolution", () => {
  it("commits on a click", async () => {
    const el = mount(`<a href="#" data-ajax-cart-remove="3">Remove</a>`);
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "0" });
  });

  it("prevents default navigation", () => {
    const el = mount(
      `<a href="/cart/change?line=3&quantity=0" data-ajax-cart-remove="3">Remove</a>`,
    );
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  // `Element`, not `HTMLElement`, in the resolver: an inline <svg>/<path> icon
  // inside the marker extends Element only. Same reasoning as
  // quantity-element.ts's #onClick.
  it("resolves through an icon child via closest()", async () => {
    document.body.innerHTML = `<button data-ajax-cart-remove="3"><svg><path></path></svg></button>`;
    const path = document.querySelector("path") as unknown as Element;
    path.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "0" });
  });

  it("ignores a click outside any marker", async () => {
    const el = mount(`<button>Not a remove button</button>`);
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();
    expect(changeMock).not.toHaveBeenCalled();
  });

  // `document` itself (not an Element) is a real, reachable event.target — any
  // click that lands on empty space inside the viewport bubbles with `target`
  // set to `document.documentElement` or, for a synthetic dispatch on
  // `document`, to `document` itself. `document.closest` does not exist, so a
  // missing `instanceof Element` guard would throw out of the delegated
  // listener instead of silently ignoring the click.
  it("does not throw when the click target is not an Element", async () => {
    expect(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    }).not.toThrow();
    await flush();
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("prevents default even while the queue is processing", () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(`<a href="#" data-ajax-cart-remove="3">Remove</a>`);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("prevents default even with an invalid identity", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(`<a href="#" data-ajax-cart-remove="abc">Remove</a>`);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    await flush();
    expect(event.defaultPrevented).toBe(true);
    expect(changeMock).not.toHaveBeenCalled();
  });
});

describe("busy state", () => {
  it("sets aria-disabled while processing and clears it when idle", () => {
    mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    const el = document.querySelector("[data-ajax-cart-remove]") as Element;

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(el.getAttribute("aria-disabled")).toBe("true");

    isProcessingMock.mockReturnValue(false);
    applyBusyState();
    expect(el.hasAttribute("aria-disabled")).toBe(false);
  });

  it("never sets disabled", () => {
    mount(`<button data-ajax-cart-remove="3">Remove</button>`);
    const el = document.querySelector("button") as HTMLButtonElement;
    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(el.disabled).toBe(false);
  });

  it("keeps a focused control focused", () => {
    mount(`<button data-ajax-cart-remove="3">Remove</button>`);
    const el = document.querySelector("button") as HTMLButtonElement;
    el.focus();
    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(document.activeElement).toBe(el);
  });
});

describe("initRemove", () => {
  it("commits on a real click event once wired", async () => {
    initRemove();
    const el = mount(`<a href="#" data-ajax-cart-remove="3">Remove</a>`);
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "0" });
  });

  it("re-applies busy state on request-end", () => {
    initRemove();
    isProcessingMock.mockReturnValue(true);
    mount(`<a data-ajax-cart-remove="3">Remove</a>`); // fresh node, not yet marked
    const el = document.querySelector("[data-ajax-cart-remove]") as Element;
    expect(el.hasAttribute("aria-disabled")).toBe(false);

    document.dispatchEvent(
      new CustomEvent(EVENTS.REQUEST_END, {
        detail: { result: { ok: true, status: 200, body: null, cancelled: false } },
      }),
    );
    expect(el.getAttribute("aria-disabled")).toBe("true");
  });

  it("locks on queue-start and unlocks on queue-idle", () => {
    initRemove();
    mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    const el = document.querySelector("[data-ajax-cart-remove]") as Element;

    isProcessingMock.mockReturnValue(true);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    expect(el.getAttribute("aria-disabled")).toBe("true");

    isProcessingMock.mockReturnValue(false);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} }));
    expect(el.hasAttribute("aria-disabled")).toBe(false);
  });
});
