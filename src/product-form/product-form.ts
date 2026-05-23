import { add } from "../core";

const ELEMENT_TAG = "ajax-cart-product-form";
const ATTR_PROCESSING = "processing";

export class ProductFormElement extends HTMLElement {
  #form: HTMLFormElement | null = null;

  connectedCallback() {
    if (document.readyState !== "loading" || this.querySelector("form")) {
      this.refresh();
      return;
    }
    document.addEventListener("DOMContentLoaded", () => this.refresh(), { once: true });
  }

  disconnectedCallback() {
    this.refresh();
  }

  refresh() {
    this.#form?.removeEventListener("submit", this.#onSubmit);
    this.#form = null;

    if (!this.isConnected) return;

    const forms = this.querySelectorAll("form");
    if (forms.length !== 1) {
      console.error(
        `Liquid Ajax Cart: <${ELEMENT_TAG}> must contain exactly one <form>, found ${forms.length}.`,
        this,
      );
      return;
    }

    const form = forms[0];
    const root = window.Shopify?.routes?.root ?? "/";
    let pathname = "";
    try {
      pathname = new URL(form.action).pathname;
    } catch {
      // form.action is empty or malformed — pathname stays ""
    }
    if (pathname !== `${root}cart/add`) {
      console.error(
        `Liquid Ajax Cart: <${ELEMENT_TAG}>'s <form> "action" is not the "${root}cart/add" product-form URL.`,
        form,
        this,
      );
      return;
    }

    this.#form = form;
    form.addEventListener("submit", this.#onSubmit);
  }

  #onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if (!this.#form || this.hasAttribute(ATTR_PROCESSING)) return;

    const formData = new FormData(this.#form, event.submitter);

    this.setAttribute(ATTR_PROCESSING, "");

    add(formData, { meta: { initiator: this, source: ELEMENT_TAG } }).finally(() => {
      this.removeAttribute(ATTR_PROCESSING);
    });
  };
}

export function initProductForm(): void {
  if (customElements.get(ELEMENT_TAG)) return;
  customElements.define(ELEMENT_TAG, ProductFormElement);
}

initProductForm();
