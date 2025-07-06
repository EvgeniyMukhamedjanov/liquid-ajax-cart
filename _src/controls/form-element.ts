import {
  cartRequestAdd,
  cartRequestChange,
  cartRequestClear,
  cartRequestUpdate,
} from "../ajax-api";
import { CUSTOM_ELEMENT_PREFIX } from "../const";

const ELEMENT_TAG = `${CUSTOM_ELEMENT_PREFIX}-form`;
const DATA_ATTR_LOADING = "processing";

const CHANGE_URL = `${window.Shopify?.routes?.root || "/"}cart/change`;
const ADD_URL = `${window.Shopify?.routes?.root || "/"}cart/add`;
const CLEAR_URL = `${window.Shopify?.routes?.root || "/"}cart/clear`;
const UPDATE_URL = `${window.Shopify?.routes?.root || "/"}cart/update`;

class HTMLAjaxFormElement extends HTMLElement {
  connectedCallback() {
    const $element = this;

    const $innerForms = this.querySelectorAll("form");
    if ($innerForms.length !== 1) {
      console.error(
        `Liquid Ajax Cart: "${ELEMENT_TAG}" element must have one "form" element as a child, ${$innerForms.length} found`,
        $element
      );
      return;
    }

    const $form = $innerForms[0];

    const formActionUrl = new URL($form.action);
    if (
      ![CHANGE_URL, ADD_URL, CLEAR_URL, UPDATE_URL].includes(
        formActionUrl.pathname
      )
    ) {
      console.error(
        `Liquid Ajax Cart: "${ELEMENT_TAG}" element's form "action" attribute value contains an invalid URL`,
        `URL should be one of the following: ${CHANGE_URL}, ${ADD_URL}, ${UPDATE_URL}, ${CLEAR_URL}`,
        $form,
        $element
      );
      return;
    }

    $form.addEventListener("submit", (event) => {
      if (!$element.hasAttribute(DATA_ATTR_LOADING)) {
        const formData = new FormData($form);
        $element.setAttribute(DATA_ATTR_LOADING, "");

        switch (formActionUrl.pathname) {
          case ADD_URL:
            cartRequestAdd(formData, {
              lastCallback: () => {
                $element.removeAttribute(DATA_ATTR_LOADING);
              },
              info: { initiator: $element },
            });
            break;
          case CHANGE_URL:
            cartRequestChange(formData, {
              lastCallback: () => {
                $element.removeAttribute(DATA_ATTR_LOADING);
              },
              info: { initiator: $element },
            });
            break;
          case UPDATE_URL:
            cartRequestUpdate(formData, {
              lastCallback: () => {
                $element.removeAttribute(DATA_ATTR_LOADING);
              },
              info: { initiator: $element },
            });
            break;
          case CLEAR_URL:
            cartRequestClear(
              {},
              {
                lastCallback: () => {
                  $element.removeAttribute(DATA_ATTR_LOADING);
                },
                info: { initiator: $element },
              }
            );
            break;
        }
      }
      event.preventDefault();
    });
  }
}

function cartFormElementInit() {
  customElements.define(ELEMENT_TAG, HTMLAjaxFormElement);
}

export {
  cartFormElementInit,
  HTMLAjaxFormElement,
};
