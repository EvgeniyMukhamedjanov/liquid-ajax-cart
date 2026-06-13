import { afterEach, beforeEach, expect, test, vi } from "vitest";

// Stub the core module so submissions are observable without hitting fetch/the queue.
vi.mock("../core", () => ({
  add: vi.fn(),
}));

import type { RequestResult } from "../core";
import { add } from "../core";
import "./product-form"; // registers <ajax-cart-product-form>
import type { ProductFormElement } from "./product-form";

const addMock = vi.mocked(add);

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  addMock.mockReset();
  addMock.mockResolvedValue({ ok: true, status: 200, body: {} });
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  document.body.innerHTML = "";
  consoleErrorSpy.mockRestore();
  delete (window as { Shopify?: unknown }).Shopify;
});

// =============================================================================
// Helpers
// =============================================================================

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Lets pending microtasks (the `.finally` after `add`) settle. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

type FormSpec = { action?: string; formCount?: number };

/** Builds (but does not connect) an <ajax-cart-product-form> with child forms. */
function buildProductForm({ action = "/cart/add", formCount = 1 }: FormSpec = {}) {
  const element = document.createElement("ajax-cart-product-form");

  for (let i = 0; i < formCount; i += 1) {
    const form = document.createElement("form");
    form.action = action;
    form.method = "post";

    const idInput = document.createElement("input");
    idInput.type = "hidden";
    idInput.name = "id";
    idInput.value = "12345";
    form.appendChild(idInput);

    const button = document.createElement("button");
    button.type = "submit";
    button.name = "add";
    button.value = "Add to cart";
    form.appendChild(button);

    element.appendChild(form);
  }

  return element;
}

/** Builds the form, connects it to the document, and returns its parts. */
function mountProductForm(spec?: FormSpec) {
  const element = buildProductForm(spec);
  document.body.appendChild(element);
  const form = element.querySelector("form");
  const button = element.querySelector("button");
  return { element, form, button };
}

// =============================================================================
// Submission
// =============================================================================

test("submits the form data via add() and prevents native submission", () => {
  const { element, form, button } = mountProductForm();

  let submitEvent: SubmitEvent | undefined;
  form!.addEventListener("submit", (event) => {
    submitEvent = event as SubmitEvent;
  });

  form!.requestSubmit(button);

  expect(submitEvent?.defaultPrevented).toBe(true);
  expect(addMock).toHaveBeenCalledTimes(1);

  const [body, options] = addMock.mock.calls[0];
  expect(body).toBeInstanceOf(FormData);
  expect((body as FormData).get("id")).toBe("12345");
  expect(options?.trigger?.initiator).toBe(element);
  expect(options?.trigger?.source).toBe("ajax-cart-product-form");
});

test("includes the activated submit button's name/value", () => {
  const { form, button } = mountProductForm();

  form!.requestSubmit(button);

  const body = addMock.mock.calls[0][0] as FormData;
  expect(body.get("add")).toBe("Add to cart");
});

test("respects window.Shopify.routes.root when validating the action URL", () => {
  (window as { Shopify?: unknown }).Shopify = { routes: { root: "/en/" } };
  const { form, button } = mountProductForm({ action: "/en/cart/add" });

  form!.requestSubmit(button);

  expect(consoleErrorSpy).not.toHaveBeenCalled();
  expect(addMock).toHaveBeenCalledTimes(1);
});

// =============================================================================
// Error rendering wiring
// =============================================================================

/** Appends a catch-all error slot inside the wrapper and returns it. */
function addErrorSlot(element: HTMLElement, initialHTML = ""): HTMLElement {
  const slot = document.createElement("div");
  slot.setAttribute("data-ajax-cart-product-form-error", "");
  slot.innerHTML = initialHTML;
  element.appendChild(slot);
  return slot;
}

test("renders errors into a slot when the request fails", async () => {
  const { element, form, button } = mountProductForm();
  const slot = addErrorSlot(element);

  addMock.mockResolvedValue({ ok: false, status: 422, body: { description: "Sold out" } });
  form!.requestSubmit(button);
  await flush();

  expect(slot.querySelector("span")?.textContent).toBe("Sold out");
});

test("clears stale errors before submitting and does not re-render on success", async () => {
  const { element, form, button } = mountProductForm();
  const slot = addErrorSlot(element, "<span>old error</span>");

  // addMock defaults to a successful result in beforeEach.
  form!.requestSubmit(button);
  await flush();

  expect(slot.textContent).toBe("");
});

// =============================================================================
// Processing attribute
// =============================================================================

test("sets the processing attribute while the request is in flight", async () => {
  const pending = deferred<RequestResult>();
  addMock.mockReturnValue(pending.promise);

  const { element, form, button } = mountProductForm();
  form!.requestSubmit(button);

  expect(element.hasAttribute("processing")).toBe(true);

  pending.resolve({ ok: true, status: 200, body: {} });
  await flush();

  expect(element.hasAttribute("processing")).toBe(false);
});

test("clears the processing attribute when the request fails", async () => {
  const pending = deferred<RequestResult>();
  addMock.mockReturnValue(pending.promise);

  const { element, form, button } = mountProductForm();
  form!.requestSubmit(button);

  // core resolves with ok:false on failure — it never rejects.
  pending.resolve({ ok: false, status: null, body: null });
  await flush();

  expect(element.hasAttribute("processing")).toBe(false);
});

test("ignores submissions while a request is already processing", () => {
  addMock.mockReturnValue(deferred<RequestResult>().promise); // never settles

  const { form, button } = mountProductForm();
  form!.requestSubmit(button);
  form!.requestSubmit(button);

  expect(addMock).toHaveBeenCalledTimes(1);
});

// =============================================================================
// Validation
// =============================================================================

test("logs an error and stays inert when there is no child form", () => {
  mountProductForm({ formCount: 0 });

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining("must contain exactly one <form>"),
    expect.anything(),
  );
});

test("logs an error when there are multiple child forms", () => {
  mountProductForm({ formCount: 2 });

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining("must contain exactly one <form>"),
    expect.anything(),
  );
});

test("logs an error and does not submit when the action is not a cart/add URL", () => {
  const { form, button } = mountProductForm({ action: "/cart/change" });

  // The module leaves an invalid form unwired, so guard against real navigation.
  form!.addEventListener("submit", (event) => event.preventDefault());
  form!.requestSubmit(button);

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining('"action" is not'),
    expect.anything(),
    expect.anything(),
  );
  expect(addMock).not.toHaveBeenCalled();
});

// =============================================================================
// Lifecycle
// =============================================================================

test("stops handling submissions after the element is disconnected", () => {
  const { element, form, button } = mountProductForm();

  element.remove();
  form!.dispatchEvent(new SubmitEvent("submit", { submitter: button, cancelable: true }));

  expect(addMock).not.toHaveBeenCalled();
});

// =============================================================================
// refresh()
// =============================================================================

/** Builds a single <form> with one hidden id input and one submit button. */
function buildForm(action = "/cart/add") {
  const form = document.createElement("form");
  form.action = action;
  form.method = "post";

  const idInput = document.createElement("input");
  idInput.type = "hidden";
  idInput.name = "id";
  idInput.value = "67890";
  form.appendChild(idInput);

  const button = document.createElement("button");
  button.type = "submit";
  button.name = "add";
  form.appendChild(button);

  return { form, button };
}

test("refresh() rewires submissions to a replacement form", () => {
  const { element, form: originalForm, button: originalButton } = mountProductForm();
  const refreshable = element as ProductFormElement;

  originalForm!.remove();
  const { form: newForm, button: newButton } = buildForm();
  element.appendChild(newForm);

  refreshable.refresh();

  newForm.requestSubmit(newButton);
  expect(addMock).toHaveBeenCalledTimes(1);
  expect((addMock.mock.calls[0][0] as FormData).get("id")).toBe("67890");

  // The original form's listener should be gone, even if it's still dispatched against.
  originalForm!.dispatchEvent(
    new SubmitEvent("submit", { submitter: originalButton, cancelable: true }),
  );
  expect(addMock).toHaveBeenCalledTimes(1);
});

test("refresh() does not duplicate the listener when the form is unchanged", () => {
  const { element, form, button } = mountProductForm();
  const refreshable = element as ProductFormElement;

  refreshable.refresh();
  refreshable.refresh();

  form!.requestSubmit(button);
  expect(addMock).toHaveBeenCalledTimes(1); // not duplicated
});

test("refresh() unwires the previous form when the replacement has an invalid action", () => {
  const { element, form: originalForm, button: originalButton } = mountProductForm();
  const refreshable = element as ProductFormElement;
  consoleErrorSpy.mockClear();

  originalForm!.remove();
  const { form: newForm } = buildForm("/cart/change");
  element.appendChild(newForm);

  refreshable.refresh();

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining('"action" is not'),
    expect.anything(),
    expect.anything(),
  );

  // The original form's listener should be gone — the wrapper is now inert.
  originalForm!.dispatchEvent(
    new SubmitEvent("submit", { submitter: originalButton, cancelable: true }),
  );
  expect(addMock).not.toHaveBeenCalled();
});

test("refresh() unwires the previous form when the wrapper ends up with multiple forms", () => {
  const { element, form: originalForm, button: originalButton } = mountProductForm();
  const refreshable = element as ProductFormElement;
  consoleErrorSpy.mockClear();

  const { form: extraForm } = buildForm();
  element.appendChild(extraForm);

  refreshable.refresh();

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining("must contain exactly one <form>"),
    expect.anything(),
  );

  // The original form's listener should be gone — the wrapper is now inert.
  originalForm!.dispatchEvent(
    new SubmitEvent("submit", { submitter: originalButton, cancelable: true }),
  );
  expect(addMock).not.toHaveBeenCalled();
});

test("refresh() unwires when the form is removed from the wrapper", () => {
  const { element, form, button } = mountProductForm();
  const refreshable = element as ProductFormElement;

  form!.remove();
  refreshable.refresh();

  form!.dispatchEvent(new SubmitEvent("submit", { submitter: button, cancelable: true }));
  expect(addMock).not.toHaveBeenCalled();
});

// =============================================================================
// Edge cases — probes that may expose issues
// =============================================================================

// Known leniency: validation inspects pathname only, so a cross-origin /cart/add
// URL is accepted. Pinned with `test.fails` so this is a tripwire if/when we
// tighten the check to also verify the host.
test.fails("rejects a cross-origin action URL whose pathname happens to match", () => {
  const element = document.createElement("ajax-cart-product-form");
  const { form } = buildForm("https://other-shop.example.com/cart/add");
  element.appendChild(form);
  document.body.appendChild(element);

  expect(consoleErrorSpy).toHaveBeenCalledWith(
    expect.stringContaining('"action" is not'),
    expect.anything(),
    expect.anything(),
  );
});

test("submits without an activated submitter (requestSubmit with no argument)", () => {
  const { form } = mountProductForm();

  form!.requestSubmit();

  expect(addMock).toHaveBeenCalledTimes(1);
  const body = addMock.mock.calls[0][0] as FormData;
  expect(body.get("id")).toBe("12345");
  // No submitter → the submit button's name/value should not be in the payload.
  expect(body.get("add")).toBe(null);
});

test("element removed during a pending request still clears processing on resolve", async () => {
  const pending = deferred<RequestResult>();
  addMock.mockReturnValue(pending.promise);

  const { element, form, button } = mountProductForm();
  form!.requestSubmit(button);
  expect(element.hasAttribute("processing")).toBe(true);

  element.remove();

  pending.resolve({ ok: true, status: 200, body: {} });
  await flush();

  expect(element.hasAttribute("processing")).toBe(false);
});

