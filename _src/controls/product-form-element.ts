import {cartRequestAdd} from "../ajax-api";
import {CUSTOM_ELEMENT_PREFIX} from "../const";

const ELEMENT_TAG = `${CUSTOM_ELEMENT_PREFIX}-product-form`;
const DATA_ATTR_LOADING = 'in-progress';

function cartProductFormElementInit() {
  customElements.define(ELEMENT_TAG, class extends HTMLElement {
    constructor() {
      super();
      const $element = this;

      const $innerForms = this.querySelectorAll('form')
      if ($innerForms.length !== 1) {
        console.error(
          `Liquid Ajax Cart: "${ELEMENT_TAG}" element must have one "form" element as a child, ${$innerForms.length} found`,
          $element
        );
        return;
      }

      const $form = $innerForms[0];

      const formActionUrl = new URL($form.action);
      if (formActionUrl.pathname !== `${window.Shopify?.routes?.root || '/'}cart/add`) {
        console.error(
          `Liquid Ajax Cart: "${ELEMENT_TAG}" element's form "action" attribute value isn't a product form action URL`,
          $form,
          $element
        );
        return;
      }

      $form.addEventListener('submit', event => {
        if (!$element.hasAttribute(DATA_ATTR_LOADING)) {
          const formData = new FormData($form);
          $element.setAttribute(DATA_ATTR_LOADING, '');

          cartRequestAdd(formData, {
            lastComplete: () => {
              $element.removeAttribute(DATA_ATTR_LOADING)
            },
            newQueue: true,
            info: {
              "initiator": $element
            }
          })
        }
        event.preventDefault();
      });
    }
  });
}

export {cartProductFormElementInit}