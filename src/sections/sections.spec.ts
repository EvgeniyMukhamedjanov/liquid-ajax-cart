import { describe, it, expect, afterEach, vi } from "vitest";
import {
  parseToken,
  collectSectionIds,
  renderSections,
  buildSectionsParam,
  injectSections,
  fetchSections,
  reconcile,
  handleRequestStart,
  handleRequestEnd,
} from "./sections";
import type { RequestBody, RequestResult } from "../core";

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
});

describe("parseToken", () => {
  it("splits on the first slash", () => {
    expect(parseToken("cart/icon")).toEqual({ sectionId: "cart", name: "icon" });
    expect(parseToken("a/b/c")).toEqual({ sectionId: "a", name: "b/c" });
  });
  it("rejects tokens without both parts", () => {
    expect(parseToken("cart")).toBeNull();
    expect(parseToken("/icon")).toBeNull();
    expect(parseToken("cart/")).toBeNull();
    expect(parseToken("")).toBeNull();
    expect(parseToken(null)).toBeNull();
  });
});

describe("collectSectionIds", () => {
  it("returns distinct section ids in DOM order", () => {
    const root = mount(`
      <div data-ajax-cart-fragment="cart/icon"></div>
      <div data-ajax-cart-fragment="cart/drawer"></div>
      <div data-ajax-cart-fragment="header/note"></div>
      <div data-ajax-cart-fragment="bad-token"></div>
    `);
    expect(collectSectionIds(root)).toEqual(["cart", "header"]);
  });
});

describe("renderSections", () => {
  it("writes the source fragment's children into matching on-page targets", () => {
    const root = mount(`<span data-ajax-cart-fragment="cart/icon">0</span>`);
    renderSections({ cart: `<span data-ajax-cart-fragment="cart/icon"><b>3</b></span>` }, root);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/icon"]')!.innerHTML).toBe("<b>3</b>");
  });

  it("updates every on-page target sharing a token (mirror)", () => {
    const root = mount(`
      <span class="a" data-ajax-cart-fragment="cart/icon">0</span>
      <span class="b" data-ajax-cart-fragment="cart/icon">0</span>
    `);
    renderSections({ cart: `<i data-ajax-cart-fragment="cart/icon">9</i>` }, root);
    expect(root.querySelector(".a")!.textContent).toBe("9");
    expect(root.querySelector(".b")!.textContent).toBe("9");
  });

  it("clears a target whose name is absent from the rendered section", () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/promo">SALE</div>`);
    renderSections({ cart: `<div data-ajax-cart-fragment="cart/other">x</div>` }, root);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/promo"]')!.textContent).toBe("");
  });

  it("ignores fragments belonging to a different section in the parsed HTML", () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/body">old</div>`);
    renderSections(
      {
        cart: `<div data-ajax-cart-fragment="header/x">nope</div><div data-ajax-cart-fragment="cart/body">new</div>`,
      },
      root,
    );
    expect(root.querySelector('[data-ajax-cart-fragment="cart/body"]')!.textContent).toBe("new");
  });

  it("strips loading=lazy from incoming images", () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/body">old</div>`);
    renderSections(
      { cart: `<div data-ajax-cart-fragment="cart/body"><img loading="lazy" src="x"></div>` },
      root,
    );
    expect(root.querySelector("img")!.hasAttribute("loading")).toBe(false);
  });

  it("does not touch targets of a section absent from the input map", () => {
    const root = mount(`<div data-ajax-cart-fragment="header/note">keep</div>`);
    renderSections({ cart: `<div data-ajax-cart-fragment="cart/x">y</div>` }, root);
    expect(root.querySelector('[data-ajax-cart-fragment="header/note"]')!.textContent).toBe("keep");
  });

  it("mirrors a <template> source's content into a visible target (header cart-count)", () => {
    // the on-page visible mirror target lives elsewhere (e.g. the header)
    const root = mount(`<span data-ajax-cart-fragment="my-cart/header-count">0</span>`);
    // the freshly-rendered section carries the source as an inert <template>
    renderSections(
      {
        "my-cart": `<template data-ajax-cart-fragment="my-cart/header-count"><b>3</b></template>`,
      },
      root,
    );
    expect(root.querySelector('[data-ajax-cart-fragment="my-cart/header-count"]')!.innerHTML).toBe(
      "<b>3</b>",
    );
  });

  it("updates an on-page <template> target's content in place", () => {
    const root = mount(
      `<template data-ajax-cart-fragment="my-cart/header-count">0</template>`,
    );
    renderSections(
      {
        "my-cart": `<template data-ajax-cart-fragment="my-cart/header-count"><b>7</b></template>`,
      },
      root,
    );
    const tpl = root.querySelector(
      '[data-ajax-cart-fragment="my-cart/header-count"]',
    ) as HTMLTemplateElement;
    expect(tpl.content.querySelector("b")!.textContent).toBe("7");
  });

  it("clears a section's fragments (and warns per fragment) when it returns empty HTML", () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">gone</div>`);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderSections({ cart: "" }, root);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("cart/x"));
    warn.mockRestore();
  });

  it("uses the first of duplicate fragment tokens in the rendered section (and warns)", () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">old</div>`);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderSections(
      {
        cart: `<div data-ajax-cart-fragment="cart/x">first</div><div data-ajax-cart-fragment="cart/x">second</div>`,
      },
      root,
    );
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("first");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("buildSectionsParam", () => {
  it("merges and dedupes existing + new ids", () => {
    expect(buildSectionsParam("cart, footer", ["cart", "header"])).toBe("cart,footer,header");
  });
  it("handles a null/empty existing value", () => {
    expect(buildSectionsParam(null, ["cart"])).toBe("cart");
    expect(buildSectionsParam("", ["cart"])).toBe("cart");
  });
  it("caps the merged result at 5 ids", () => {
    expect(buildSectionsParam("a,b,c,d,e,f", ["g"])).toBe("a,b,c,d,e");
    expect(buildSectionsParam(null, ["a", "b", "c", "d", "e", "f"])).toBe("a,b,c,d,e");
  });
});

describe("injectSections", () => {
  it("sets the sections key on a FormData body", () => {
    const fd = new FormData();
    fd.append("id", "1");
    injectSections(fd, ["cart", "header"]);
    expect(fd.get("sections")).toBe("cart,header");
  });
  it("merges with a FormData body that already has sections", () => {
    const fd = new FormData();
    fd.set("sections", "cart");
    injectSections(fd, ["cart", "header"]);
    expect(fd.get("sections")).toBe("cart,header");
  });
  it("sets the sections key on a plain-object body", () => {
    const body: RequestBody = { id: 1 } as unknown as RequestBody;
    injectSections(body, ["cart"]);
    expect((body as Record<string, unknown>).sections).toBe("cart");
  });
  it("merges with a plain-object body that already has a sections string", () => {
    const body: RequestBody = { id: 1, sections: "cart" } as unknown as RequestBody;
    injectSections(body, ["cart", "header"]);
    expect((body as Record<string, unknown>).sections).toBe("cart,header");
  });
  it("sets the sections key on a URLSearchParams body", () => {
    const params = new URLSearchParams();
    params.append("id", "1");
    injectSections(params as unknown as RequestBody, ["cart", "header"]);
    expect(params.get("sections")).toBe("cart,header");
  });
  it("merges with a URLSearchParams body that already has sections", () => {
    const params = new URLSearchParams();
    params.set("sections", "cart");
    injectSections(params as unknown as RequestBody, ["cart", "header"]);
    expect(params.get("sections")).toBe("cart,header");
  });
});

describe("fetchSections", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { Shopify?: unknown }).Shopify;
  });

  it("requests GET /?sections=<ids> and returns the merged map", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ cart: "<c>" }), { status: 200 }));
    const out = await fetchSections(["cart"]);
    expect(out).toEqual({ cart: "<c>" });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("?sections=cart");
  });

  it("chunks ids into batches of 5 and merges results", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ a: "1", b: "2", c: "3", d: "4", e: "5" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ f: "6", g: "7" }), { status: 200 }));
    const out = await fetchSections(["a", "b", "c", "d", "e", "f", "g"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Object.keys(out)).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
  });

  it("swallows a network error and returns what it has", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(fetchSections(["cart"])).resolves.toEqual({});
    expect(warn).toHaveBeenCalled();
  });

  it("warns and skips a chunk on a non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 500 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(fetchSections(["cart"])).resolves.toEqual({});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("500"));
  });

  it("keeps only string-valued sections and drops the rest with a warning", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ cart: "<c>", broken: 123, nested: { x: 1 }, empty: null }),
        { status: 200 },
      ),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = await fetchSections(["cart", "broken", "nested", "empty"]);
    expect(out).toEqual({ cart: "<c>" });
    expect(warn).toHaveBeenCalled();
  });

  it("warns and skips a chunk when the payload is not an object", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify("oops"), { status: 200 }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(fetchSections(["cart"])).resolves.toEqual({});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("non-object"));
  });

  it("rejects an array payload as an unexpected (non-object) shape", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(["<a>", "<b>"]), { status: 200 }),
    );
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(fetchSections(["cart"])).resolves.toEqual({});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("non-object"));
  });

  it("keeps successful chunks when a later chunk fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ a: "1", b: "2", c: "3", d: "4", e: "5" }), { status: 200 }),
      )
      .mockResolvedValueOnce(new Response("", { status: 500 }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(fetchSections(["a", "b", "c", "d", "e", "f"])).resolves.toEqual({
      a: "1",
      b: "2",
      c: "3",
      d: "4",
      e: "5",
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("500"));
  });

  it("respects window.Shopify.routes.root", async () => {
    (window as { Shopify?: unknown }).Shopify = { routes: { root: "/en/" } };
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("{}", { status: 200 }));
    await fetchSections(["cart"]);
    expect(fetchMock.mock.calls[0][0]).toContain("/en/?sections=cart");
  });
});

describe("reconcile", () => {
  it("does nothing when status is null (abort/network)", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">keep</div>`);
    const fetchMissing = vi.fn();
    await reconcile({ ok: false, status: null, body: null } as RequestResult, fetchMissing, root);
    expect(fetchMissing).not.toHaveBeenCalled();
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("keep");
  });

  it("renders bundled sections and fetches nothing when all are provided", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">old</div>`);
    const fetchMissing = vi.fn();
    await reconcile(
      {
        ok: true,
        status: 200,
        body: { sections: { cart: `<div data-ajax-cart-fragment="cart/x">new</div>` } },
      } as RequestResult,
      fetchMissing,
      root,
    );
    expect(fetchMissing).not.toHaveBeenCalled();
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("new");
  });

  it("fetches the leftover sections not present in the response", async () => {
    const root = mount(`
      <div data-ajax-cart-fragment="cart/x">old</div>
      <div data-ajax-cart-fragment="header/y">old</div>
    `);
    const fetchMissing = vi.fn(async () => ({
      header: `<div data-ajax-cart-fragment="header/y">fresh</div>`,
    }));
    await reconcile(
      {
        ok: true,
        status: 200,
        body: { sections: { cart: `<div data-ajax-cart-fragment="cart/x">new</div>` } },
      } as RequestResult,
      fetchMissing,
      root,
    );
    expect(fetchMissing).toHaveBeenCalledWith(["header"]);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("new");
    expect(root.querySelector('[data-ajax-cart-fragment="header/y"]')!.textContent).toBe("fresh");
  });

  it("re-renders on an error response with no sections by fetching all on-page sections", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">old</div>`);
    const fetchMissing = vi.fn(async () => ({
      cart: `<div data-ajax-cart-fragment="cart/x">truth</div>`,
    }));
    await reconcile(
      { ok: false, status: 422, body: { message: "nope" } } as RequestResult,
      fetchMissing,
      root,
    );
    expect(fetchMissing).toHaveBeenCalledWith(["cart"]);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("truth");
  });

  it("ignores non-string bundled sections and re-fetches them instead", async () => {
    const root = mount(`
      <div data-ajax-cart-fragment="cart/x">old</div>
      <div data-ajax-cart-fragment="broken/y">old</div>
    `);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMissing = vi.fn(async () => ({
      broken: `<div data-ajax-cart-fragment="broken/y">healed</div>`,
    }));
    await reconcile(
      {
        ok: true,
        status: 200,
        body: {
          sections: {
            cart: `<div data-ajax-cart-fragment="cart/x">new</div>`,
            broken: 123, // malformed value from the response
          },
        },
      } as unknown as RequestResult,
      fetchMissing,
      root,
    );
    // the bad "broken" value is dropped, so it is treated as missing and re-fetched
    expect(fetchMissing).toHaveBeenCalledWith(["broken"]);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("new");
    expect(root.querySelector('[data-ajax-cart-fragment="broken/y"]')!.textContent).toBe("healed");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("clears fragments without re-fetching when a bundled section is an empty string", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">old</div>`);
    const fetchMissing = vi.fn();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await reconcile(
      { ok: true, status: 200, body: { sections: { cart: "" } } } as RequestResult,
      fetchMissing,
      root,
    );
    // "" is a valid string, so it counts as provided and is not re-fetched...
    expect(fetchMissing).not.toHaveBeenCalled();
    // ...and renderSections finds no source fragment, so the target is cleared.
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("");
    warn.mockRestore();
  });

  it("leaves a section's targets unchanged when it cannot be fetched", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">keep</div>`);
    const fetchMissing = vi.fn(async () => ({})); // fetch returned nothing for cart
    await reconcile({ ok: false, status: 422, body: {} } as RequestResult, fetchMissing, root);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("keep");
  });
});

describe("handleRequestStart", () => {
  it("injects the first 5 on-page sections into a FormData body", async () => {
    const root = mount(
      ["a", "b", "c", "d", "e", "f"]
        .map((s) => `<div data-ajax-cart-fragment="${s}/x"></div>`)
        .join(""),
    );
    void root;
    const body = new FormData();
    await handleRequestStart({ endpoint: "add", body });
    expect(body.get("sections")).toBe("a,b,c,d,e"); // capped at 5
  });

  it("never emits more than 5 sections, even merged with merchant-set ones", async () => {
    mount(
      ["p1", "p2", "p3"].map((s) => `<div data-ajax-cart-fragment="${s}/x"></div>`).join(""),
    );
    const body = new FormData();
    body.set("sections", "m1,m2,m3"); // merchant already requested 3
    await handleRequestStart({ endpoint: "add", body });
    const sections = String(body.get("sections")).split(",");
    expect(sections.length).toBeLessThanOrEqual(5);
    // merchant's sections are preserved (ours self-heal via reconcile, theirs don't)
    expect(sections).toEqual(["m1", "m2", "m3", "p1", "p2"]);
  });

  it("does nothing for the get endpoint", async () => {
    mount(`<div data-ajax-cart-fragment="cart/x"></div>`);
    const body = new FormData();
    await handleRequestStart({ endpoint: "get", body });
    expect(body.get("sections")).toBeNull();
  });

  it("does nothing when the body is null (e.g. clear)", async () => {
    mount(`<div data-ajax-cart-fragment="cart/x"></div>`);
    await expect(handleRequestStart({ endpoint: "clear", body: null })).resolves.toBeUndefined();
  });
});

describe("handleRequestEnd", () => {
  it("reconciles and renders from the result", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">old</div>`);
    await handleRequestEnd({
      result: {
        ok: true,
        status: 200,
        body: { sections: { cart: `<div data-ajax-cart-fragment="cart/x">new</div>` } },
      },
    });
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("new");
  });
});
