# Quantity Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the quantity module — an input that commits its value to `cart/change.js`, plus an `<ajax-cart-quantity>` element that adds +/− stepping.

**Architecture:** Two independent pieces that never import each other. `quantity-input.ts` delegates `change`/`keydown` on `document`, parses the line-item identity, and commits a `FormData` through `core.change()`. `quantity-element.ts` is a custom element that listens to `click`/`change` **on itself**, steps its single `<input>`, and dispatches a synthetic `change` so the binding commits it. `bounds.ts` holds the shared numeric layer (bounds + next value) and is the only module both may import.

**Tech Stack:** TypeScript (strict, ES2022, bundler resolution), Vitest in a real browser via `@vitest/browser-playwright`. Tests run with `npx vitest run <path>`.

**Spec:** `V3-QUANTITY.md`.

**Commits:** This plan does **not** auto-commit. Each task ends with an *optional* commit checkpoint — run it only if the user asks; otherwise skip and continue.

## Global Constraints

- **`quantity-input.ts` and `quantity-element.ts` must never import each other.** They may import `../core` and `./bounds` only. They communicate through a synthetic `change` event on the input.
- **Never write the `value` attribute** (`setAttribute("value", …)` / `defaultValue = …`). It is the server-value record read by Escape, the no-op guard, failure restore, and the init reset. Display changes are always `input.value = …`.
- **Never set `disabled` on a button or an `<input>`.** Busy state is `readonly` on inputs, `aria-disabled="true"` on buttons. `<select>` is the sole exception — it has no `readonly`, so it gets `disabled`.
- **Merchant mistakes use `console.error`, deduped per node**, so a section re-render cannot spam the console.
- Bounds are native HTML: `min` (default 1), `max` (default unbounded), `step` (default 1). No library vocabulary for them.
- Formatting follows `.prettierrc.json` (already in the repo).

---

## File Structure

```
src/quantity/
  bounds.ts             ← readBounds, clamp, nextValue. Pure numeric layer, imported by both.
  bounds.spec.ts
  quantity-input.ts      ← identity grammar, server value, commit, restore, delegation, busy state
  quantity-input.spec.ts
  quantity-element.ts    ← <ajax-cart-quantity>: own listeners, stepping, debounce, button states
  quantity-element.spec.ts
  index.ts               ← side-effect init: starts both subscriptions, defines the element
src/index.ts             ← MODIFY: add `import "./quantity";`
```

Shared constants (declared once, at the top of the file that owns them):

```ts
// quantity-input.ts
const ATTR = "data-ajax-cart-quantity-input";

// quantity-element.ts
const TAG = "ajax-cart-quantity";
const PLUS = "data-ajax-cart-quantity-plus";
const MINUS = "data-ajax-cart-quantity-minus";
const DEFAULT_DEBOUNCE = 300;
```

Both implementation files carry their own five-line `warnOnce` helper. That duplication is deliberate — a shared helper file would be the only thing coupling the two pieces, and the spec's independence rule is worth more than five lines.

---

## Task 1: `bounds.ts` — the numeric layer

**Files:**
- Create: `src/quantity/bounds.ts`
- Test: `src/quantity/bounds.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Bounds = { min: number; max: number; step: number }`, `readBounds(input: Element): Bounds`, `clamp(value: number, bounds: Bounds): number`, `nextValue(current: number, direction: 1 | -1, bounds: Bounds): number`.

- [ ] **Step 1: Write the failing test**

```ts
// src/quantity/bounds.spec.ts
import { describe, it, expect } from "vitest";
import { readBounds, clamp, nextValue } from "./bounds";

function input(html: string): HTMLInputElement {
  const host = document.createElement("div");
  host.innerHTML = html;
  return host.firstElementChild as HTMLInputElement;
}

describe("readBounds", () => {
  it("defaults to min 1, unbounded max, step 1", () => {
    expect(readBounds(input(`<input type="number">`))).toEqual({
      min: 1,
      max: Infinity,
      step: 1,
    });
  });

  it("reads native attributes", () => {
    expect(readBounds(input(`<input min="0" max="10" step="5">`))).toEqual({
      min: 0,
      max: 10,
      step: 5,
    });
  });

  it("falls back when an attribute is not an integer", () => {
    expect(readBounds(input(`<input min="abc" max="" step="any">`))).toEqual({
      min: 1,
      max: Infinity,
      step: 1,
    });
  });

  it("falls back when step is zero or negative", () => {
    expect(readBounds(input(`<input step="0">`)).step).toBe(1);
    expect(readBounds(input(`<input step="-3">`)).step).toBe(1);
  });
});

describe("clamp", () => {
  const bounds = { min: 1, max: 10, step: 1 };

  it("returns the value when it is inside the range", () => {
    expect(clamp(5, bounds)).toBe(5);
  });

  it("pulls up to min and down to max", () => {
    expect(clamp(0, bounds)).toBe(1);
    expect(clamp(99, bounds)).toBe(10);
  });

  it("allows zero when min is zero", () => {
    expect(clamp(0, { min: 0, max: 10, step: 1 })).toBe(0);
  });
});

describe("nextValue", () => {
  const bounds = { min: 1, max: 10, step: 1 };

  it("steps up and down by one", () => {
    expect(nextValue(4, 1, bounds)).toBe(5);
    expect(nextValue(4, -1, bounds)).toBe(3);
  });

  it("steps by the step size", () => {
    expect(nextValue(4, 1, { min: 1, max: 100, step: 3 })).toBe(7);
  });

  it("stops at min and max", () => {
    expect(nextValue(1, -1, bounds)).toBe(1);
    expect(nextValue(10, 1, bounds)).toBe(10);
  });

  it("adds rather than snapping to the step grid", () => {
    // native stepUp() would snap 4 to 5 with min=1 step=2; we add.
    expect(nextValue(4, 1, { min: 1, max: 100, step: 2 })).toBe(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/bounds.spec.ts`
Expected: FAIL — `Failed to resolve import "./bounds"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/quantity/bounds.ts

// The numeric layer, shared by the input binding and the stepper element.
// Bounds come from native HTML attributes so merchants configure the control
// with the same vocabulary the browser already understands.
export type Bounds = { min: number; max: number; step: number };

const DEFAULT_MIN = 1;
const DEFAULT_STEP = 1;

/** Reads an integer attribute, falling back when absent, blank, or unparseable. */
function intAttr(el: Element, name: string, fallback: number): number {
  const raw = el.getAttribute(name);
  if (raw === null) return fallback;
  const value = Number(raw.trim());
  return Number.isInteger(value) ? value : fallback;
}

export function readBounds(input: Element): Bounds {
  const step = intAttr(input, "step", DEFAULT_STEP);
  return {
    min: intAttr(input, "min", DEFAULT_MIN),
    max: intAttr(input, "max", Infinity),
    step: step > 0 ? step : DEFAULT_STEP,
  };
}

export function clamp(value: number, bounds: Bounds): number {
  if (value < bounds.min) return bounds.min;
  if (value > bounds.max) return bounds.max;
  return value;
}

export function nextValue(current: number, direction: 1 | -1, bounds: Bounds): number {
  return clamp(current + bounds.step * direction, bounds);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/bounds.spec.ts`
Expected: PASS (11 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/bounds.ts src/quantity/bounds.spec.ts
git commit -m "feat(quantity): add stepper numeric layer"
```

---

## Task 2: identity grammar and server value

**Files:**
- Create: `src/quantity/quantity-input.ts`
- Test: `src/quantity/quantity-input.spec.ts`

**Interfaces:**
- Consumes: nothing yet.
- Produces: `type Identity = { key: "line" | "id"; value: string }`, `parseIdentity(raw: string): Identity | null`, `serverValue(control: Element): string`, `restore(control: HTMLInputElement | HTMLSelectElement): void`.

- [ ] **Step 1: Write the failing test**

```ts
// src/quantity/quantity-input.spec.ts
import { afterEach, describe, it, expect } from "vitest";
import { parseIdentity, serverValue, restore } from "./quantity-input";

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("parseIdentity", () => {
  it("reads a positive integer as a line index", () => {
    expect(parseIdentity("3")).toEqual({ key: "line", value: "3" });
    expect(parseIdentity("1000")).toEqual({ key: "line", value: "1000" });
  });

  it("reads a value containing a colon as an item key", () => {
    expect(parseIdentity("39897499729974:d0e2a4")).toEqual({
      key: "id",
      value: "39897499729974:d0e2a4",
    });
  });

  it("trims surrounding whitespace", () => {
    expect(parseIdentity("  4  ")).toEqual({ key: "line", value: "4" });
  });

  it("rejects empty, zero, and anything else", () => {
    expect(parseIdentity("")).toBeNull();
    expect(parseIdentity("   ")).toBeNull();
    expect(parseIdentity("0")).toBeNull();
    expect(parseIdentity("-2")).toBeNull();
    expect(parseIdentity("abc")).toBeNull();
  });
});

describe("serverValue", () => {
  it("reads the input's value attribute, not its current value", () => {
    const el = mount(`<input value="2">`) as HTMLInputElement;
    el.value = "7";
    expect(serverValue(el)).toBe("2");
  });

  it("returns an empty string when the attribute is absent", () => {
    expect(serverValue(mount(`<input>`))).toBe("");
  });

  it("reads the last selected option of a select", () => {
    const el = mount(
      `<select><option value="1" selected>1</option><option value="2" selected>2</option></select>`,
    ) as HTMLSelectElement;
    el.value = "1";
    expect(serverValue(el)).toBe("2");
  });

  it("returns an empty string when no option is marked selected", () => {
    expect(serverValue(mount(`<select><option value="1">1</option></select>`))).toBe("");
  });
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: FAIL — `Failed to resolve import "./quantity-input"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/quantity/quantity-input.ts

export type Identity = { key: "line" | "id"; value: string };

// Shopify line indices are 1-based integers; item keys are always
// `variantId:hash`. The two languages are disjoint, so the check is decidable —
// unlike v2's `length > 3` heuristic, under which line="1000" became a key.
export function parseIdentity(raw: string): Identity | null {
  const value = raw.trim();
  if (/^[1-9][0-9]*$/.test(value)) return { key: "line", value };
  if (value.includes(":")) return { key: "id", value };
  return null;
}

/**
 * The quantity the cart holds, as Liquid rendered it. Read from the `value`
 * ATTRIBUTE, which nothing (browser or library) ever writes — that is what lets
 * this module work without cart state. Empty string means "no server value".
 */
export function serverValue(control: Element): string {
  if (control instanceof HTMLSelectElement) {
    const selected = control.querySelectorAll("option[selected]");
    const last = selected[selected.length - 1];
    return last instanceof HTMLOptionElement ? last.value : "";
  }
  return control instanceof HTMLInputElement ? control.defaultValue : "";
}

export function restore(control: HTMLInputElement | HTMLSelectElement): void {
  const server = serverValue(control);
  if (server === "") return;
  control.value = server;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: PASS (11 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-input.ts src/quantity/quantity-input.spec.ts
git commit -m "feat(quantity): add identity grammar and server value"
```

---

## Task 3: `commit()`

**Files:**
- Modify: `src/quantity/quantity-input.ts`
- Test: `src/quantity/quantity-input.spec.ts` (append; add the mock and imports at the top)

**Interfaces:**
- Consumes: `parseIdentity`, `serverValue`, `restore` (Task 2); `clamp`, `readBounds` (Task 1); `change`, `isProcessing` from `../core`.
- Produces: `commit(control: HTMLInputElement | HTMLSelectElement): Promise<void>`.

- [ ] **Step 1: Write the failing test**

Add this mock block and these imports at the **top** of `quantity-input.spec.ts`, above the existing imports of `./quantity-input`:

```ts
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

// Stub the request layer so commits are observable without hitting fetch or the
// queue. EVENTS and the rest of core stay real.
vi.mock("../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core")>();
  return { ...actual, change: vi.fn(), isProcessing: vi.fn(() => false) };
});

import { change, isProcessing } from "../core";
import { parseIdentity, serverValue, restore, commit } from "./quantity-input";

const changeMock = vi.mocked(change);
const isProcessingMock = vi.mocked(isProcessing);

beforeEach(() => {
  changeMock.mockReset();
  changeMock.mockResolvedValue({ ok: true, status: 200, body: {} });
  isProcessingMock.mockReset();
  isProcessingMock.mockReturnValue(false);
});

/** Reads a FormData body from the nth call to change(). */
function sentBody(call = 0): Record<string, string> {
  const body = changeMock.mock.calls[call][0] as FormData;
  return Object.fromEntries([...body.entries()].map(([k, v]) => [k, String(v)]));
}
```

Then append:

```ts
describe("commit", () => {
  it("sends line and quantity for a line identity", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
  });

  it("sends id and quantity for a key identity", async () => {
    const el = mount(
      `<input data-ajax-cart-quantity-input="123:abc" value="2">`,
    ) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(sentBody()).toEqual({ id: "123:abc", quantity: "5" });
  });

  it("passes trigger metadata", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(changeMock.mock.calls[0][1]).toEqual({
      trigger: { source: "quantity", initiator: el },
    });
  });

  it("errors and sends nothing when the identity is invalid", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(`<input data-ajax-cart-quantity-input="abc" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("warns only once per node", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(`<input data-ajax-cart-quantity-input="abc" value="2">`) as HTMLInputElement;
    await commit(el);
    await commit(el);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("does nothing while the queue is processing", async () => {
    isProcessingMock.mockReturnValue(true);
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
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

  it("restores and errors for a non-empty non-integer value", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "1.5";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(el.value).toBe("2");
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("clamps to max, writes the clamped value back, and sends it", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="2" min="1" max="10">`,
    ) as HTMLInputElement;
    el.value = "99";
    await commit(el);
    expect(el.value).toBe("10");
    expect(sentBody()).toEqual({ line: "3", quantity: "10" });
  });

  it("normalises the display to what was sent", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "007";
    await commit(el);
    expect(el.value).toBe("7");
    expect(sentBody()).toEqual({ line: "3", quantity: "7" });
  });

  it("does not request when the value already equals the server value", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "2";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("still writes the clamped value back when the request is skipped", async () => {
    const el = mount(
      `<input type="number" data-ajax-cart-quantity-input="3" value="10" min="1" max="10">`,
    ) as HTMLInputElement;
    el.value = "99";
    await commit(el);
    expect(changeMock).not.toHaveBeenCalled();
    expect(el.value).toBe("10");
  });

  it("requests when there is no server value to compare against", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3">`) as HTMLInputElement;
    el.value = "2";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "2" });
  });

  it("commits a select unclamped and leaves the attribute intact", async () => {
    const el = mount(
      `<select data-ajax-cart-quantity-input="3">
         <option value="1" selected>1</option><option value="4">4</option>
       </select>`,
    ) as HTMLSelectElement;
    el.value = "4";
    await commit(el);
    expect(sentBody()).toEqual({ line: "3", quantity: "4" });
    expect(serverValue(el)).toBe("1");
  });

  it("restores a still-connected control when the request fails", async () => {
    changeMock.mockResolvedValue({ ok: false, status: null, body: null });
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(el.value).toBe("2");
  });

  it("leaves a detached control alone when the request fails", async () => {
    changeMock.mockResolvedValue({ ok: false, status: null, body: null });
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    const promise = commit(el);
    el.remove(); // stands in for a section render replacing the node
    await promise;
    expect(el.value).toBe("5");
  });

  it("does not restore after a successful request", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(el.value).toBe("5");
  });

  it("leaves the value attribute untouched throughout", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    await commit(el);
    expect(el.getAttribute("value")).toBe("2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: FAIL — `commit is not a function` (or an import error for `commit`).

- [ ] **Step 3: Write minimal implementation**

Add to `src/quantity/quantity-input.ts` (imports at the top of the file):

```ts
import { change, isProcessing } from "../core";
import { clamp, readBounds } from "./bounds";

const ATTR = "data-ajax-cart-quantity-input";

// Deduped per node so a section re-render cannot spam the console. Duplicated
// in quantity-element.ts on purpose: a shared helper would be the only thing
// coupling the two pieces.
const warned = new WeakMap<Element, Set<string>>();

function warnOnce(el: Element, code: string, message: string): void {
  let codes = warned.get(el);
  if (!codes) {
    codes = new Set();
    warned.set(el, codes);
  }
  if (codes.has(code)) return;
  codes.add(code);
  console.error(message, el);
}

export async function commit(control: HTMLInputElement | HTMLSelectElement): Promise<void> {
  if (isProcessing()) return;

  const identity = parseIdentity(control.getAttribute(ATTR) ?? "");
  if (!identity) {
    warnOnce(
      control,
      "identity",
      `Liquid Ajax Cart: "${ATTR}" must be a line index (1, 2, 3…) or a line item key (containing ":").`,
    );
    return;
  }

  const raw = control.value.trim();
  // Checked before Number(): Number("") is 0, and a type=number field blanks
  // unparseable text — falling through would send quantity=0 and delete the line.
  if (raw === "") {
    restore(control);
    return;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    warnOnce(control, "integer", `Liquid Ajax Cart: quantity must be a whole number.`);
    restore(control);
    return;
  }

  let value = parsed;
  if (control instanceof HTMLInputElement) {
    value = clamp(parsed, readBounds(control));
    // Write the property, never the attribute. Skipped when nothing changed,
    // because assigning value moves the caret and Enter commits without blurring.
    if (String(value) !== control.value) control.value = String(value);
  }

  const server = serverValue(control);
  if (server !== "" && Number(server) === value) return;

  const body = new FormData();
  body.set(identity.key, identity.value);
  body.set("quantity", String(value));

  const result = await change(body, {
    trigger: { source: "quantity", initiator: control },
  });

  // Still connected means no render replaced this node — api.ts awaits the end
  // hooks (including the sections render) before resolving. The only failure
  // that leaves the node in place is one that rendered nothing.
  if (!result.ok && control.isConnected) restore(control);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: PASS (29 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-input.ts src/quantity/quantity-input.spec.ts
git commit -m "feat(quantity): add commit algorithm"
```

---

## Task 4: delegated `change` / `keydown`

**Files:**
- Modify: `src/quantity/quantity-input.ts`
- Test: `src/quantity/quantity-input.spec.ts` (append)

**Interfaces:**
- Consumes: `commit`, `restore` (Tasks 2-3).
- Produces: `handleChange(event: Event): void`, `handleKeydown(event: KeyboardEvent): void`.

- [ ] **Step 1: Write the failing test**

Append to `quantity-input.spec.ts` (add `handleChange, handleKeydown` to the import from `./quantity-input`):

```ts
/** Lets the floating promise inside the handlers settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("delegation", () => {
  // Register the handlers the way initInputBinding() will (Task 5), so the
  // tests dispatch real events instead of hand-building event objects.
  beforeEach(() => {
    document.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeydown);
  });

  afterEach(() => {
    document.removeEventListener("change", handleChange);
    document.removeEventListener("keydown", handleKeydown);
  });

  it("commits on a change event", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
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
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    const event = new KeyboardEvent("keydown", { key: "Enter", cancelable: true });
    el.dispatchEvent(event);
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
    expect(event.defaultPrevented).toBe(true);
  });

  it("restores on Escape without requesting", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    await flush();
    expect(el.value).toBe("2");
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("ignores other keys", async () => {
    const el = mount(`<input data-ajax-cart-quantity-input="3" value="2">`) as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    await flush();
    expect(el.value).toBe("5");
    expect(changeMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: FAIL — `handleChange is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/quantity/quantity-input.ts`:

```ts
function controlFrom(target: EventTarget | null): HTMLInputElement | HTMLSelectElement | null {
  if (!(target instanceof Element)) return null;
  const control = target.closest(`[${ATTR}]`);
  return control instanceof HTMLInputElement || control instanceof HTMLSelectElement
    ? control
    : null;
}

export function handleChange(event: Event): void {
  const control = controlFrom(event.target);
  if (control) void commit(control);
}

export function handleKeydown(event: KeyboardEvent): void {
  const control = controlFrom(event.target);
  if (!control) return;

  if (event.key === "Enter") {
    event.preventDefault();
    void commit(control);
    return;
  }

  if (event.key === "Escape") restore(control);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: PASS (34 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-input.ts src/quantity/quantity-input.spec.ts
git commit -m "feat(quantity): add delegated change and keydown handling"
```

---

## Task 5: busy state, init reset, and binding init

**Files:**
- Modify: `src/quantity/quantity-input.ts`
- Test: `src/quantity/quantity-input.spec.ts` (append)

**Interfaces:**
- Consumes: `serverValue`, `parseIdentity`, `isProcessing`, `EVENTS` from `../core`.
- Produces: `applyBusyState(): void`, `resetRestoredValues(): void`, `initInputBinding(): void`.

- [ ] **Step 1: Write the failing test**

Append (add `applyBusyState, resetRestoredValues, initInputBinding` to the import, and `EVENTS` to the `../core` import):

```ts
describe("busy state", () => {
  it("makes inputs readonly while processing and never disabled", () => {
    mount(`<input data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(el.readOnly).toBe(true);
    expect(el.disabled).toBe(false);

    isProcessingMock.mockReturnValue(false);
    applyBusyState();
    expect(el.readOnly).toBe(false);
  });

  it("disables a select, which has no readonly", () => {
    mount(`<select data-ajax-cart-quantity-input="3"><option value="1" selected>1</option></select>`);
    const el = document.querySelector("select") as HTMLSelectElement;

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(el.disabled).toBe(true);

    isProcessingMock.mockReturnValue(false);
    applyBusyState();
    expect(el.disabled).toBe(false);
  });

  it("keeps a focused input focused", () => {
    mount(`<input data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.focus();

    isProcessingMock.mockReturnValue(true);
    applyBusyState();
    expect(document.activeElement).toBe(el);
  });
});

describe("browser value restoration", () => {
  it("resets a cart-connected control whose value diverged", () => {
    mount(`<input data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "7"; // as a browser would restore after a soft reload
    resetRestoredValues();
    expect(el.value).toBe("2");
  });

  it("leaves a control with no identity alone", () => {
    mount(`<input value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "7";
    resetRestoredValues();
    expect(el.value).toBe("7");
  });

  it("leaves a control with no server value alone", () => {
    mount(`<input data-ajax-cart-quantity-input="3">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "7";
    resetRestoredValues();
    expect(el.value).toBe("7");
  });
});

describe("initInputBinding", () => {
  it("commits on a real change event once wired", async () => {
    initInputBinding();
    mount(`<input data-ajax-cart-quantity-input="3" value="2">`);
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "5";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();
    expect(sentBody()).toEqual({ line: "3", quantity: "5" });
  });

  it("re-applies the busy state when a control is rendered mid-queue", () => {
    initInputBinding();
    isProcessingMock.mockReturnValue(true);
    mount(`<input data-ajax-cart-quantity-input="3" value="2">`); // fresh node, not readonly
    const el = document.querySelector("input") as HTMLInputElement;
    expect(el.readOnly).toBe(false);

    document.dispatchEvent(new CustomEvent(EVENTS.REQUEST_END, { detail: {} }));
    expect(el.readOnly).toBe(true);
  });
});
```

> `initInputBinding()` runs more than once across these tests. Make it idempotent (Step 3) so the listeners are not stacked.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: FAIL — `applyBusyState is not a function`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/quantity/quantity-input.ts` (add `EVENTS` to the `../core` import):

```ts
export function applyBusyState(): void {
  const busy = isProcessing();
  document.querySelectorAll(`[${ATTR}]`).forEach((control) => {
    // Never `disabled` on an input: disabling blurs a focused element, and no
    // path guarantees a replacing render afterwards. `readonly` blocks edits
    // and keeps focus. A <select> has no readonly, so it is the one exception.
    if (control instanceof HTMLSelectElement) control.disabled = busy;
    else if (control instanceof HTMLInputElement) control.readOnly = busy;
  });
}

/**
 * Browsers restore control values on soft reload and bfcache, so a page can
 * load displaying a stale typed value while the attribute holds the cart's
 * quantity. At init that divergence can only be restoration. Not a freshness
 * mechanism — it only makes the control agree with the row it sits in.
 */
export function resetRestoredValues(): void {
  document.querySelectorAll(`[${ATTR}]`).forEach((control) => {
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) return;
    if (!parseIdentity(control.getAttribute(ATTR) ?? "")) return;
    const server = serverValue(control);
    if (server === "" || control.value === server) return;
    control.value = server;
  });
}

let initialised = false;

export function initInputBinding(): void {
  if (initialised) return;
  initialised = true;

  document.addEventListener("change", handleChange);
  document.addEventListener("keydown", handleKeydown);

  // queue-idle, not queue-end: queue.ts clears #running only after the
  // queue-end hook, so isProcessing() still reads true throughout it.
  document.addEventListener(EVENTS.QUEUE_START, applyBusyState);
  document.addEventListener(EVENTS.REQUEST_END, applyBusyState);
  document.addEventListener(EVENTS.QUEUE_IDLE, applyBusyState);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resetRestoredValues, { once: true });
  } else {
    resetRestoredValues();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-input.spec.ts`
Expected: PASS (42 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-input.ts src/quantity/quantity-input.spec.ts
git commit -m "feat(quantity): add busy state, restoration reset, and binding init"
```

---

## Task 6: `<ajax-cart-quantity>` structure and stepping

**Files:**
- Create: `src/quantity/quantity-element.ts`
- Test: `src/quantity/quantity-element.spec.ts`

**Interfaces:**
- Consumes: `nextValue`, `readBounds` (Task 1); `isProcessing` from `../core`.
- Produces: `class QuantityElement extends HTMLElement` with a public `refresh(): void`, and `initQuantityElement(): void` (completed in Task 8 — this task defines the element and registers it).

- [ ] **Step 1: Write the failing test**

```ts
// src/quantity/quantity-element.spec.ts
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core")>();
  return { ...actual, change: vi.fn(), isProcessing: vi.fn(() => false) };
});

import { isProcessing } from "../core";
import { QuantityElement } from "./quantity-element";

const isProcessingMock = vi.mocked(isProcessing);

if (!customElements.get("ajax-cart-quantity")) {
  customElements.define("ajax-cart-quantity", QuantityElement);
}

function mount(html: string): HTMLElement {
  document.body.innerHTML = html;
  return document.body.firstElementChild as HTMLElement;
}

function input(): HTMLInputElement {
  return document.querySelector("input") as HTMLInputElement;
}

function click(selector: string): void {
  (document.querySelector(selector) as HTMLElement).click();
}

const WIDGET = `
  <ajax-cart-quantity debounce="0">
    <a href="/cart/change?line=1&quantity=1" data-ajax-cart-quantity-minus>-</a>
    <input type="number" data-ajax-cart-quantity-input="1" value="2" min="1" max="10">
    <a href="/cart/change?line=1&quantity=3" data-ajax-cart-quantity-plus>+</a>
  </ajax-cart-quantity>`;

beforeEach(() => {
  isProcessingMock.mockReset();
  isProcessingMock.mockReturnValue(false);
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("structure", () => {
  it("errors when there is no input", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<ajax-cart-quantity><a data-ajax-cart-quantity-plus>+</a></ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("errors when there is more than one input", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<ajax-cart-quantity><input><input></ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("does nothing on click when the structure is invalid", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<ajax-cart-quantity><input><input><a data-ajax-cart-quantity-plus>+</a></ajax-cart-quantity>`);
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("");
    spy.mockRestore();
  });
});

describe("stepping", () => {
  it("steps up and down", () => {
    mount(WIDGET);
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("3");
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("2");
  });

  it("prevents the default link navigation", () => {
    mount(WIDGET);
    const button = document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLElement;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    button.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("stops at min and max", () => {
    mount(WIDGET);
    input().value = "1";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("1");

    input().value = "10";
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("10");
  });

  it("uses the step attribute", () => {
    mount(WIDGET);
    input().setAttribute("step", "3");
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("5");
  });

  it("does nothing while the queue is processing", () => {
    mount(WIDGET);
    isProcessingMock.mockReturnValue(true);
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("2");
  });

  it("does nothing when the field is empty or not a whole number", () => {
    mount(WIDGET);
    input().value = "";
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("");
  });

  it("steps a button inserted after connect", () => {
    mount(WIDGET);
    const widget = document.querySelector("ajax-cart-quantity") as HTMLElement;
    widget.insertAdjacentHTML("beforeend", `<b data-ajax-cart-quantity-plus>++</b>`);
    click("b[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("3");
  });

  it("ignores clicks on elements that are not step buttons", () => {
    mount(WIDGET);
    (document.querySelector("input") as HTMLElement).click();
    expect(input().value).toBe("2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-element.spec.ts`
Expected: FAIL — `Failed to resolve import "./quantity-element"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/quantity/quantity-element.ts
import { isProcessing } from "../core";
import { nextValue, readBounds } from "./bounds";

const TAG = "ajax-cart-quantity";
const PLUS = "data-ajax-cart-quantity-plus";
const MINUS = "data-ajax-cart-quantity-minus";

// Deduped per node. Duplicated from quantity-input.ts on purpose: a shared
// helper would be the only thing coupling the two pieces of the module.
const warned = new WeakMap<Element, Set<string>>();

function warnOnce(el: Element, code: string, message: string): void {
  let codes = warned.get(el);
  if (!codes) {
    codes = new Set();
    warned.set(el, codes);
  }
  if (codes.has(code)) return;
  codes.add(code);
  console.error(message, el);
}

export class QuantityElement extends HTMLElement {
  #controller: AbortController | null = null;

  connectedCallback(): void {
    // connectedCallback fires as soon as the start tag is parsed, before the
    // children exist. Same guard as <ajax-cart-product-form>.
    if (document.readyState !== "loading" || this.querySelector("input")) {
      this.#init();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => this.#init(), { once: true });
  }

  disconnectedCallback(): void {
    this.#controller?.abort();
    this.#controller = null;
  }

  /** The single input this widget steps, or null when the structure is invalid. */
  get input(): HTMLInputElement | null {
    const inputs = this.querySelectorAll("input");
    return inputs.length === 1 ? inputs[0] : null;
  }

  refresh(): void {
    // Button states arrive in Task 8.
  }

  #init(): void {
    if (!this.isConnected) return;

    const count = this.querySelectorAll("input").length;
    if (count !== 1) {
      warnOnce(
        this,
        "structure",
        `Liquid Ajax Cart: <${TAG}> must contain exactly one <input>, found ${count}.`,
      );
      return;
    }

    // Aborting first keeps a moved / re-appended element from double-binding.
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    this.addEventListener("click", this.#onClick, { signal });
    this.addEventListener("change", this.#onChange, { signal });
    this.refresh();
  }

  #onChange = (): void => {
    this.refresh();
  };

  #onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest(`[${PLUS}], [${MINUS}]`);
    if (!button || !this.contains(button)) return;

    event.preventDefault(); // the href is a no-JS fallback, not decoration
    if (isProcessing()) return;

    const input = this.input;
    if (!input) return;

    const current = Number(input.value.trim());
    if (input.value.trim() === "" || !Number.isInteger(current)) return;

    const next = nextValue(current, button.hasAttribute(PLUS) ? 1 : -1, readBounds(input));
    if (next === current) return;

    input.value = String(next);
    this.refresh();
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-element.spec.ts`
Expected: PASS (11 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-element.ts src/quantity/quantity-element.spec.ts
git commit -m "feat(quantity): add ajax-cart-quantity element and stepping"
```

---

## Task 7: debounce

**Files:**
- Modify: `src/quantity/quantity-element.ts`
- Test: `src/quantity/quantity-element.spec.ts` (append)

**Interfaces:**
- Consumes: `QuantityElement` (Task 6).
- Produces: nothing new exported — the element now dispatches a synthetic `change` on its input after the debounce window.

- [ ] **Step 1: Write the failing test**

Append to `quantity-element.spec.ts`:

```ts
describe("debounce", () => {
  it("dispatches one bubbling change after several clicks", async () => {
    vi.useFakeTimers();
    mount(WIDGET.replace(`debounce="0"`, `debounce="300"`));
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-plus]");
    click("[data-ajax-cart-quantity-plus]");
    click("[data-ajax-cart-quantity-plus]");
    expect(seen).toEqual([]);

    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["5"]);
    vi.useRealTimers();
  });

  it("dispatches immediately when debounce is 0", () => {
    mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));
    click("[data-ajax-cart-quantity-plus]");
    expect(seen).toEqual(["3"]);
  });

  it("defaults to 300ms when the attribute is absent", async () => {
    vi.useFakeTimers();
    mount(WIDGET.replace(` debounce="0"`, ""));
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    vi.advanceTimersByTime(299);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  it("errors once and uses the default for a non-numeric debounce", () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(WIDGET.replace(`debounce="0"`, `debounce="soon"`));
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    click("[data-ajax-cart-quantity-plus]");
    expect(spy).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["fired"]);
    spy.mockRestore();
    vi.useRealTimers();
  });

  it("drops a pending dispatch when the element is disconnected", () => {
    vi.useFakeTimers();
    mount(WIDGET.replace(`debounce="0"`, `debounce="300"`));
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    document.body.innerHTML = "";
    vi.advanceTimersByTime(300);
    expect(seen).toEqual([]);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-element.spec.ts`
Expected: FAIL — no `change` event is dispatched; `seen` stays empty in the first test.

- [ ] **Step 3: Write minimal implementation**

Add to `src/quantity/quantity-element.ts`:

```ts
const DEFAULT_DEBOUNCE = 300;
```

Add the field and methods to `QuantityElement`, and call `#schedule()` at the end of `#onClick`:

```ts
  #timer: ReturnType<typeof setTimeout> | undefined;

  // in disconnectedCallback(), after aborting:
  //   clearTimeout(this.#timer);
  //   this.#timer = undefined;

  #debounceMs(): number {
    const raw = this.getAttribute("debounce");
    if (raw === null) return DEFAULT_DEBOUNCE;

    const value = Number(raw.trim());
    if (!Number.isFinite(value) || value < 0) {
      warnOnce(
        this,
        "debounce",
        `Liquid Ajax Cart: <${TAG}> "debounce" must be a non-negative number; using ${DEFAULT_DEBOUNCE}ms.`,
      );
      return DEFAULT_DEBOUNCE;
    }
    return value;
  }

  #schedule(input: HTMLInputElement): void {
    clearTimeout(this.#timer);
    this.#timer = undefined;

    const wait = this.#debounceMs();
    if (wait === 0) {
      this.#fire(input);
      return;
    }

    // TODO: nothing flushes this early. See "Early flush of a pending debounce"
    // in V3-QUANTITY.md — v2's focusout approach no-ops on macOS Safari; a
    // module-level pointerdown capture listener is the way to add it.
    this.#timer = setTimeout(() => this.#fire(input), wait);
  }

  #fire(input: HTMLInputElement): void {
    this.#timer = undefined;
    // A render may have dropped the node while the timer was pending; a change
    // event on a detached input reaches nobody.
    if (!input.isConnected) return;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
```

The last two lines of `#onClick` become:

```ts
    input.value = String(next);
    this.refresh();
    this.#schedule(input);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-element.spec.ts`
Expected: PASS (16 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-element.ts src/quantity/quantity-element.spec.ts
git commit -m "feat(quantity): add stepper debounce"
```

---

## Task 8: button states and the module-level subscription

**Files:**
- Modify: `src/quantity/quantity-element.ts`
- Test: `src/quantity/quantity-element.spec.ts` (append)

**Interfaces:**
- Consumes: `QuantityElement.refresh` (Task 6, now implemented); `EVENTS`, `isProcessing` from `../core`.
- Produces: `refreshAllElements(): void`, `initQuantityElement(): void`.

- [ ] **Step 1: Write the failing test**

Append (add `initQuantityElement` to the `./quantity-element` import and `EVENTS` to the `../core` import):

```ts
function ariaOf(selector: string): string | null {
  return (document.querySelector(selector) as HTMLElement).getAttribute("aria-disabled");
}

describe("button states", () => {
  it("dims minus at min and plus at max", () => {
    mount(WIDGET);
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();

    input().value = "1";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBeNull();

    input().value = "10";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBe("true");
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();
  });

  it("compares numerically, so 01 counts as the minimum", () => {
    mount(WIDGET);
    input().value = "01";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
  });

  it("dims both buttons while processing", () => {
    mount(WIDGET);
    isProcessingMock.mockReturnValue(true);
    (document.querySelector("ajax-cart-quantity") as QuantityElement).refresh();
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBe("true");
  });

  it("never sets the disabled attribute", () => {
    mount(WIDGET.replace(/<a /g, `<button type="button" `).replace(/<\/a>/g, "</button>"));
    isProcessingMock.mockReturnValue(true);
    (document.querySelector("ajax-cart-quantity") as QuantityElement).refresh();

    document.querySelectorAll("button").forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(false);
      expect(button.disabled).toBe(false);
    });
  });

  it("keeps a focused button focused when the busy state is applied", () => {
    mount(WIDGET.replace(/<a /g, `<button type="button" `).replace(/<\/a>/g, "</button>"));
    const button = document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLButtonElement;
    button.focus();

    isProcessingMock.mockReturnValue(true);
    (document.querySelector("ajax-cart-quantity") as QuantityElement).refresh();
    expect(document.activeElement).toBe(button);
  });

  it("is busy straight from connectedCallback when rendered mid-queue", () => {
    isProcessingMock.mockReturnValue(true);
    mount(WIDGET);
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBe("true");
  });
});

describe("initQuantityElement", () => {
  it("refreshes every element on queue-start and queue-idle", () => {
    initQuantityElement();
    mount(WIDGET);

    isProcessingMock.mockReturnValue(true);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBe("true");

    isProcessingMock.mockReturnValue(false);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} }));
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/quantity-element.spec.ts`
Expected: FAIL — `aria-disabled` is never set (`refresh()` is still a no-op).

- [ ] **Step 3: Write minimal implementation**

Replace the placeholder `refresh()` in `QuantityElement`:

```ts
  /**
   * Recomputes every step button's `aria-disabled`. Never sets `disabled`:
   * that would blur a focused button during a transition with no render behind
   * it. Clicks are already inert — the handler returns early while processing
   * and the stepper clamps to min/max.
   */
  refresh(): void {
    const input = this.input;
    const busy = isProcessing();
    const bounds = input ? readBounds(input) : null;
    const current = input ? Number(input.value.trim()) : NaN;
    const known = input !== null && input.value.trim() !== "" && Number.isInteger(current);

    this.querySelectorAll(`[${PLUS}], [${MINUS}]`).forEach((button) => {
      const isPlus = button.hasAttribute(PLUS);
      let dim = busy;

      if (!dim && known && bounds) {
        dim = isPlus ? current >= bounds.max : current <= bounds.min;
      }

      if (dim) button.setAttribute("aria-disabled", "true");
      else button.removeAttribute("aria-disabled");
    });
  }
```

Add at the end of the file:

```ts
export function refreshAllElements(): void {
  document.querySelectorAll(TAG).forEach((el) => {
    if (el instanceof QuantityElement) el.refresh();
  });
}

let initialised = false;

export function initQuantityElement(): void {
  if (initialised) return;
  initialised = true;

  if (!customElements.get(TAG)) customElements.define(TAG, QuantityElement);

  // No request-end here: an element rendered mid-queue applies the busy state
  // from its own connectedCallback, and untouched elements already hold what
  // queue-start gave them. queue-idle (not queue-end) is where isProcessing()
  // first reads false — see queue.ts:84.
  document.addEventListener(EVENTS.QUEUE_START, refreshAllElements);
  document.addEventListener(EVENTS.QUEUE_IDLE, refreshAllElements);
}
```

Add `EVENTS` to the `../core` import at the top of the file.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/quantity-element.spec.ts`
Expected: PASS (23 tests).

- [ ] **Step 5 (optional): Commit**

```bash
git add src/quantity/quantity-element.ts src/quantity/quantity-element.spec.ts
git commit -m "feat(quantity): add button states and queue subscription"
```

---

## Task 9: wire the module into the library

**Files:**
- Create: `src/quantity/index.ts`
- Modify: `src/index.ts`
- Test: `src/quantity/index.spec.ts`

**Interfaces:**
- Consumes: `initInputBinding` (Task 5), `initQuantityElement` (Task 8).
- Produces: the side-effect import used by `src/index.ts`.

- [ ] **Step 1: Write the failing test**

```ts
// src/quantity/index.spec.ts
import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core")>();
  return { ...actual, change: vi.fn(), isProcessing: vi.fn(() => false) };
});

import { change, isProcessing } from "../core";
import "./index"; // side-effect init

const changeMock = vi.mocked(change);
const isProcessingMock = vi.mocked(isProcessing);

beforeEach(() => {
  changeMock.mockReset();
  changeMock.mockResolvedValue({ ok: true, status: 200, body: {} });
  isProcessingMock.mockReset();
  isProcessingMock.mockReturnValue(false);
});

afterEach(() => {
  document.body.innerHTML = "";
});

function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("quantity module init", () => {
  it("steps and commits end to end", async () => {
    document.body.innerHTML = `
      <ajax-cart-quantity debounce="0">
        <input type="number" data-ajax-cart-quantity-input="2" value="1" min="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`;

    (document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLElement).click();
    await flush();

    const body = changeMock.mock.calls[0][0] as FormData;
    expect(Object.fromEntries([...body.entries()])).toEqual({ line: "2", quantity: "2" });
  });

  it("steps locally without requesting when the input has no identity", async () => {
    document.body.innerHTML = `
      <ajax-cart-quantity debounce="0">
        <input type="number" name="quantity" value="1" min="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`;

    (document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLElement).click();
    await flush();

    expect((document.querySelector("input") as HTMLInputElement).value).toBe("2");
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("commits a bare input with no element around it", async () => {
    document.body.innerHTML = `<input data-ajax-cart-quantity-input="4" value="1">`;
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "6";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    const body = changeMock.mock.calls[0][0] as FormData;
    expect(Object.fromEntries([...body.entries()])).toEqual({ line: "4", quantity: "6" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/quantity/index.spec.ts`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/quantity/index.ts
// Side-effect init: register the stepper element and start the input binding.
import { initInputBinding } from "./quantity-input";
import { initQuantityElement } from "./quantity-element";

initInputBinding();
initQuantityElement();
```

Then add the side-effect import to `src/index.ts`, after `./sections`:

```ts
export * from "./core";

// Modules auto-initialize on import (side-effect pattern).
import "./product-form";
import "./sections";
import "./quantity";
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/quantity/index.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: PASS — the 9 pre-existing files (271 tests) plus the 4 new quantity files.

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no output.

- [ ] **Step 7 (optional): Commit**

```bash
git add src/quantity/index.ts src/quantity/index.spec.ts src/index.ts
git commit -m "feat(quantity): wire quantity module into the library entry point"
```

---

## Self-Review

**Spec coverage:**
- Identity grammar, `line` vs `id`, empty → error → Task 2 + Task 3. ✔
- No attribute = not cart-connected, still steppable → Task 9 test "steps locally without requesting". ✔
- Commit algorithm steps 1-6, in order, with the empty check before `Number()` → Task 3. ✔
- Clamp + conditional write-back, before the no-op guard → Task 3 ("still writes the clamped value back when the request is skipped"). ✔
- `FormData` bodies, `trigger` metadata → Task 3. ✔
- Server value from the `value` attribute / last `option[selected]`; never written → Task 2 + Task 3. ✔
- Failure restore gated on `isConnected` → Task 3. ✔
- Browser restoration reset at init, identity + non-empty server value only → Task 5. ✔
- Input busy state on queue-start / request-end / queue-idle, `readonly` (never `disabled`), `<select>` exception → Task 5. ✔
- Element: single-`<input>` requirement, self-attached `click`/`change` with `AbortController`, `closest()` dispatch, late-inserted buttons → Task 6. ✔
- Debounce per instance, `0` immediate, default 300, non-numeric errors once, detached input drops, `// TODO` for early flush → Task 7. ✔
- Button `aria-disabled` for busy and at `min`/`max`, numeric comparison, never `disabled`, focus preserved, busy from `connectedCallback` → Task 8. ✔
- Element subscribes to queue-start / queue-idle only, no request-end → Task 8. ✔
- Files, no cross-imports, `src/index.ts` wiring → Task 9. ✔
- Dev warnings deduped per node → Task 3 ("warns only once per node") and Task 7 (debounce). ✔

**Deliberately not implemented** (spec's Deferred section): `allow-remove`, early debounce flush, focus restoration, global `conf()`, stepping a `<select>`.

**Placeholder scan:** none — every step contains runnable code or an exact command. The one forward reference (`refresh()` as a no-op in Task 6) is explicit and filled in Task 8.

**Type consistency:** `Bounds` is produced in Task 1 and consumed unchanged by `clamp`/`nextValue` (Task 1), `commit` (Task 3), and `refresh`/`#onClick` (Tasks 6, 8). `Identity` is produced in Task 2 and used only in Task 3. `serverValue` returns `string` everywhere ("" means absent). `QuantityElement.refresh()` is public in Task 6 and called by `refreshAllElements` in Task 8. `initInputBinding` / `initQuantityElement` are both `(): void` and both idempotent, matching their use in Task 9.

**Note for the executor:** `quantity-input.ts` and `quantity-element.ts` are each built up across several tasks. Declare `ATTR`, `TAG`, `PLUS`, `MINUS`, `DEFAULT_DEBOUNCE`, and each file's `warnOnce` helper once at the top; later tasks show the additions, not a fresh file.
