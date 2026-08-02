// src/quantity/index.ts
// Side-effect init: register the stepper element and start the input binding.
import { initInputBinding } from "./quantity-input";
import { initQuantityElement } from "./quantity-element";

initInputBinding();
initQuantityElement();
