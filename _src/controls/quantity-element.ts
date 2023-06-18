import {DATA_ATTR_QUANTITY_INPUT} from "./quantity-input";
import {CUSTOM_ELEMENT_PREFIX, DATA_ATTR_PREFIX} from "../const";
import {getCartState} from "../state";

const ELEMENT_TAG = `${CUSTOM_ELEMENT_PREFIX}-quantity`;
const DATA_ATTR_QUANTITY_PLUS = `${DATA_ATTR_PREFIX}-quantity-plus`;
const DATA_ATTR_QUANTITY_MINUS = `${DATA_ATTR_PREFIX}-quantity-minus`;
const AWAITING_TIME = 300;

function cartQuantityElementInit() {
  customElements.define(ELEMENT_TAG, class extends HTMLElement {
    #timer: ReturnType<typeof setTimeout> | undefined = undefined;
    #$input: HTMLInputElement;

    constructor() {
      super();

      const $innerInputs = this.querySelectorAll('input')
      if ($innerInputs.length !== 1) {
        console.error(
          `Liquid Ajax Cart: "${ELEMENT_TAG}" element must have one "input" element as a child, ${$innerInputs.length} found`,
          this
        );
        return;
      }

      this.#$input = $innerInputs[0];
      if (!this.#$input.hasAttribute(DATA_ATTR_QUANTITY_INPUT)) {
        console.error(
          `Liquid Ajax Cart: "${ELEMENT_TAG}" element's input must have the "${DATA_ATTR_QUANTITY_INPUT}" attribute`,
          this.#$input,
          this
        );
        return;
      }

      this.querySelectorAll(`[${DATA_ATTR_QUANTITY_PLUS}], [${DATA_ATTR_QUANTITY_MINUS}]`).forEach($button => {
        $button.addEventListener('click', event => {

          const state = getCartState();
          if (!state.status.requestInProgress && state.status.cartStateSet) {
            const qtyValueCurrent = Number(this.#$input.value);
            if (isNaN(qtyValueCurrent)) {
              console.error(
                `Liquid Ajax Cart: "${ELEMENT_TAG}" element's input value isn't a number`,
                this.#$input,
                this
              );
              return;
            }

            let qtyValueNew = qtyValueCurrent;
            qtyValueNew = $button.hasAttribute(DATA_ATTR_QUANTITY_PLUS) ? qtyValueNew + 1 : qtyValueNew - 1;
            if (qtyValueNew < 1) qtyValueNew = 1;
            if (qtyValueNew !== qtyValueCurrent) {
              this.#$input.value = qtyValueNew.toString();
              this.#runAwaiting();
            }
          }

          event.preventDefault();
        });

        $button.addEventListener("focusout", (event: MouseEvent) => {
          if (event.relatedTarget && $button.contains(event.relatedTarget as Node))
            return;

          if (this.#timer !== undefined) {
            this.#runRequest();
          }
        });
      })
    }

    #runAwaiting() {
      if (this.#timer !== undefined) {
        clearTimeout(this.#timer);
      }
      this.#timer = setTimeout(() => {
        this.#runRequest();
      }, AWAITING_TIME)
    }

    #runRequest() {
      if (this.#timer !== undefined) {
        clearTimeout(this.#timer);
      }
      this.#timer = undefined;
      const state = getCartState();
      if (!state.status.requestInProgress && state.status.cartStateSet) {
        this.#$input.dispatchEvent(new Event('change', {bubbles: true}));
      }
    }
  });
}

export {cartQuantityElementInit}