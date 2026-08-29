// src/css-classes/index.spec.ts
// End-to-end: importing the module registers the listeners; a real core.change()
// with a mocked fetch drives REQUEST_START (mark) and REQUEST_END (release).
//
// css-classes is imported BEFORE sections here, the opposite of src/index.ts, to
// exercise the claim that this module's import position does not matter. It
// subscribes on the DOM event path, which emitter.ts dispatches only after every
// internal listener — including the one sections renders from — has settled.
import { describe, it, expect, afterEach, vi } from "vitest";
import "./index";
import "../sections";
import { change, add, clear } from "../core";

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
afterEach(() => {
  mounted.forEach((el) => el.remove());
  mounted = [];
  vi.restoreAllMocks();
});

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function body(entries: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(entries).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

/** Resolves the fetch, running `during` at the moment the request is in flight. */
function fetchSpyRunning(response: Response, during: () => void) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    during();
    return response;
  });
}

/**
 * Lets the queue finish draining.
 *
 * `await change()` is NOT enough to see the global class cleared: queue.ts calls
 * `item.resolve()` and only reaches `onIdle()` after awaiting its queue-end hook,
 * so the caller's continuation is queued first and runs before QUEUE_IDLE fires.
 */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("css-classes module — end to end", () => {
  it("sets the init class on import", () => {
    expect(document.documentElement.classList.contains(INIT)).toBe(true);
  });

  it("marks the addressed line busy while the request runs, and releases it after", async () => {
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    let busyDuring = false;
    let globalDuring = false;
    fetchSpyRunning(jsonResponse({ item_count: 1 }, 200), () => {
      busyDuring = root.firstElementChild!.classList.contains(ITEM_BUSY);
      globalDuring = document.documentElement.classList.contains(BUSY);
    });

    await change(body({ line: "2", quantity: "3" }));

    expect(busyDuring).toBe(true);
    expect(globalDuring).toBe(true);
    // Per-line releases on REQUEST_END, so it is already clear here.
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);

    await settle();
    expect(document.documentElement.classList.contains(BUSY)).toBe(false);
  });

  it("marks removing while a quantity-0 change runs", async () => {
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    let removingDuring = false;
    fetchSpyRunning(jsonResponse({ item_count: 0 }, 200), () => {
      removingDuring = root.firstElementChild!.classList.contains(ITEM_REMOVING);
    });

    await change(body({ line: "2", quantity: "0" }));

    expect(removingDuring).toBe(true);
  });

  it("never strips the removing class off a live node — the render lands first", async () => {
    // The flash guard. If this module ran before sections, project() would remove
    // `removing` from the still-attached row (snapping it back to full opacity)
    // and only then would the render replace it. Because sections goes first, the
    // row is already detached and project() never visits it — so no class
    // mutation is ever recorded inside the fragment.
    const root = mount(
      `<div data-ajax-cart-fragment="cart/lines"><div ${ATTR}="1 ${KEY}"></div></div>`,
    );
    const fragment = root.firstElementChild!;

    const seen: string[] = [];
    const observer = new MutationObserver((records) => {
      records.forEach((r) => {
        seen.push(r.type === "attributes" ? `attr:${r.attributeName}` : "childList");
      });
    });

    // Observation starts INSIDE the fetch — after REQUEST_START has applied the
    // class, so the two mutations that adds are not counted. Everything recorded
    // from here belongs to REQUEST_END.
    fetchSpyRunning(
      jsonResponse(
        {
          item_count: 0,
          // The line is gone, so the re-rendered fragment no longer holds it.
          sections: { cart: `<div data-ajax-cart-fragment="cart/lines"></div>` },
        },
        200,
      ),
      () => {
        expect(fragment.firstElementChild!.classList.contains(ITEM_REMOVING)).toBe(true);
        observer.observe(fragment, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });
      },
    );

    await change(body({ line: "1", quantity: "0" }));
    await settle();
    observer.disconnect();

    // Only the render. No class was taken off a still-attached node, which is
    // what a flash would look like.
    expect(seen).toContain("childList");
    expect(seen.filter((s) => s.startsWith("attr:"))).toEqual([]);
    expect(fragment.querySelectorAll(`[${ATTR}]`)).toHaveLength(0);
  });

  it("leaves no stale class on a row the render brings back", async () => {
    const root = mount(
      `<div data-ajax-cart-fragment="cart/lines"><div ${ATTR}="1 ${KEY}"></div></div>`,
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          item_count: 1,
          sections: {
            cart: `<div data-ajax-cart-fragment="cart/lines"><div ${ATTR}="1 ${KEY}"></div></div>`,
          },
        },
        200,
      ),
    );

    await change(body({ line: "1", quantity: "2" }));

    const row = root.querySelector(`[${ATTR}]`)!;
    expect(row.classList.contains(ITEM_BUSY)).toBe(false);
    expect(row.classList.contains(ITEM_REMOVING)).toBe(false);
  });

  it("releases the class on a 422", async () => {
    const root = mount(`<div ${ATTR}="2"></div>`);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ status: 422, description: "Not enough stock." }, 422),
    );

    await change(body({ line: "2", quantity: "9" }));

    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("releases removing when a quantity-0 change is rejected with a 422", async () => {
    // The third surviving-element path: the line still exists after the
    // rejection — a quantity-rule violation, say. The element sits outside any
    // fragment, so nothing re-renders it and project() is the only thing that
    // can put it back.
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    let removingDuring = false;
    fetchSpyRunning(
      jsonResponse(
        { status: 422, message: "Cart Error", description: "Quantity must be at least 6." },
        422,
      ),
      () => {
        removingDuring = root.firstElementChild!.classList.contains(ITEM_REMOVING);
      },
    );

    await change(body({ line: "2", quantity: "0" }));

    // Asserted, so this cannot pass by the class never having been applied.
    expect(removingDuring).toBe(true);
    const el = root.firstElementChild!;
    expect(el.classList.contains(ITEM_REMOVING)).toBe(false);
    expect(el.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("releases the class on a network failure, where nothing re-renders", async () => {
    // status === null, so sections bails and the row survives. Deletion is the
    // only thing that restores it.
    const root = mount(`<div ${ATTR}="2"></div>`);
    let removingDuring = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      removingDuring = root.firstElementChild!.classList.contains(ITEM_REMOVING);
      throw new TypeError("Failed to fetch");
    });

    await change(body({ line: "2", quantity: "0" }));

    expect(removingDuring).toBe(true);
    const el = root.firstElementChild!;
    expect(el.classList.contains(ITEM_REMOVING)).toBe(false);
    expect(el.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("releases the class when a request-start listener aborts", async () => {
    const root = mount(`<div ${ATTR}="2"></div>`);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const abortOnStart = ((e: CustomEvent<{ abort: () => void }>) =>
      e.detail.abort()) as EventListener;
    document.addEventListener("liquid-ajax-cart:request-start", abortOnStart);

    try {
      await change(body({ line: "2", quantity: "0" }));
    } finally {
      document.removeEventListener("liquid-ajax-cart:request-start", abortOnStart);
    }

    expect(fetchMock).not.toHaveBeenCalled();
    expect(root.firstElementChild!.classList.contains(ITEM_REMOVING)).toBe(false);
  });

  it("marks the matching line on an add addressed by variant ID", async () => {
    const root = mount(`<div ${ATTR}="1 ${KEY} ${VARIANT}"></div>`);
    let busyDuring = false;
    fetchSpyRunning(jsonResponse({ item_count: 2 }, 200), () => {
      busyDuring = root.firstElementChild!.classList.contains(ITEM_BUSY);
    });

    await add(body({ id: VARIANT, quantity: "1" }));

    expect(busyDuring).toBe(true);
    expect(root.firstElementChild!.classList.contains(ITEM_BUSY)).toBe(false);
  });

  it("marks both lines of a multi-item add", async () => {
    const other = "41234567890123";
    const root = mount(`<div ${ATTR}="1 ${VARIANT}"></div><div ${ATTR}="2 ${other}"></div>`);
    let busyDuring = 0;
    fetchSpyRunning(jsonResponse({ item_count: 3 }, 200), () => {
      busyDuring = root.querySelectorAll(`.${ITEM_BUSY}`).length;
    });

    await add({
      items: [
        { id: VARIANT, quantity: 1 },
        { id: other, quantity: 2 },
      ],
    });

    expect(busyDuring).toBe(2);
    expect(root.querySelectorAll(`.${ITEM_BUSY}`)).toHaveLength(0);
  });

  it("marks nothing per-line for an add of a variant not in the cart", async () => {
    const root = mount(`<div ${ATTR}="1 ${KEY} ${VARIANT}"></div>`);
    let busyDuring = true;
    let globalDuring = false;
    fetchSpyRunning(jsonResponse({ item_count: 1 }, 200), () => {
      busyDuring = root.firstElementChild!.classList.contains(ITEM_BUSY);
      globalDuring = document.documentElement.classList.contains(BUSY);
    });

    await add(body({ id: "99999999999", quantity: "1" }));

    expect(busyDuring).toBe(false);
    expect(globalDuring).toBe(true);
  });

  it("marks every line removing during a clear", async () => {
    const root = mount(`<div ${ATTR}="1"></div><div ${ATTR}="2 ${KEY}"></div>`);
    let removingDuring = 0;
    fetchSpyRunning(jsonResponse({ item_count: 0 }, 200), () => {
      removingDuring = root.querySelectorAll(`.${ITEM_REMOVING}`).length;
    });

    await clear();

    expect(removingDuring).toBe(2);
    expect(root.querySelectorAll(`.${ITEM_REMOVING}`)).toHaveLength(0);
  });
});
