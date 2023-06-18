import {
  AppStateType,
  AppStateCartType,
  AppStateStatusType,
  RequestStateType,
  JSONObjectType,
  JSONValueType,
  LineItemType,
  EventQueuesType,
  EventRequestType,
  EventStateType
} from './ts-types';

import {
  cartRequestGet,
  cartRequestUpdate,
  REQUEST_ADD,
  EVENT_QUEUES,
  EVENT_REQUEST
} from './ajax-api';
import {DATA_ATTR_PREFIX, EVENT_PREFIX} from "./const";

const EVENT_STATE = `${EVENT_PREFIX}:state`;
const DATA_ATTR_INITIAL_STATE = `${DATA_ATTR_PREFIX}-initial-state`;

let cart: AppStateCartType = null;
let previousCart: AppStateCartType | undefined = undefined
let status: AppStateStatusType = {
  requestInProgress: false,
  cartStateSet: false,
};

function cartStateInit() {
  document.addEventListener(EVENT_QUEUES, (event: EventQueuesType) => {
    status.requestInProgress = event.detail.inProgress;
    notify(false);
  });

  document.addEventListener(EVENT_REQUEST, (event: EventRequestType) => {
    const {onResult} = event.detail;
    onResult((requestState: RequestStateType) => {
      let newCart: AppStateCartType | undefined = undefined;
      if (requestState.extraResponseData?.ok) {
        newCart = cartStateFromObject(requestState.extraResponseData.body);
      }

      if (!newCart && requestState.responseData?.ok) {
        if (requestState.requestType === REQUEST_ADD) {
          cartRequestUpdate();
        } else {
          newCart = cartStateFromObject(requestState.responseData.body);
        }
      }
      if (newCart) {
        previousCart = cart;
        cart = newCart;
        status.cartStateSet = true;
        notify(true);
      } else if (newCart === null) {
        console.error(`Liquid Ajax Cart: expected to receive the updated cart state but the object is not recognized. The request state:`, requestState);
      }
    })
  });

  const initialStateContainer = document.querySelector(`[${DATA_ATTR_INITIAL_STATE}]`);
  if (initialStateContainer) {
    try {
      const initialState = JSON.parse(initialStateContainer.textContent);
      cart = cartStateFromObject(initialState);
      if (cart === null) {
        throw `JSON from ${DATA_ATTR_INITIAL_STATE} script is not correct cart object`;
      } else {
        status.cartStateSet = true;
        notify(true);
      }
    } catch (e) {
      console.error(`Liquid Ajax Cart: can't parse cart JSON from the "${DATA_ATTR_INITIAL_STATE}" script. A /cart.js request will be performed to receive the cart state`);
      console.error(e);
      cartRequestGet();
    }
  } else {
    cartRequestGet();
  }
}

function cartStateFromObject(data: JSONObjectType): AppStateCartType {
  const {attributes, items, item_count} = data;
  if (attributes === undefined || attributes === null || typeof attributes !== 'object') {
    return null;
  }

  if (typeof item_count !== 'number' && !(item_count instanceof Number)) {
    return null;
  }

  if (!Array.isArray(items)) {
    return null;
  }
  const newItems: LineItemType[] = [];
  for (let i = 0; i < (items as JSONValueType[]).length; i++) {
    const item = items[i] as ({ [key: string]: JSONValueType });
    if (typeof item.id !== 'number' && !(item.id instanceof Number)) {
      return null;
    }
    if (typeof item.key !== 'string' && !(item.key instanceof String)) {
      return null;
    }
    if (typeof item.quantity !== 'number' && !(item.quantity instanceof Number)) {
      return null;
    }
    if (!('properties' in item)) {
      return null;
    }
    newItems.push({
      ...item,
      id: (item.id as number),
      key: (item.key as string),
      quantity: (item.quantity as number),
      properties: (item.properties as ({ [key: string]: JSONValueType }))
    });
  }

  return {
    ...data,
    attributes: (attributes as ({ [key: string]: JSONValueType })),
    items: newItems,
    item_count: (item_count as number)
  }
}

function getCartState(): AppStateType {
  return {
    cart,
    status,
    previousCart
  }
}

const notify = (isCartUpdated: boolean) => {
  const event: EventStateType = new CustomEvent(EVENT_STATE, {
    detail: {
      state: getCartState(),
      isCartUpdated
    }
  });
  document.dispatchEvent(event)
}

export {cartStateInit, getCartState, EVENT_STATE};