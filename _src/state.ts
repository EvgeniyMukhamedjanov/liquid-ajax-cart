import {
  AppStateType,
  AppStateCartType,
  EventRequestEndType
} from './ts-types';

import {
  EVENT_REQUEST_END,
} from './ajax-api';
import {DATA_ATTR_PREFIX} from "./const";

const DATA_ATTR_INITIAL_STATE = `${DATA_ATTR_PREFIX}-initial-state`;

let cart: AppStateCartType = null;
let previousCart: AppStateCartType | undefined = undefined

function cartStateInit(): Promise<void> {

  document.addEventListener(EVENT_REQUEST_END, (event: EventRequestEndType) => {
    event.detail.cartUpdated = false;
    const {requestState} = event.detail;
    let newCart: AppStateCartType;
    if (requestState.extraResponseData?.ok && requestState.extraResponseData.body.token) {
      newCart = requestState.extraResponseData.body as AppStateCartType;
    } else if (requestState.responseData?.ok && requestState.responseData.body.token) {
      newCart = requestState.responseData.body as AppStateCartType;
    }

    if (newCart) {
      previousCart = cart;
      cart = newCart;
      event.detail.cartUpdated = true;
    }
  });

  const initialStateContainer = document.querySelector(`[${DATA_ATTR_INITIAL_STATE}]`);
  if (initialStateContainer) {
    try {
      cart = JSON.parse(initialStateContainer.textContent);
    } catch (e) {
      console.error(`Liquid Ajax Cart: can't parse cart JSON from the "${DATA_ATTR_INITIAL_STATE}" script`);
      console.error(e);
    }
  }

  return new Promise((resolve, reject) => {
    if (cart) {
      resolve();
      return;
    }
    fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      cart = data;
      resolve();
    }).catch(error => {
      console.error(error);
      reject('Can\'t load the cart state from the "/cart.js" endpoint');
    })
  })
}

function getCartState(): AppStateType {
  return {
    cart,
    previousCart
  }
}

export {cartStateInit, getCartState};