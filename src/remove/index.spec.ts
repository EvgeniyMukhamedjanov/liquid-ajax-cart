// src/remove/index.spec.ts
// End-to-end against the REAL core (no vi.mock("../core")): only `fetch` is
// stubbed. remove.spec.ts mocks change()/isProcessing() directly, which is
// exactly right for testing remove.ts's own logic — but it cannot exercise the
// real Queue's locking, since the mock's isProcessing() only returns whatever
// a test last set it to. This file exists for the one claim that requires the
// real queue: isProcessing() flips to true SYNCHRONOUSLY, before commit()'s
// first await (queue.ts:41-42) — so two clicks fired back to back in the same
// synchronous turn must still produce exactly one request.
import { afterEach, describe, it, expect, vi } from "vitest";
import "./index";
import { isProcessing } from "../core";

function mount(html: string): Element {
  document.body.innerHTML = html;
  return document.body.firstElementChild as Element;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Resolves the fetch, running `during` at the moment the request is in flight. */
function fetchSpyRunning(response: Response, during: () => void) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    during();
    return response;
  });
}

/**
 * Waits for the queue to finish draining, by polling rather than a fixed
 * delay. `click()` fires `commit()` fully detached (`handleClick` never
 * awaits it), so unlike css-classes/index.spec.ts — which awaits `change()`
 * directly and uses a plain `setTimeout(…, 0)` only as a secondary wait for
 * the queue-idle release *after* that — this is the only synchronization
 * point, and a single macrotask tick proved too little: a real `fetch()` /
 * `Response.json()` round trip in Chromium takes more than one.
 */
const settle = () => vi.waitFor(() => expect(isProcessing()).toBe(false));

function click(el: Element): void {
  el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("remove module — end to end", () => {
  it("sends exactly one request for a synchronous double click on the same control", async () => {
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ item_count: 0 }, 200));

    // Both dispatched in the same synchronous turn — no `await` between them —
    // so this only stays at one request if isProcessing() is already true by
    // the time the second click's commit() reads it.
    click(el);
    click(el);
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  // No no-op guard, no dedup: unlike a double-click racing the same synchronous
  // turn, two clicks separated by a full request each get their own — this is
  // what "drop while busy" is deliberately NOT extended to.
  it("sends two independent requests for two sequential clicks", async () => {
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ item_count: 0 }, 200));

    click(el);
    await settle();
    click(el);
    await settle();

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("marks the control aria-disabled while the real request is in flight, and clears it after", async () => {
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    let disabledDuring = false;
    fetchSpyRunning(jsonResponse({ item_count: 0 }, 200), () => {
      disabledDuring = el.getAttribute("aria-disabled") === "true";
    });

    click(el);
    await settle();

    expect(disabledDuring).toBe(true);
    expect(el.hasAttribute("aria-disabled")).toBe(false);
    expect(isProcessing()).toBe(false);
  });

  // status === null (network failure): api.ts catches it internally and
  // resolves — never rejects — so the queue still drains through onEnd/onIdle
  // normally. Busy state must not get stuck just because the request failed.
  it("clears aria-disabled even after a network failure", async () => {
    const el = mount(`<a data-ajax-cart-remove="3">Remove</a>`);
    let disabledDuring = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      disabledDuring = el.getAttribute("aria-disabled") === "true";
      throw new TypeError("Failed to fetch");
    });

    click(el);
    await settle();

    expect(disabledDuring).toBe(true);
    expect(el.hasAttribute("aria-disabled")).toBe(false);
  });
});
