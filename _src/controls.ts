import {cartProductFormInit} from './controls/product-form';
import {cartRequestButtonInit} from './controls/request-button';
import {cartQuantityInputInit} from './controls/quantity-input';
import {cartPropertyInputInit} from './controls/property-input';
import {cartQuantityElementInit} from './controls/quantity-element';

// import { cartToggleClassButtonInit } from './controls/toggle-class-button';

function cartControlsInit() {
  cartProductFormInit();
  cartRequestButtonInit();
  cartPropertyInputInit();
  cartQuantityInputInit();
  cartQuantityElementInit();
  // cartToggleClassButtonInit();
}

export {cartControlsInit}