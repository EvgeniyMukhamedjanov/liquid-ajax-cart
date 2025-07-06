import { CUSTOM_ELEMENT_PREFIX } from "./const";

import { cartFormElementInit } from "./controls/form-element";
import { cartRequestButtonInit } from "./controls/request-button";
import { cartQuantityInputInit } from "./controls/quantity-input";
import { cartPropertyInputInit } from "./controls/property-input";
import { cartQuantityElementInit } from "./controls/quantity-element";

function cartControlsInit() {
  cartFormElementInit();
  cartRequestButtonInit();
  cartPropertyInputInit();
  cartQuantityInputInit();
  cartQuantityElementInit();

  customElements.define(
    `${CUSTOM_ELEMENT_PREFIX}-product-form`,
    class extends HTMLElement {
      constructor() {
        super();
        console.error(
          `Liquid Ajax Cart: The <${CUSTOM_ELEMENT_PREFIX}-product-form> element is deprecated. Use <${CUSTOM_ELEMENT_PREFIX}-form> instead.`
        );
      }
    }
  );
}

export { cartControlsInit };
