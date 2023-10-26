import {DATA_ATTR_QUANTITY_INPUT} from "./quantity-input";
import {CUSTOM_ELEMENT_PREFIX, DATA_ATTR_PREFIX} from "../const";
import {getProcessingStatus} from "../ajax-api";
import {settings} from "../settings";

const ELEMENT_TAG = `${CUSTOM_ELEMENT_PREFIX}-quantity`;
const DATA_ATTR_QUANTITY_PLUS = `${DATA_ATTR_PREFIX}-quantity-plus`;
const DATA_ATTR_QUANTITY_MINUS = `${DATA_ATTR_PREFIX}-quantity-minus`;

function cartQuantityElementInit() {
  customElements.define(ELEMENT_TAG, class extends HTMLElement {
    _timer: ReturnType<typeof setTimeout> | undefined = undefined;
    _$input: HTMLInputElement;

    connectedCallback() {
      const $innerInputs = this.querySelectorAll('input')
      if ($innerInputs.length !== 1) {
        console.error(
          `Liquid Ajax Cart: "${ELEMENT_TAG}" element must have one "input" element as a child, ${$innerInputs.length} found`,
          this
        );
        return;
      }

      this._$input = $innerInputs[0];
      if (!this._$input.hasAttribute(DATA_ATTR_QUANTITY_INPUT)) {
        console.error(
          `Liquid Ajax Cart: "${ELEMENT_TAG}" element's input must have the "${DATA_ATTR_QUANTITY_INPUT}" attribute`,
          this._$input,
          this
        );
        return;
      }

      this.querySelectorAll(`[${DATA_ATTR_QUANTITY_PLUS}], [${DATA_ATTR_QUANTITY_MINUS}]`).forEach($button => {
        $button.addEventListener('click', event => {
          const {quantityTagAllowZero} = settings;
          const minValue = quantityTagAllowZero === true ? 0 : 1;

          if (!getProcessingStatus()) {
            const qtyValueCurrent = Number(this._$input.value);
            if (isNaN(qtyValueCurrent)) {
              console.error(
                `Liquid Ajax Cart: "${ELEMENT_TAG}" element's input value isn't a number`,
                this._$input,
                this
              );
              return;
            }

            let qtyValueNew = qtyValueCurrent;
            qtyValueNew = $button.hasAttribute(DATA_ATTR_QUANTITY_PLUS) ? qtyValueNew + 1 : qtyValueNew - 1;
            if (qtyValueNew < minValue) qtyValueNew = minValue;
            if (qtyValueNew !== qtyValueCurrent) {
              this._$input.value = qtyValueNew.toString();
              this._runAwaiting();
            }
          }

          event.preventDefault();
        });

        $button.addEventListener("focusout", (event: MouseEvent) => {
          if (event.relatedTarget && $button.contains(event.relatedTarget as Node))
            return;

          if (this._timer !== undefined) {
            this._runRequest();
          }
        });
      })
    }

    _runAwaiting() {
      const {quantityTagDebounce} = settings;
      if (this._timer !== undefined) {
        clearTimeout(this._timer);
      }

      if (quantityTagDebounce > 0) {
        this._timer = setTimeout(() => {
          this._runRequest();
        }, Number(quantityTagDebounce));
        return;
      }

      this._runRequest();
    }

    _runRequest() {
      if (this._timer !== undefined) {
        clearTimeout(this._timer);
      }
      this._timer = undefined;
      if (!getProcessingStatus()) {
        this._$input.dispatchEvent(new Event('change', {bubbles: true}));
      }
    }
  });
}

export {cartQuantityElementInit}