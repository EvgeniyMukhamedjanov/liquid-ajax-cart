import {getCartState} from './state';
import {EVENT_QUEUE_END, EVENT_QUEUE_START, EVENT_REQUEST_END, getProcessingStatus} from "./ajax-api";
import {CSS_CLASS_PREFIX} from "./const";

const CSS_CLASS_INIT = `${CSS_CLASS_PREFIX}-init`;
const CSS_CLASS_IN_PROGRESS = `${CSS_CLASS_PREFIX}-processing`;
const CSS_CLASS_EMPTY = `${CSS_CLASS_PREFIX}-empty`;
const CSS_CLASS_NOT_EMPTY = `${CSS_CLASS_PREFIX}-not-empty`;

function updateClasses(): void {
  const $element = document.querySelector('html');
  const state = getCartState();
  $element.classList.toggle(CSS_CLASS_INIT, state.cart !== null);
  $element.classList.toggle(CSS_CLASS_IN_PROGRESS, getProcessingStatus());
  $element.classList.toggle(CSS_CLASS_EMPTY, state.cart.item_count === 0);
  $element.classList.toggle(CSS_CLASS_NOT_EMPTY, state.cart.item_count > 0);
}

const cartGlobalClassesInit = () => {
  document.addEventListener(EVENT_QUEUE_START, updateClasses);
  document.addEventListener(EVENT_REQUEST_END, updateClasses);
  document.addEventListener(EVENT_QUEUE_END, updateClasses);
  updateClasses();
}

export {cartGlobalClassesInit}