import {configureCart, settings} from './settings';
import {
  cartRequestGet,
  cartRequestAdd,
  cartRequestChange,
  cartRequestUpdate,
  cartRequestClear,
  getProcessingStatus
} from './ajax-api';
import {getCartState, cartStateInit} from './state';
import {cartDomBinderInit} from './dom-binder';
import {cartSectionsInit} from './sections';
import {cartControlsInit} from './controls';
import {cartMessagesInit} from './messages';
import {cartGlobalClassesInit} from './global-classes';
import {EVENT_PREFIX} from "./const";

let isInit: boolean = false;

if (!('liquidAjaxCart' in window)) {
  (window as Window).liquidAjaxCart = {
    conf: configureCart,
  }

  function addReadOnlyProp(key: string, fn: () => {}) {
    Object.defineProperty((window as Window).liquidAjaxCart, key, {
      get: fn,
      set: () => {
        throw new Error(`Liquid Ajax Cart: the "${key}" is a read-only property`);
      },
      enumerable: true
    })
  }

  addReadOnlyProp('init', () => isInit);

  cartSectionsInit();
  cartMessagesInit();
  cartStateInit().then(() => {
    cartDomBinderInit();
    cartControlsInit();
    cartGlobalClassesInit();
    (window as Window).liquidAjaxCart.get = cartRequestGet;
    (window as Window).liquidAjaxCart.add = cartRequestAdd;
    (window as Window).liquidAjaxCart.change = cartRequestChange;
    (window as Window).liquidAjaxCart.update = cartRequestUpdate;
    (window as Window).liquidAjaxCart.clear = cartRequestClear;
    addReadOnlyProp('cart', () => getCartState().cart);
    addReadOnlyProp('processing', getProcessingStatus);

    (window as Window).addEventListener('focus', () => {
      if (settings.updateOnWindowFocus) {
        cartRequestUpdate({}, {});
      }
    });

    isInit = true;

    const event = new CustomEvent(`${EVENT_PREFIX}:init`);
    document.dispatchEvent(event);

  });
}