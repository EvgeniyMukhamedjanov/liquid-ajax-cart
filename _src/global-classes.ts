import {AppStateType, EventStateType} from './ts-types';

import {EVENT_STATE, getCartState} from './state';
import {CSS_CLASS_PREFIX} from "./const";

const CSS_CLASS_SET = `${CSS_CLASS_PREFIX}-set`;
const CSS_CLASS_IN_PROGRESS = `${CSS_CLASS_PREFIX}-in-progress`;
const CSS_CLASS_EMPTY = `${CSS_CLASS_PREFIX}-empty`;
const CSS_CLASS_NOT_EMPTY = `${CSS_CLASS_PREFIX}-not-empty`;

function updateClasses(state: AppStateType): void {
  const $element = document.querySelector('html');
  $element.classList.toggle(CSS_CLASS_SET, state.status.cartStateSet);
  $element.classList.toggle(CSS_CLASS_IN_PROGRESS, state.status.requestInProgress);
  $element.classList.toggle(CSS_CLASS_EMPTY, state.status.cartStateSet && state.cart.item_count === 0);
  $element.classList.toggle(CSS_CLASS_NOT_EMPTY, state.status.cartStateSet && state.cart.item_count > 0);
}

const cartGlobalClassesInit = () => {
  document.addEventListener(EVENT_STATE, (event: EventStateType) => {
    updateClasses(event.detail.state);
  })
  updateClasses(getCartState());
}

export {cartGlobalClassesInit}