// src/sections/index.spec.ts
// End-to-end: importing the module registers the listeners; a real core.add()
// with a mocked fetch drives REQUEST_START (param injection) and REQUEST_END
// (render) through the queue + emitter.
import { describe, it, expect, afterEach, vi } from "vitest";
import "./index"; // side-effect: registers listeners on the core emitter
import { add } from "../core";

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

describe("sections module — end to end", () => {
  it("re-renders an on-page fragment after a successful add()", async () => {
    const root = mount(`<span data-ajax-cart-fragment="cart/icon">0</span>`);

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [],
          sections: { cart: `<span data-ajax-cart-fragment="cart/icon">1</span>` },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await add(new FormData());

    // REQUEST_START injected the bundled param:
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.body as FormData).get("sections")).toBe("cart");
    // REQUEST_END rendered the fresh fragment:
    expect(root.querySelector('[data-ajax-cart-fragment="cart/icon"]')!.textContent).toBe("1");
  });
});
