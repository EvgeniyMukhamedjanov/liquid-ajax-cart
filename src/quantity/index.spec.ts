import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { userEvent } from "@vitest/browser/context";

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

/**
 * Real time, not fake timers: these are the end-to-end tests, and the point is
 * that a click travels through the element's debounce, the delegated listener,
 * and core without any of it being stubbed. 350 > the 300ms window.
 */
function flushDebounce(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 350));
}

describe("quantity module init", () => {
  it("steps and commits end to end", async () => {
    document.body.innerHTML = `
      <ajax-cart-quantity>
        <input type="number" data-ajax-cart-quantity-input="2" value="1" min="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`;

    (document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLElement).click();
    await flushDebounce();

    const body = changeMock.mock.calls[0][0] as FormData;
    expect(Object.fromEntries([...body.entries()])).toEqual({ line: "2", quantity: "2" });
  });

  // The whole point of remove-at-min: a B2B line whose min is a real
  // quantity_rule.min must still be removable with the minus button. Asserted
  // end to end because the element writes the value and the binding sends it —
  // an earlier design had the binding lift the 0 straight back to 1.
  it("removes a B2B line when minus is pressed at min", async () => {
    document.body.innerHTML = `
      <ajax-cart-quantity remove-at-min>
        <a data-ajax-cart-quantity-minus>-</a>
        <input type="number" data-ajax-cart-quantity-input="7" value="6" min="6">
      </ajax-cart-quantity>`;

    (document.querySelector("[data-ajax-cart-quantity-minus]") as HTMLElement).click();
    await flush();

    const body = changeMock.mock.calls[0][0] as FormData;
    expect(Object.fromEntries([...body.entries()])).toEqual({ line: "7", quantity: "0" });
  });

  // Local stepping is not a feature of this module. The element wraps
  // cart-connected inputs only, which is what makes the busy state honest:
  // every stepper on the page is affected by the queue, so dimming on
  // isProcessing() is true of all of them rather than of most.
  it("ignores a widget whose input is not cart-connected", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    document.body.innerHTML = `
      <ajax-cart-quantity>
        <input type="number" name="quantity" value="1" min="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`;

    (document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLElement).click();
    await flushDebounce();

    expect((document.querySelector("input") as HTMLInputElement).value).toBe("1");
    expect(changeMock).not.toHaveBeenCalled();
  });

  it("commits a bare input with no element around it", async () => {
    document.body.innerHTML = `<input type="number" data-ajax-cart-quantity-input="4" value="1">`;
    const el = document.querySelector("input") as HTMLInputElement;
    el.value = "6";
    el.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    const body = changeMock.mock.calls[0][0] as FormData;
    expect(Object.fromEntries([...body.entries()])).toEqual({ line: "4", quantity: "6" });
  });
});

/**
 * The early flush and the browser's own `change` both react to a shopper
 * leaving the widget, so the two could plausibly commit the same departure
 * twice. Real pointer and keyboard input, because the distinction that keeps
 * them apart is native: a programmatic `value` write fires no `change` at all.
 */
describe("early flush does not double-commit", () => {
  const WIDGET = `
    <div>
      <ajax-cart-quantity>
        <input type="number" data-ajax-cart-quantity-input="1" value="2">
        <a id="plus" data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>
      <button id="out">checkout</button>
    </div>`;

  const quantities = (): string[] =>
    changeMock.mock.calls.map(
      (call) => Object.fromEntries([...(call[0] as FormData).entries()]).quantity as string,
    );

  // Typing arms no timer — #schedule runs only from #onClick — so the flush
  // finds nothing pending and the native change on blur is the only commit.
  it("commits once when the shopper types and clicks away", async () => {
    document.body.innerHTML = WIDGET;
    const el = document.querySelector("input") as HTMLInputElement;

    await userEvent.click(el);
    await userEvent.fill(el, "7");
    await userEvent.click(document.getElementById("out") as HTMLElement);
    await flushDebounce();

    expect(quantities()).toEqual(["7"]);
  });

  // A step DOES arm the timer, and the flush sends it — but clicking the button
  // moved focus off the input, so there is no pending native edit to fire a
  // competing change behind it.
  it("commits once when the shopper steps and clicks away", async () => {
    document.body.innerHTML = WIDGET;

    await userEvent.click(document.getElementById("plus") as HTMLElement);
    await userEvent.click(document.getElementById("out") as HTMLElement);
    await flushDebounce();

    expect(quantities()).toEqual(["3"]);
  });

  // And the flush must actually beat the debounce, or this proves nothing.
  it("sends the step before the debounce window would have elapsed", async () => {
    document.body.innerHTML = WIDGET;

    await userEvent.click(document.getElementById("plus") as HTMLElement);
    expect(changeMock).not.toHaveBeenCalled();

    await userEvent.click(document.getElementById("out") as HTMLElement);
    await flush(); // one macrotask, nowhere near 300ms
    expect(quantities()).toEqual(["3"]);
  });
});
