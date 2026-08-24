// src/line-item-errors/index.spec.ts
// End-to-end: importing the module registers the listeners; a real core.change()
// with a mocked fetch drives REQUEST_START (clear) and REQUEST_END (render).
//
// The sections module is imported first here, exactly as src/index.ts orders
// them, so the ordering contract is exercised rather than assumed: sections
// replaces the fragment on a 422, and the error must survive that render.
import { describe, it, expect, afterEach, vi } from "vitest";
import "../sections";
import "./index";
import { change } from "../core";

const ATTR = "data-ajax-cart-item-error";
const KEY = "39897499729985:b1fca88d0e8bf5290f306f808785f744";

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

describe("line-item-errors module — end to end", () => {
  it("renders a 422 error next to the addressed line", async () => {
    const root = mount(`<div ${ATTR}="2 ${KEY}"></div>`);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          status: 422,
          message: "Cart Error",
          description: "You can't add more Health potion to the cart.",
        },
        422,
      ),
    );

    await change(body({ line: "2", quantity: "9" }));

    expect(root.firstElementChild!.textContent).toBe(
      "You can't add more Health potion to the cart.",
    );
  });

  it("survives the sections re-render that a 422 triggers", async () => {
    // The slot lives inside a fragment, so the 422 response's section HTML
    // replaces the node before this module writes into it. Registration order
    // in src/index.ts is what makes the error land on the fresh node.
    const root = mount(
      `<div data-ajax-cart-fragment="cart/lines"><div ${ATTR}="2">stale</div></div>`,
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          status: 422,
          description: "Not enough stock.",
          sections: {
            cart: `<div data-ajax-cart-fragment="cart/lines"><div ${ATTR}="2"></div></div>`,
          },
        },
        422,
      ),
    );

    await change(body({ line: "2", quantity: "9" }));

    const slots = root.querySelectorAll(`[${ATTR}="2"]`);
    expect(slots).toHaveLength(1);
    expect(slots[0].textContent).toBe("Not enough stock.");
  });

  it("clears a previous error when the next request starts", async () => {
    const root = mount(`<div ${ATTR}="2">previous error</div>`);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(jsonResponse({ items: [] }, 200));

    await change(body({ line: "2", quantity: "1" }));

    expect(root.firstElementChild!.textContent).toBe("");
  });

  it("stays silent when a request-start listener aborts the request", async () => {
    const root = mount(`<div ${ATTR}="2">previous error</div>`);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const abortOnStart = ((e: CustomEvent<{ abort: () => void }>) =>
      e.detail.abort()) as EventListener;
    document.addEventListener("liquid-ajax-cart:request-start", abortOnStart);

    try {
      await change(body({ line: "2", quantity: "1" }));
    } finally {
      document.removeEventListener("liquid-ajax-cart:request-start", abortOnStart);
    }

    expect(fetchMock).not.toHaveBeenCalled();
    // Cleared by request-start, and NOT replaced by an error message.
    expect(root.firstElementChild!.textContent).toBe("");
  });
});
