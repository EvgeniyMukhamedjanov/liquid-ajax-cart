# Sections Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the presentational sections module that re-renders `data-ajax-cart-fragment` containers from freshly-rendered Shopify section HTML after each cart mutation.

**Architecture:** Pure helpers (token parsing, id collection, render) plus two lifecycle listeners registered on the core emitter. `REQUEST_START` injects a bundled `sections=` param (≤5) into the cart request body in place; `REQUEST_END` reconciles every on-page section to server truth — rendering what the response bundled and fetching any leftover via the Section Rendering API (`GET /?sections=`) in the same awaited queue step. The single DOM-mutation point is `applyContent`, a swappable seam (default `replaceChildren`; morph later).

**Tech Stack:** TypeScript (ES2022), Vitest in a real browser via `@vitest/browser-playwright`. Tests run with `npx vitest run <path>`.

**Spec:** `V3-SECTIONS.md`.

**Commits:** This plan does **not** auto-commit. Each task ends with an *optional* commit checkpoint — run it only if the user asks; otherwise skip and continue.

---

## File Structure

```
src/sections/
  apply-content.ts        ← applyContent seam (default: replaceChildren). One responsibility: mutate a target.
  apply-content.spec.ts
  sections.ts             ← parseToken, collectSectionIds, renderSections, injectSections,
                            fetchSections, reconcile, handleRequestStart, handleRequestEnd
  sections.spec.ts
  index.ts                ← side-effect init: registers the two listeners on the core emitter
src/index.ts              ← MODIFY: add `import "./sections";`
```

`sections.ts` exports small, individually-testable functions; `index.ts` is the only stateful/side-effecting file (it calls `on(...)` at import time).

Shared constant (defined once at the top of `sections.ts`):
```ts
const FRAGMENT_ATTR = "data-ajax-cart-fragment";
const SECTIONS_PER_REQUEST = 5;
```

---

## Task 1: `applyContent` seam

**Files:**
- Create: `src/sections/apply-content.ts`
- Test: `src/sections/apply-content.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/sections/apply-content.spec.ts
import { describe, it, expect } from "vitest";
import { applyContent } from "./apply-content";

function el(html: string): HTMLElement {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.firstElementChild as HTMLElement;
}

describe("applyContent", () => {
  it("replaces the target's children with clones of the source's children", () => {
    const target = el(`<div><span>old</span></div>`);
    const source = el(`<div><b>new</b> text</div>`);
    applyContent(target, source);
    expect(target.innerHTML).toBe("<b>new</b> text");
  });

  it("does not move nodes out of the source (clones, not adopts)", () => {
    const target = el(`<div></div>`);
    const source = el(`<div><i>x</i></div>`);
    applyContent(target, source);
    expect(source.innerHTML).toBe("<i>x</i>"); // source untouched
    expect(target.querySelector("i")).not.toBe(source.querySelector("i"));
  });

  it("clears the target when the source is empty", () => {
    const target = el(`<div><span>old</span></div>`);
    const source = el(`<div></div>`);
    applyContent(target, source);
    expect(target.childNodes.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/apply-content.spec.ts`
Expected: FAIL — `Failed to resolve import "./apply-content"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sections/apply-content.ts

// The single seam where the live DOM is mutated. A future morph strategy
// swaps this out; nothing else in the module changes. Children are cloned via
// importNode so the parsed source document is never mutated or drained.
export function applyContent(target: Element, source: Element): void {
  target.replaceChildren(
    ...Array.from(source.childNodes, (node) => document.importNode(node, true)),
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/apply-content.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/apply-content.ts src/sections/apply-content.spec.ts
git commit -m "feat(sections): add applyContent seam"
```

---

## Task 2: `parseToken` and `collectSectionIds`

**Files:**
- Create: `src/sections/sections.ts`
- Test: `src/sections/sections.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/sections/sections.spec.ts
import { describe, it, expect, afterEach } from "vitest";
import { parseToken, collectSectionIds } from "./sections";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: FAIL — `Failed to resolve import "./sections"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sections/sections.ts
const FRAGMENT_ATTR = "data-ajax-cart-fragment";

export function parseToken(value: string | null): { sectionId: string; name: string } | null {
  if (!value) return null;
  const slash = value.indexOf("/");
  if (slash <= 0 || slash >= value.length - 1) return null;
  return { sectionId: value.slice(0, slash), name: value.slice(slash + 1) };
}

export function collectSectionIds(root: ParentNode = document): string[] {
  const ids = new Set<string>();
  root.querySelectorAll(`[${FRAGMENT_ATTR}]`).forEach((el) => {
    const token = parseToken(el.getAttribute(FRAGMENT_ATTR));
    if (token) ids.add(token.sectionId);
  });
  return [...ids];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/sections.ts src/sections/sections.spec.ts
git commit -m "feat(sections): add parseToken and collectSectionIds"
```

---

## Task 3: `renderSections`

**Files:**
- Modify: `src/sections/sections.ts`
- Test: `src/sections/sections.spec.ts`

- [ ] **Step 1: Write the failing test** (append to `sections.spec.ts`)

```ts
import { renderSections } from "./sections";

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
      { cart: `<div data-ajax-cart-fragment="header/x">nope</div><div data-ajax-cart-fragment="cart/body">new</div>` },
      root,
    );
    expect(root.querySelector('[data-ajax-cart-fragment="cart/body"]')!.textContent).toBe("new");
  });

  it("strips loading=lazy from incoming images", () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/body">old</div>`);
    renderSections({ cart: `<div data-ajax-cart-fragment="cart/body"><img loading="lazy" src="x"></div>` }, root);
    expect(root.querySelector("img")!.hasAttribute("loading")).toBe(false);
  });

  it("does not touch targets of a section absent from the input map", () => {
    const root = mount(`<div data-ajax-cart-fragment="header/note">keep</div>`);
    renderSections({ cart: `<div data-ajax-cart-fragment="cart/x">y</div>` }, root);
    expect(root.querySelector('[data-ajax-cart-fragment="header/note"]')!.textContent).toBe("keep");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: FAIL — `renderSections is not a function` / import error.

- [ ] **Step 3: Write minimal implementation** (add to `sections.ts`; add the import at the top)

```ts
// add near the top of sections.ts, below the FRAGMENT_ATTR constant:
import { applyContent } from "./apply-content";

export function renderSections(
  sections: Record<string, string>,
  root: ParentNode = document,
): void {
  const parser = new DOMParser();
  for (const [sectionId, html] of Object.entries(sections)) {
    if (!html) {
      console.warn(`Liquid Ajax Cart: section "${sectionId}" returned empty HTML; skipping.`);
      continue;
    }
    const doc = parser.parseFromString(html, "text/html");
    doc.querySelectorAll('img[loading="lazy"]').forEach((img) => img.removeAttribute("loading"));

    const sources = new Map<string, Element>();
    doc.querySelectorAll(`[${FRAGMENT_ATTR}]`).forEach((source) => {
      const token = parseToken(source.getAttribute(FRAGMENT_ATTR));
      if (!token || token.sectionId !== sectionId) return;
      if (sources.has(token.name)) {
        console.warn(
          `Liquid Ajax Cart: duplicate fragment "${sectionId}/${token.name}" in the rendered section; using the first.`,
        );
        return;
      }
      sources.set(token.name, source);
    });

    root.querySelectorAll(`[${FRAGMENT_ATTR}]`).forEach((target) => {
      const token = parseToken(target.getAttribute(FRAGMENT_ATTR));
      if (!token || token.sectionId !== sectionId) return;
      const source = sources.get(token.name);
      if (source) {
        applyContent(target, source);
      } else {
        console.warn(
          `Liquid Ajax Cart: fragment "${sectionId}/${token.name}" not found in the rendered "${sectionId}" section; clearing it.`,
        );
        target.replaceChildren();
      }
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/sections.ts src/sections/sections.spec.ts
git commit -m "feat(sections): add renderSections"
```

---

## Task 4: `buildSectionsParam` and `injectSections`

**Files:**
- Modify: `src/sections/sections.ts`
- Test: `src/sections/sections.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
import { buildSectionsParam, injectSections } from "./sections";
import type { RequestBody } from "../core";

describe("buildSectionsParam", () => {
  it("merges and dedupes existing + new ids", () => {
    expect(buildSectionsParam("cart, footer", ["cart", "header"])).toBe("cart,footer,header");
  });
  it("handles a null/empty existing value", () => {
    expect(buildSectionsParam(null, ["cart"])).toBe("cart");
    expect(buildSectionsParam("", ["cart"])).toBe("cart");
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: FAIL — `buildSectionsParam is not a function`.

- [ ] **Step 3: Write minimal implementation** (add to `sections.ts`; add the import)

```ts
// add to the top imports of sections.ts:
import type { RequestBody } from "../core";

export function buildSectionsParam(existing: string | null, ids: string[]): string {
  const set = new Set<string>();
  for (const part of (existing ?? "").split(",")) {
    const trimmed = part.trim();
    if (trimmed) set.add(trimmed);
  }
  for (const id of ids) set.add(id);
  return [...set].join(",");
}

export function injectSections(body: RequestBody, ids: string[]): void {
  if (body instanceof FormData || body instanceof URLSearchParams) {
    const existing = body.get("sections");
    body.set("sections", buildSectionsParam(existing == null ? null : String(existing), ids));
  } else if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const existing = typeof record.sections === "string" ? record.sections : null;
    record.sections = buildSectionsParam(existing, ids);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/sections.ts src/sections/sections.spec.ts
git commit -m "feat(sections): add buildSectionsParam and injectSections"
```

---

## Task 5: `fetchSections` (Section Rendering API, chunked)

**Files:**
- Modify: `src/sections/sections.ts`
- Test: `src/sections/sections.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
import { fetchSections } from "./sections";
import { vi } from "vitest";

describe("fetchSections", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (window as { Shopify?: unknown }).Shopify;
  });

  it("requests GET /?sections=<ids> and returns the merged map", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ cart: "<c>" }), { status: 200 }),
    );
    const out = await fetchSections(["cart"]);
    expect(out).toEqual({ cart: "<c>" });
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain("?sections=cart");
  });

  it("chunks ids into batches of 5 and merges results", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ a: "1", b: "2", c: "3", d: "4", e: "5" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ f: "6", g: "7" }), { status: 200 }));
    const out = await fetchSections(["a", "b", "c", "d", "e", "f", "g"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(Object.keys(out)).toEqual(["a", "b", "c", "d", "e", "f", "g"]);
  });

  it("swallows a network error and returns what it has", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await expect(fetchSections(["cart"])).resolves.toEqual({});
  });

  it("respects window.Shopify.routes.root", async () => {
    (window as { Shopify?: unknown }).Shopify = { routes: { root: "/en/" } };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));
    await fetchSections(["cart"]);
    expect(fetchMock.mock.calls[0][0]).toContain("/en/?sections=cart");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: FAIL — `fetchSections is not a function`.

- [ ] **Step 3: Write minimal implementation** (add to `sections.ts`; add the constant if not present)

```ts
// add below FRAGMENT_ATTR if not already present:
const SECTIONS_PER_REQUEST = 5;

export async function fetchSections(ids: string[]): Promise<Record<string, string>> {
  const root = window.Shopify?.routes?.root ?? "/";
  const result: Record<string, string> = {};
  for (let i = 0; i < ids.length; i += SECTIONS_PER_REQUEST) {
    const chunk = ids.slice(i, i + SECTIONS_PER_REQUEST);
    const url = `${root}?sections=${chunk.join(",")}`;
    try {
      const response = await fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } });
      if (response.ok) {
        Object.assign(result, (await response.json()) as Record<string, string>);
      }
    } catch {
      // Network error — leave this chunk's sections unfetched; render() skips them.
    }
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/sections.ts src/sections/sections.spec.ts
git commit -m "feat(sections): add fetchSections via Section Rendering API"
```

---

## Task 6: `reconcile`

**Files:**
- Modify: `src/sections/sections.ts`
- Test: `src/sections/sections.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
import { reconcile } from "./sections";
import type { RequestResult } from "../core";

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
      { ok: true, status: 200, body: { sections: { cart: `<div data-ajax-cart-fragment="cart/x">new</div>` } } } as RequestResult,
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
    const fetchMissing = vi.fn(async () => ({ header: `<div data-ajax-cart-fragment="header/y">fresh</div>` }));
    await reconcile(
      { ok: true, status: 200, body: { sections: { cart: `<div data-ajax-cart-fragment="cart/x">new</div>` } } } as RequestResult,
      fetchMissing,
      root,
    );
    expect(fetchMissing).toHaveBeenCalledWith(["header"]);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("new");
    expect(root.querySelector('[data-ajax-cart-fragment="header/y"]')!.textContent).toBe("fresh");
  });

  it("re-renders on an error response with no sections by fetching all on-page sections", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">old</div>`);
    const fetchMissing = vi.fn(async () => ({ cart: `<div data-ajax-cart-fragment="cart/x">truth</div>` }));
    await reconcile({ ok: false, status: 422, body: { message: "nope" } } as RequestResult, fetchMissing, root);
    expect(fetchMissing).toHaveBeenCalledWith(["cart"]);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("truth");
  });

  it("leaves a section's targets unchanged when it cannot be fetched", async () => {
    const root = mount(`<div data-ajax-cart-fragment="cart/x">keep</div>`);
    const fetchMissing = vi.fn(async () => ({})); // fetch returned nothing for cart
    await reconcile({ ok: false, status: 422, body: {} } as RequestResult, fetchMissing, root);
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("keep");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: FAIL — `reconcile is not a function`.

- [ ] **Step 3: Write minimal implementation** (add to `sections.ts`; add the type import)

```ts
// add to the type import from ../core:
import type { RequestBody, RequestResult } from "../core";

export async function reconcile(
  result: RequestResult,
  fetchMissing: (ids: string[]) => Promise<Record<string, string>> = fetchSections,
  root: ParentNode = document,
): Promise<void> {
  if (result.status === null) return;

  const body = result.body as { sections?: unknown } | null;
  const provided =
    body && typeof body.sections === "object" && body.sections !== null
      ? (body.sections as Record<string, string>)
      : {};

  const onPageIds = collectSectionIds(root);
  const missing = onPageIds.filter((id) => !(id in provided));
  const fetched = missing.length ? await fetchMissing(missing) : {};

  for (const id of missing) {
    if (!(id in fetched)) {
      console.warn(
        `Liquid Ajax Cart: section "${id}" could not be rendered; its fragments are left unchanged.`,
      );
    }
  }

  renderSections({ ...provided, ...fetched }, root);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/sections.ts src/sections/sections.spec.ts
git commit -m "feat(sections): add reconcile"
```

---

## Task 7: lifecycle handlers `handleRequestStart` / `handleRequestEnd`

**Files:**
- Modify: `src/sections/sections.ts`
- Test: `src/sections/sections.spec.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
import { handleRequestStart, handleRequestEnd } from "./sections";

describe("handleRequestStart", () => {
  it("injects the first 5 on-page sections into a FormData body", async () => {
    const root = mount(
      ["a", "b", "c", "d", "e", "f"].map((s) => `<div data-ajax-cart-fragment="${s}/x"></div>`).join(""),
    );
    void root;
    const body = new FormData();
    await handleRequestStart({ endpoint: "add", body });
    expect(body.get("sections")).toBe("a,b,c,d,e"); // capped at 5
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
      result: { ok: true, status: 200, body: { sections: { cart: `<div data-ajax-cart-fragment="cart/x">new</div>` } } },
    });
    expect(root.querySelector('[data-ajax-cart-fragment="cart/x"]')!.textContent).toBe("new");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: FAIL — `handleRequestStart is not a function`.

- [ ] **Step 3: Write minimal implementation** (add to `sections.ts`)

```ts
// Narrow shapes of the emitter `detail` we consume. The full context types are
// internal to core/api.ts; we read only what we need and cast at the boundary.
type RequestStartDetail = { endpoint: string; body: RequestBody | null };
type RequestEndDetail = { result: RequestResult };

export async function handleRequestStart(detail: unknown): Promise<void> {
  const { endpoint, body } = detail as RequestStartDetail;
  if (endpoint === "get" || !body) return;
  const ids = collectSectionIds().slice(0, SECTIONS_PER_REQUEST);
  if (ids.length) injectSections(body, ids);
}

export async function handleRequestEnd(detail: unknown): Promise<void> {
  await reconcile((detail as RequestEndDetail).result);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/sections.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/sections.ts src/sections/sections.spec.ts
git commit -m "feat(sections): add request lifecycle handlers"
```

---

## Task 8: `index.ts` registration + end-to-end test

**Files:**
- Create: `src/sections/index.ts`
- Test: `src/sections/index.spec.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/sections/index.spec.ts`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/sections/index.ts
// Side-effect init: wire the sections module into the core request lifecycle.
import { on, EVENTS } from "../core";
import { handleRequestStart, handleRequestEnd } from "./sections";

on(EVENTS.REQUEST_START, handleRequestStart);
on(EVENTS.REQUEST_END, handleRequestEnd);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/sections/index.spec.ts`
Expected: PASS.

- [ ] **Step 5 (optional): Commit**

```bash
git add src/sections/index.ts src/sections/index.spec.ts
git commit -m "feat(sections): register lifecycle listeners"
```

---

## Task 9: wire the module into the library entry point

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add the side-effect import**

Change `src/index.ts` from:
```ts
export * from "./core";

// Modules auto-initialize on import (side-effect pattern).
import "./product-form";
```
to:
```ts
export * from "./core";

// Modules auto-initialize on import (side-effect pattern).
import "./product-form";
import "./sections";
```

- [ ] **Step 2: Run the full suite**

Run: `npx vitest run`
Expected: PASS — all existing suites plus the new `src/sections/*` suites.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors under `src/` (a pre-existing `@vitest/spy` `Disposable` error in `node_modules` is unrelated).

- [ ] **Step 4 (optional): Commit**

```bash
git add src/index.ts
git commit -m "feat(sections): wire module into the library entry point"
```

---

## Self-Review

**Spec coverage:**
- Responsibility (presentational only) → no state is read; module only swaps DOM (Tasks 1, 3). ✔
- Markup contract `section/name` → `parseToken` + symmetric source/target match (Tasks 2, 3). ✔
- Content = source children → `applyContent` (Task 1). ✔
- Hybrid fetch (bundle ≤5 + overflow GET) → `handleRequestStart` cap + `reconcile` leftover fetch (Tasks 5, 6, 7). ✔
- Unified reconciliation incl. error-with-no-sections re-render + `status === null` skip → `reconcile` (Task 6). ✔
- No carried state (recompute at request-end) → `reconcile` recomputes `onPageIds` (Task 6). ✔
- `get` never augmented → `handleRequestStart` early-return (Task 7). ✔
- Clear vs skip (missing fragment clears; missing section skips) → `renderSections` clears; sections absent from map untouched + `reconcile` warns (Tasks 3, 6). ✔
- `loading="lazy"` strip → `renderSections` (Task 3). ✔
- Lifecycle integration via `on(REQUEST_START/REQUEST_END)`; overflow GET inside the awaited end hook → `index.ts` + emitter awaits internal listeners (Task 8). ✔
- Dev warnings (missing fragment, duplicate source, missing section) → `console.warn` in Tasks 3, 6. *(Note: gated dev-mode is deferred; v1 warns unconditionally, matching v2's console usage.)* ✔
- Out of scope (scroll/static-element/refresh/post-render event/state) → not implemented. ✔

**Placeholder scan:** none — every step contains runnable code or an exact command.

**Type consistency:** `parseToken` → `{sectionId, name}` used identically in Tasks 2/3; `applyContent(target, source)` signature matches its call in Task 3; `reconcile(result, fetchMissing?, root?)` matches its call in Task 7; `fetchSections(ids)` default matches `reconcile`'s `fetchMissing` type; `RequestBody`/`RequestResult` imported from `../core` (exported there). `SECTIONS_PER_REQUEST`/`FRAGMENT_ATTR` declared once in Task 2/5 — ensure they are not duplicated when appending later tasks.

**Note for the executor:** `sections.ts` is built up across Tasks 2–7; declare `FRAGMENT_ATTR` and `SECTIONS_PER_REQUEST` once at the top and the `../core` / `./apply-content` imports once. The per-task snippets show the additions, not a fresh file each time.
