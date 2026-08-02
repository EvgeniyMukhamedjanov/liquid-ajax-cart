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

  it("steps locally without requesting when the input has no identity", async () => {
    document.body.innerHTML = `
      <ajax-cart-quantity>
        <input type="number" name="quantity" value="1" min="1">
        <a data-ajax-cart-quantity-plus>+</a>
      </ajax-cart-quantity>`;

    (document.querySelector("[data-ajax-cart-quantity-plus]") as HTMLElement).click();
    await flushDebounce();

    expect((document.querySelector("input") as HTMLInputElement).value).toBe("2");
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
