import {AppStateType, EventStateType} from '../ts-types';

import {cartRequestChange} from '../ajax-api';
import {EVENT_STATE, getCartState/*, subscribeToCartStateUpdate*/} from '../state';
import {findLineItemByCode} from '../helpers';
import {DATA_ATTR_PREFIX} from "../const";

const DATA_ATTR_QUANTITY_INPUT = `${DATA_ATTR_PREFIX}-quantity-input`

function initEventListeners() {
  document.addEventListener('change', function (e) {
    changeHandler((e.target as Element), e);
  }, false);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      changeHandler((e.target as Element), e);
    }

    if (e.key === "Escape") {
      escHandler((e.target as Element));
    }
  }, false);
}

function isValidElement(element: Element): boolean {
  // const {quantityInputAttribute} = settings.computed;

  if (!(element.hasAttribute(DATA_ATTR_QUANTITY_INPUT))) {
    return false;
  }

  if (!(element instanceof HTMLInputElement) || (element.type !== 'text' && element.type !== 'number')) {
    console.error(`Liquid Ajax Cart: the ${DATA_ATTR_QUANTITY_INPUT} attribute supports "input" elements only with the "text" and the "number" types`);
    return false;
  }

  return true;
}

function stateHandler(state: AppStateType) {
  // const {quantityInputAttribute} = settings.computed;

  if (state.status.requestInProgress) {
    document.querySelectorAll(`input[${DATA_ATTR_QUANTITY_INPUT}]`).forEach((input: HTMLInputElement) => {
      if (isValidElement(input)) {
        input.disabled = true;
      }
    })
  } else {
    document.querySelectorAll(`input[${DATA_ATTR_QUANTITY_INPUT}]`).forEach((input: HTMLInputElement) => {
      if (!isValidElement(input)) {
        return;
      }

      const lineItemCode = input.getAttribute(DATA_ATTR_QUANTITY_INPUT).trim();
      const [lineItem] = findLineItemByCode(lineItemCode, state);
      if (lineItem) {
        input.value = lineItem.quantity.toString();
      } else if (lineItem === null) {
        input.value = "0";
      }

      input.disabled = false;
    })
  }
}

function changeHandler(element: Element, e: Event) {
  // const {quantityInputAttribute} = settings.computed;

  if (!isValidElement(element)) {
    return;
  }

  if (e) {
    e.preventDefault(); // prevent form submission
  }

  const state = getCartState();
  if (state.status.requestInProgress) {
    return;
  }

  let value = Number((element as HTMLInputElement).value.trim());
  const lineItem = element.getAttribute(DATA_ATTR_QUANTITY_INPUT).trim();

  if (isNaN(value)) {
    console.error(`Liquid Ajax Cart: input value of a ${DATA_ATTR_QUANTITY_INPUT} must be an Integer number`);
    return;
  }

  if (value < 1) {
    value = 0;
  }

  if (!lineItem) {
    console.error(`Liquid Ajax Cart: attribute value of a ${DATA_ATTR_QUANTITY_INPUT} must be an item key or an item index`);
    return;
  }

  const lineItemReqProperty = lineItem.length > 3 ? 'id' : 'line';

  const formData = new FormData();
  formData.set(lineItemReqProperty, lineItem);
  formData.set('quantity', value.toString());

  cartRequestChange(formData, {newQueue: true, info: {initiator: element}});

  (element as HTMLInputElement).blur();
}

function escHandler(element: Element) {
  // const {quantityInputAttribute} = settings.computed;

  if (!isValidElement(element)) {
    return;
  }

  const attributeValue = element.getAttribute(DATA_ATTR_QUANTITY_INPUT).trim();
  let relatedLineItem;
  const state = getCartState();

  if (state.status.cartStateSet) {
    if (attributeValue.length > 3) {
      relatedLineItem = state.cart.items.find(lineItem => lineItem.key === attributeValue);
    } else {
      const lineItemIndex = Number(attributeValue) - 1;
      relatedLineItem = state.cart.items[lineItemIndex];
    }
    if (relatedLineItem) {
      (element as HTMLInputElement).value = relatedLineItem.quantity.toString();
    }
  }

  (element as HTMLInputElement).blur();
}

function cartQuantityInputInit() {
  initEventListeners();
  // subscribeToCartStateUpdate( stateHandler );
  document.addEventListener(EVENT_STATE, (event: EventStateType) => {
    stateHandler(event.detail.state);
  })
  stateHandler(getCartState());
}

export {cartQuantityInputInit, DATA_ATTR_QUANTITY_INPUT}