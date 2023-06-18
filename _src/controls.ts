import {cartProductFormElementInit} from './controls/product-form-element';
import {cartRequestButtonInit} from './controls/request-button';
import {cartQuantityInputInit} from './controls/quantity-input';
import {cartPropertyInputInit} from './controls/property-input';
import {cartQuantityElementInit} from './controls/quantity-element';

function cartControlsInit() {
  cartProductFormElementInit();
  cartRequestButtonInit();
  cartPropertyInputInit();
  cartQuantityInputInit();
  cartQuantityElementInit();
}

export {cartControlsInit}