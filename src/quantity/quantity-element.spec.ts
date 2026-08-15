import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../core")>();
  return { ...actual, change: vi.fn(), isProcessing: vi.fn(() => false) };
});

import { isProcessing, EVENTS } from "../core";
import { QuantityElement, initQuantityElement } from "./quantity-element";

const isProcessingMock = vi.mocked(isProcessing);

// Register through the real init path rather than calling customElements.define
// directly, so the tests exercise what production runs.
initQuantityElement();

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
  <ajax-cart-quantity>
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
  // Unconditional, because a test that fails before its own spy.mockRestore()
  // would otherwise leave console.error spied and corrupt every test after it.
  vi.restoreAllMocks();
});

describe("structure", () => {
  it("errors when there is no input", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<ajax-cart-quantity><a data-ajax-cart-quantity-plus>+</a></ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("errors when there is more than one number input", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`<ajax-cart-quantity><input type="number"><input type="number"></ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  // Shopify markup carries hidden inputs everywhere. Counting every <input>
  // would have called this "more than one" and disabled the widget entirely.
  it("ignores non-number inputs alongside the one it steps", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`
      <ajax-cart-quantity>
        <input type="hidden" name="id" value="123">
        <input type="number" data-ajax-cart-quantity-input="1" value="2" min="1">
        <input type="hidden" name="section" value="cart">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);

    expect(spy).not.toHaveBeenCalled();
    click("[data-ajax-cart-quantity-plus]");
    expect((document.querySelector('input[type="number"]') as HTMLInputElement).value).toBe("3");
  });

  it("does nothing on click when the structure is invalid", () => {
    // Both inputs start at a real, steppable value: an earlier version of
    // this test used empty inputs, which made #onClick's own empty-value
    // check (unrelated to the structure guard) the reason nothing happened,
    // so the test passed even with the structure guard deleted entirely.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(
      `<ajax-cart-quantity><input type="number" value="2"><input type="number" value="2"><a data-ajax-cart-quantity-plus>+</a></ajax-cart-quantity>`,
    );
    click("[data-ajax-cart-quantity-plus]");
    document.querySelectorAll("input").forEach((el) => {
      expect((el as HTMLInputElement).value).toBe("2");
    });
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
    input().setAttribute("step", "3"); // min=1 → grid is 1, 4, 7, 10
    input().value = "4";
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("7");
  });

  // The widget renders value="2", which is off the 1/4/7/10 grid. Adding the
  // step would give 5 — not orderable, and rejected by Shopify's quantity
  // rules. Native stepUp moves to the nearest grid point instead.
  it("snaps an off-grid value onto the grid instead of adding the step", () => {
    mount(WIDGET);
    input().setAttribute("step", "3");
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("4");

    input().value = "2";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("1");
  });

  it("does nothing while the queue is processing", () => {
    mount(WIDGET);
    isProcessingMock.mockReturnValue(true);
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("2");
  });

  // An empty field carries no quantity to step from, and native treats it as 0
  // — so minus would land on `min` (or 0 with no `min`) and remove the line.
  // Reachable only with no `value` attribute: the blur-driven `change` runs
  // commit(), whose empty branch calls restore() — which no-ops when there is
  // nothing to restore to, leaving the field empty when the click lands.
  it("does nothing when the field is empty", () => {
    mount(WIDGET);
    input().value = "";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("");
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("");
  });

  it("does not remove a line when minus is pressed on a cleared field", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="3" min="0" step="1">
      </ajax-cart-quantity>`);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    input().value = "";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("");
    expect(seen).toEqual([]); // no synthetic change, so nothing commits a 0
  });

  // Native refuses to step below min, so nothing can walk into a removal or a
  // negative quantity by holding the minus button.
  it("will not step below min", () => {
    mount(WIDGET);
    input().value = "1";
    click("[data-ajax-cart-quantity-minus]");
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("1");
  });

  // With no min attribute the browser is unbounded, so minus reaches 0 and the
  // line is removed — that is the natural behaviour, deliberately kept.
  it("steps to 0 when min is absent", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    input().value = "1";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  // The element wraps cart-connected inputs only, so an input without the
  // identity marker is invisible to the selector and the structure check
  // reports "found 0" — the same message as no input at all. Nothing is bound,
  // so the buttons keep their own href fallback.
  it("ignores an input that is not cart-connected", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" name="quantity" value="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);

    expect(spy).toHaveBeenCalledTimes(1);
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("1"); // untouched
  });

  // Kept as a marked input: the binding floors negatives too, so this is not
  // the last line of defence — but the display should not show -1 in the gap
  // before that request lands.
  it("never steps below 0", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);

    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
    isProcessingMock.mockReturnValue(false); // the request the click would start
    click("[data-ajax-cart-quantity-minus]");
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  // With `min` absent the step base is the value attribute, so step="2" from 1
  // gives a grid of …-3, -1, 1, 3… that skips 0 entirely — stepping down
  // overshoots to -1. Landing on 0 rather than reverting means this removes the
  // line like any other step to 0, with no opt-in: the merchant wrote no `min`,
  // so they already accepted that minus reaches 0.
  it("lands on 0 when the step grid skips it", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1" step="2">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  // Native allows stepping past 0 when `min` itself is negative.
  it("never steps below 0 when min is negative", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" name="quantity" value="0" min="-5">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);

    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  // 0 is a hard floor for the buttons regardless of min: a cart line has no
  // representation below it. Without this, the debounce delays the request long
  // enough for a second click to land while the row is still on screen.
  it("never steps below 0, even on a rapid second click", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    input().value = "1";
    click("[data-ajax-cart-quantity-minus]");
    click("[data-ajax-cart-quantity-minus]");
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  // Debouncing coalesces accumulating steps; nothing accumulates below 0, so a
  // removal fires at once rather than sitting in the window.
  it("fires a removal immediately instead of debouncing it", () => {
    vi.useFakeTimers();
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    input().value = "1";
    click("[data-ajax-cart-quantity-minus]");
    expect(seen).toEqual(["fired"]); // no timer advance
    vi.useRealTimers();
  });

  it("steps to 0 when the merchant opted in with min=0", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1" min="0">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    input().value = "1";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  // Reported at connect, not on the first click: the merchant sees it on page
  // load, and it needs no dedup because #init runs once per connection.
  it("reports a non-steppable input at connect and stays silent on click", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`
      <ajax-cart-quantity>
        <input type="text" data-ajax-cart-quantity-input="1" value="2">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1); // before any interaction

    click("[data-ajax-cart-quantity-plus]");
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("2");
    expect(spy).toHaveBeenCalledTimes(1); // clicks add nothing
  });

  it("reports an input with no type attribute, which defaults to text", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`
      <ajax-cart-quantity>
        <input data-ajax-cart-quantity-input="1" value="2">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // The keyword is ASCII case-insensitive, so both spellings throw. Without the
  // `i` flag on the selector, "ANY" would pass the structure check and then
  // fail silently inside the click handler's catch.
  it.each(["any", "ANY", "AnY"])("reports step=%s, which cannot be stepped", (step) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`
      <ajax-cart-quantity>
        <input type="number" step="${step}" data-ajax-cart-quantity-input="1" value="2">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  // Every step value other than the `any` keyword falls back to 1 in the
  // browser and steps normally, so the selector deliberately filters none of
  // them — nothing here should be treated as broken markup.
  // A fractional step is not rejected here. Nobody writes one — Shopify types
  // QuantityRule's increment as Int!, so generated markup never produces it —
  // and a fractional quantity that does reach the cart comes back as "expected
  // integer", like any other value the server refuses. The element steps onto
  // whatever grid the browser gives it.
  it("steps a fractional step onto the browser's grid", () => {
    mount(`
      <ajax-cart-quantity>
        <input type="number" min="1" step="1.5" data-ajax-cart-quantity-input="1" value="3">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("4");
  });

  // The immediate-fire test asks "is this a removal", not "is this small". A
  // fractional step is the only thing that tells the two apart: 0.5 is below 1
  // but removes nothing, and sending it alone would draw "expected integer"
  // from Shopify instead of coalescing with the next click into a real 0.
  it("debounces a fractional step that lands between 0 and 1", () => {
    vi.useFakeTimers();
    mount(`
      <ajax-cart-quantity>
        <input type="number" step="0.5" data-ajax-cart-quantity-input="1" value="1">
        <a data-ajax-cart-quantity-minus>-</a>
      </ajax-cart-quantity>`);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0.5");
    expect(seen).toEqual([]); // not a removal, so it waits

    click("[data-ajax-cart-quantity-minus]"); // coalesces to a real 0
    expect(input().value).toBe("0");
    expect(seen).toEqual(["0"]); // and that one goes at once
    vi.useRealTimers();
  });

  it.each(["abc", "0", "-3", ""])("accepts step=%s, which falls back to 1", (step) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(`
      <ajax-cart-quantity>
        <input type="number" min="1" step="${step}" data-ajax-cart-quantity-input="1" value="3">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    expect(spy).not.toHaveBeenCalled();
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("4");
  });

  // Icon markup makes the click target an <svg>/<path>, which extends Element
  // but not HTMLElement — the resolution has to walk up from there.
  it("steps when the click lands on an svg icon inside the button", () => {
    mount(`
      <ajax-cart-quantity>
        <input type="number" data-ajax-cart-quantity-input="1" value="2" min="1">
        <button type="button" data-ajax-cart-quantity-plus>
          <svg viewBox="0 0 10 10"><path d="M0 0h10"/></svg>
        </button>
      </ajax-cart-quantity>`);

    (document.querySelector("path") as unknown as SVGElement).dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    expect(input().value).toBe("3");
  });

  // No markup reaches this — the selector excludes both documented throw cases
  // — so stepUp is stubbed to force it. The point is that an unanticipated
  // throw surfaces the error rather than leaving a button that silently does
  // nothing, and that it does not escape the handler.
  it("reports rather than swallowing an unexpected step failure", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    mount(WIDGET);
    const boom = new DOMException("nope", "InvalidStateError");
    vi.spyOn(input(), "stepUp").mockImplementation(() => {
      throw boom;
    });

    expect(() => click("[data-ajax-cart-quantity-plus]")).not.toThrow();
    expect(input().value).toBe("2"); // unchanged
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toContain(boom); // the cause is passed through
  });

  // The mirror of the button case below. A children-only render replaces the
  // input while the element stays put, so #onClick and refresh() re-query it
  // rather than holding a reference from #init — cache it there and the stepper
  // silently drives a detached node: clicks change nothing on screen, and the
  // buttons dim from a value nobody can see.
  it("steps an input swapped in after connect", () => {
    const el = mount(WIDGET);
    const replacement = input().cloneNode() as HTMLInputElement;
    replacement.value = "7";
    input().replaceWith(replacement);

    click("[data-ajax-cart-quantity-plus]");
    expect(replacement.value).toBe("8"); // the live node stepped
    expect(el.querySelectorAll("input")).toHaveLength(1);
  });

  it("dims from the swapped-in input's value, not the replaced one", () => {
    const el = mount(WIDGET); // min=1, max=10
    const replacement = input().cloneNode() as HTMLInputElement;
    replacement.value = "10"; // at max
    input().replaceWith(replacement);

    (el as unknown as { refresh(): void }).refresh();
    expect(el.querySelector("[data-ajax-cart-quantity-plus]")?.getAttribute("aria-disabled")).toBe(
      "true",
    );
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

  it("does not double-bind after being removed and re-appended", () => {
    mount(WIDGET);
    const widget = document.querySelector("ajax-cart-quantity") as HTMLElement;
    widget.remove();
    document.body.append(widget);
    click("[data-ajax-cart-quantity-plus]");
    // A double-bound element would advance by two steps (2 -> 4) instead of one.
    expect(input().value).toBe("3");
  });
});

describe("remove-at-min", () => {
  // B2B: min is a real quantity_rule.min, so minus at 6 would otherwise be a
  // dead press. The attribute turns it into a removal.
  const B2B = `
    <ajax-cart-quantity remove-at-min>
      <a data-ajax-cart-quantity-minus>-</a>
      <input type="number" data-ajax-cart-quantity-input="1" value="6" min="6" max="20">
      <a data-ajax-cart-quantity-plus>+</a>
    </ajax-cart-quantity>`;

  it("sends 0 when minus is pressed at min", () => {
    mount(B2B);
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  it("steps normally above min", () => {
    mount(B2B);
    input().value = "7";
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("6");
  });

  it("does nothing at min without the attribute", () => {
    mount(B2B.replace(" remove-at-min", ""));
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("6");
  });

  // The value not moving is only half of it. #onClick's refusal branch returns
  // BEFORE #schedule, and nothing else pins that: let the refusal fall through
  // and every press on a dimmed button fires a change.js re-sending the
  // quantity the cart already holds — invisible to a value-only assertion,
  // since a synthetic change alters no value.
  it("dispatches nothing when a step is refused", () => {
    vi.useFakeTimers();
    mount(B2B.replace(" remove-at-min", "")); // min=6, value=6
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-minus]"); // refused at min
    vi.advanceTimersByTime(300);
    expect(seen).toEqual([]);
    vi.useRealTimers();
  });

  it("dispatches nothing when plus is refused at max", () => {
    vi.useFakeTimers();
    mount(WIDGET); // max=10
    input().value = "10";
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    vi.advanceTimersByTime(300);
    expect(seen).toEqual([]);
    vi.useRealTimers();
  });

  // Without the already-0 guard a second press would re-send 0 for a line that
  // is already gone.
  it("does not fire again once the value is 0", () => {
    vi.useFakeTimers();
    mount(B2B);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-minus]");
    expect(seen).toEqual(["fired"]); // removals skip the debounce
    click("[data-ajax-cart-quantity-minus]");
    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // stepDown refuses numerically but still rewrites the string "06" -> "6".
  // A string comparison would read that as movement and skip the removal.
  it.each(["06", "6.0", "6e0"])("removes at min with a non-canonical value=%s", (value) => {
    mount(`
      <ajax-cart-quantity remove-at-min>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="${value}" min="6">
      </ajax-cart-quantity>`);
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });

  it("never turns a plus at max into a removal", () => {
    mount(B2B);
    input().value = "20";
    click("[data-ajax-cart-quantity-plus]");
    expect(input().value).toBe("20");
  });

  // Dimming must agree with what a click does, or minus looks dead while it
  // removes — the failure this element has had twice before.
  it("leaves minus live at min, and dims it only at 0", () => {
    mount(B2B);
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();

    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
  });

  it("dims minus at min when the attribute is absent", () => {
    mount(B2B.replace(" remove-at-min", ""));
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
  });

  // With min at 0 minus already reaches 0 on its own, so the attribute changes
  // nothing rather than double-firing or skipping a step.
  it("is inert when min is 0", () => {
    mount(`
      <ajax-cart-quantity remove-at-min>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="2" min="0">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("1");
    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
  });
});

describe("debounce", () => {
  // A step still in the debounce window is stale once the value is committed by
  // another route. Left armed it fires after the newer commit and, with the
  // queue busy, re-enters commit() and repaints the old quantity over the edit
  // in flight — the shopper watches their 5 revert to 3.
  it("cancels a pending step when the input commits by another route", () => {
    vi.useFakeTimers();
    mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-plus]"); // timer armed at 3
    input().value = "5"; // shopper types over it
    input().dispatchEvent(new Event("change", { bubbles: true })); // and commits

    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["5"]); // no stale "3" dispatched behind it
    vi.useRealTimers();
  });

  // The listener is on the element, so every change bubbling out of it arrives
  // — and the structure check only rejects extra input[type="number"], so a
  // line-property select or a gift-wrap checkbox may legitimately sit inside.
  // Without narrowing, toggling one mid-window silently discards the step.
  it("keeps a pending step when another control inside the widget changes", () => {
    vi.useFakeTimers();
    mount(`
      <ajax-cart-quantity>
        <input type="number" data-ajax-cart-quantity-input="1" value="2">
        <a data-ajax-cart-quantity-plus>+</a>
        <input type="checkbox" id="wrap">
      </ajax-cart-quantity>`);
    const seen: string[] = [];
    document.addEventListener("change", (e) => {
      if ((e.target as HTMLElement).id !== "wrap") seen.push((e.target as HTMLInputElement).value);
    });

    click("[data-ajax-cart-quantity-plus]"); // timer armed at 3
    document.getElementById("wrap")?.dispatchEvent(new Event("change", { bubbles: true }));

    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["3"]); // the step survived
    vi.useRealTimers();
  });

  it("dispatches one bubbling change after several clicks", async () => {
    vi.useFakeTimers();
    mount(WIDGET);
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

  it("dispatches the last value once the window elapses", async () => {
    vi.useFakeTimers();
    mount(WIDGET.replace(``, ""));
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    vi.advanceTimersByTime(299);
    expect(seen).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // The window is a module constant, so a stray `debounce` attribute in older
  // markup is simply inert rather than an error.
  it("ignores a debounce attribute left over from earlier markup", () => {
    vi.useFakeTimers();
    mount(WIDGET.replace("<ajax-cart-quantity>", `<ajax-cart-quantity debounce="2000">`));
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // The two tests below used to be a single "drops a pending dispatch when
  // the element is disconnected" test that removed the whole widget from the
  // DOM. That scenario triggers disconnectedCallback's clearTimeout AND makes
  // the pending input detached (failing #fire's isConnected check) at the
  // same time, so deleting either mechanism alone still left the test green.
  // Isolated below.

  it("clears the pending timer on disconnect, so a reconnect cannot resurrect it", () => {
    vi.useFakeTimers();
    const widget = mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]"); // arms the timer
    widget.remove(); // disconnectedCallback must clear it

    // Reconnect the same node before the original timer would have fired: if
    // clearTimeout were skipped, the stale timer would still be pending and
    // would now pass #fire's isConnected check too, since the input is
    // connected again.
    document.body.append(widget);

    vi.advanceTimersByTime(300);
    expect(seen).toEqual([]);
    vi.useRealTimers();
  });

  it("does not dispatch a stale timer into a detached input when only the input was replaced", () => {
    vi.useFakeTimers();
    mount(WIDGET);
    const oldInput = input();
    const seenOnOldInput: string[] = [];
    oldInput.addEventListener("change", () => seenOnOldInput.push("fired"));

    click("[data-ajax-cart-quantity-plus]"); // arms the timer against oldInput

    // A fragment render that swaps only the input, leaving <ajax-cart-quantity>
    // itself connected: disconnectedCallback never runs, so the timer survives
    // purely on #fire's own isConnected guard.
    const replacement = document.createElement("input");
    replacement.type = "number";
    replacement.setAttribute("data-ajax-cart-quantity-input", "1");
    replacement.value = "2";
    replacement.min = "1";
    replacement.max = "10";
    oldInput.replaceWith(replacement);

    vi.advanceTimersByTime(300);
    expect(seenOnOldInput).toEqual([]);
    vi.useRealTimers();
  });
});

function ariaOf(selector: string): string | null {
  return (document.querySelector(selector) as HTMLElement).getAttribute("aria-disabled");
}

describe("early flush", () => {
  function pointerdownOn(node: EventTarget): void {
    node.dispatchEvent(new Event("pointerdown", { bubbles: true }));
  }

  function focusoutTo(el: HTMLElement, relatedTarget: EventTarget | null): void {
    el.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget }));
  }

  // Programmatic value writes fire no native `change`, so a stepped quantity is
  // carried ONLY by this timer. Click Checkout with one pending and the value
  // is lost — pointerdown runs before navigation, so the request gets away.
  it("flushes a pending step on pointerdown outside the element", () => {
    vi.useFakeTimers();
    mount(`<div>${WIDGET}<button id="out">checkout</button></div>`);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-plus]");
    expect(seen).toEqual([]); // still inside the 300ms window

    pointerdownOn(document.getElementById("out") as HTMLElement);
    expect(seen).toEqual(["3"]); // fired without waiting
    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["3"]); // and only once
    vi.useRealTimers();
  });

  it("leaves the timer alone for a pointerdown inside the element", () => {
    vi.useFakeTimers();
    mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-plus]");
    pointerdownOn(document.querySelector("[data-ajax-cart-quantity-minus]") as HTMLElement);
    expect(seen).toEqual([]); // pressing the other button must not commit mid-adjustment

    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["3"]);
    vi.useRealTimers();
  });

  it("does nothing on an outside pointerdown when no step is pending", () => {
    mount(`<div>${WIDGET}<button id="out">x</button></div>`);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    pointerdownOn(document.getElementById("out") as HTMLElement);
    expect(seen).toEqual([]);
  });

  // Keyboard users generate no pointer event at all.
  it("flushes on focusout that leaves the element", () => {
    vi.useFakeTimers();
    const el = mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-plus]");
    focusoutTo(el, document.body);
    expect(seen).toEqual(["3"]);
    vi.useRealTimers();
  });

  it("flushes on focusout with no relatedTarget", () => {
    vi.useFakeTimers();
    const el = mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    focusoutTo(el, null); // focus went nowhere the browser will name
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // Tabbing from minus to plus must not commit a half-made adjustment.
  it("ignores focusout that stays within the element", () => {
    vi.useFakeTimers();
    const el = mount(WIDGET);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    focusoutTo(el, document.querySelector("[data-ajax-cart-quantity-minus]"));
    expect(seen).toEqual([]);

    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // pointerdown precedes focusout in one gesture; the second must find nothing.
  it("fires once when both signals arrive for the same gesture", () => {
    vi.useFakeTimers();
    const el = mount(`<div>${WIDGET}<button id="out">x</button></div>`);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    pointerdownOn(document.getElementById("out") as HTMLElement);
    focusoutTo(el.querySelector("ajax-cart-quantity") as HTMLElement, document.body);
    vi.advanceTimersByTime(300);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // Capture, not bubble: a theme's own pointerdown handler calling
  // stopPropagation() — drawer overlays and dropdown-dismiss code do this
  // routinely — would otherwise silently disable every early flush on the page.
  it("flushes even when a handler in between stops propagation", () => {
    vi.useFakeTimers();
    mount(`<div>${WIDGET}<button id="out">checkout</button></div>`);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));
    document.getElementById("out")?.addEventListener("pointerdown", (e) => e.stopPropagation());

    click("[data-ajax-cart-quantity-plus]");
    pointerdownOn(document.getElementById("out") as HTMLElement);
    expect(seen).toEqual(["fired"]);
    vi.useRealTimers();
  });

  // Scoped to this element, not the document: on a cart page every line is a
  // widget, so a document-wide lookup would dispatch into the first line's
  // input no matter which line was stepped.
  it("flushes its own input, not the first one on the page", () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div>
        <ajax-cart-quantity>
          <input type="number" data-ajax-cart-quantity-input="1" value="5">
          <a data-ajax-cart-quantity-plus>+</a>
        </ajax-cart-quantity>
        <ajax-cart-quantity>
          <input type="number" data-ajax-cart-quantity-input="2" value="2">
          <a id="second-plus" data-ajax-cart-quantity-plus>+</a>
        </ajax-cart-quantity>
        <button id="out">x</button>
      </div>`;
    const seen: string[] = [];
    document.addEventListener("change", (e) =>
      seen.push(
        (e.target as HTMLInputElement).getAttribute("data-ajax-cart-quantity-input") ?? "?",
      ),
    );

    (document.getElementById("second-plus") as HTMLElement).click(); // step line 2
    pointerdownOn(document.getElementById("out") as HTMLElement);

    expect(seen).toEqual(["2"]); // line 2's input, not line 1's
    vi.useRealTimers();
  });

  it("stops listening for outside pointerdown once disconnected", () => {
    vi.useFakeTimers();
    mount(`<div>${WIDGET}<button id="out">x</button></div>`);
    const seen: string[] = [];
    document.addEventListener("change", () => seen.push("fired"));

    click("[data-ajax-cart-quantity-plus]");
    (document.querySelector("ajax-cart-quantity") as HTMLElement).remove();

    pointerdownOn(document.getElementById("out") as HTMLElement);
    vi.advanceTimersByTime(300);
    expect(seen).toEqual([]); // disconnect already cleared the timer
    vi.useRealTimers();
  });

  // The input is re-queried at flush time, not captured when the timer was set.
  it("flushes into an input swapped in after the step", () => {
    vi.useFakeTimers();
    mount(`<div>${WIDGET}<button id="out">x</button></div>`);
    const seen: string[] = [];
    document.addEventListener("change", (e) => seen.push((e.target as HTMLInputElement).value));

    click("[data-ajax-cart-quantity-plus]");
    const replacement = input().cloneNode() as HTMLInputElement;
    replacement.value = "9";
    input().replaceWith(replacement);

    pointerdownOn(document.getElementById("out") as HTMLElement);
    expect(seen).toEqual(["9"]); // the live node, not the detached one
    vi.useRealTimers();
  });
});

describe("button states", () => {
  // Dimming has to agree with what a click actually does. With `min` absent the
  // buttons step to 0, so dimming at 1 would show a disabled control that works.
  it("does not dim minus at 1 when min is absent, since 0 is reachable", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();

    click("[data-ajax-cart-quantity-minus]");
    expect(input().value).toBe("0");
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
  });

  // A negative min is overridden by the same hard floor, so minus must dim at 0
  // rather than at the attribute's value.
  it("dims minus at 0 when min is negative", () => {
    mount(`
      <ajax-cart-quantity>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="1" value="0" min="-5">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`);
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
  });

  // Number("") is 0, so an empty field would otherwise read as sitting at the
  // floor and dim minus.
  it("leaves both buttons live when the field is empty", async () => {
    mount(WIDGET);
    input().value = "";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBeNull();
  });

  it("dims minus at min and plus at max", async () => {
    mount(WIDGET);
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();

    input().value = "1";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve(); // #onChange's refresh is deferred to a microtask
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBeNull();

    input().value = "10";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBe("true");
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBeNull();
  });

  it("compares numerically, so 01 counts as the minimum", async () => {
    mount(WIDGET);
    input().value = "01";
    input().dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve(); // #onChange's refresh is deferred to a microtask
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

  // Reproduces the scenario from the finding: a same-tick synchronous restore
  // (what quantity-input.ts's commit() does on an empty/non-integer value, or
  // on Escape) happens on `document`, which — because <ajax-cart-quantity> is
  // an ancestor of the input closer to the target — is reached AFTER this
  // element's own "change" listener during the bubble phase. #onChange must
  // defer its refresh to a microtask so it reads the post-restore value
  // instead of computing stale button states from the moment the event fired.
  it("recomputes button states after a same-tick restore triggered by its own change event", async () => {
    mount(WIDGET.replace('value="2"', 'value="1"')); // starts at min
    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");

    // Stands in for quantity-input.ts's delegated document-level handler,
    // without importing it (the two files must never import each other).
    const restoreOnChange = (): void => {
      input().value = "1";
    };
    document.addEventListener("change", restoreOnChange);

    input().value = ""; // e.g. the user cleared the field and blurred
    input().dispatchEvent(new Event("change", { bubbles: true }));

    await Promise.resolve(); // let the deferred refresh() run

    expect(ariaOf("[data-ajax-cart-quantity-minus]")).toBe("true");
    document.removeEventListener("change", restoreOnChange);
  });
});

describe("queue subscription", () => {
  it("reacts to queue-start and queue-idle", () => {
    mount(WIDGET);

    isProcessingMock.mockReturnValue(true);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBe("true");

    isProcessingMock.mockReturnValue(false);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} }));
    expect(ariaOf("[data-ajax-cart-quantity-plus]")).toBeNull();
  });

  it("drives every element independently", () => {
    mount(`<div>${WIDGET}${WIDGET}</div>`);
    expect(document.querySelectorAll("ajax-cart-quantity")).toHaveLength(2);

    isProcessingMock.mockReturnValue(true);
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));

    document.querySelectorAll("[data-ajax-cart-quantity-plus]").forEach((b) => {
      expect(b.getAttribute("aria-disabled")).toBe("true");
    });
  });

  // Each element subscribes to document in connectedCallback, so the
  // AbortController in disconnectedCallback is the only thing standing between
  // this design and v2's leak — where every render left three dead document
  // listeners per line item behind.
  it("releases its document listeners on disconnect", () => {
    mount(WIDGET);
    const widget = document.querySelector("ajax-cart-quantity") as QuantityElement;
    let refreshes = 0;
    widget.refresh = () => refreshes++;

    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    expect(refreshes).toBe(1);

    widget.remove();
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_IDLE, { detail: {} }));
    expect(refreshes).toBe(1);
  });

  it("re-subscribes exactly once when re-appended", () => {
    mount(WIDGET);
    const widget = document.querySelector("ajax-cart-quantity") as QuantityElement;
    const host = widget.parentElement as HTMLElement;

    widget.remove();
    host.appendChild(widget);

    let refreshes = 0;
    widget.refresh = () => refreshes++;
    document.dispatchEvent(new CustomEvent(EVENTS.QUEUE_START, { detail: {} }));
    expect(refreshes).toBe(1);
  });
});

describe("initQuantityElement", () => {
  it("defines the element and tolerates repeat calls", () => {
    expect(customElements.get("ajax-cart-quantity")).toBe(QuantityElement);
    expect(() => {
      initQuantityElement();
      initQuantityElement();
    }).not.toThrow();
  });
});
