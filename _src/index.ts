import {configureCart, settings} from './settings';
import {
  cartRequestGet,
  cartRequestAdd,
  cartRequestChange,
  cartRequestUpdate,
  cartRequestClear,
} from './ajax-api';
import {getCartState, cartStateInit} from './state';
import {cartDomBinderInit} from './dom-binder';
import {cartSectionsInit} from './sections';
import {cartControlsInit} from './controls';
import {cartMessagesInit} from './messages';
import {cartGlobalClassesInit} from './global-classes';
import {EVENT_PREFIX} from "./const";

if (!('liquidAjaxCart' in window)) {
  // cartSectionsInit should be before cartStateInit because
  // it must subscribe to ajax-api before state
  // so that all state subscribers can work with updated DOM
  cartSectionsInit(); // api subscriber

  cartMessagesInit(); // api subscriber
  cartStateInit(); // api subscriber

  cartDomBinderInit(); // state subscriber
  cartControlsInit(); // state subscriber
  cartGlobalClassesInit(); // state subscriber

  (window as Window).liquidAjaxCart = {
    configureCart,

    cartRequestGet,
    cartRequestAdd,
    cartRequestChange,
    cartRequestUpdate,
    cartRequestClear,

    getCartState // todo: rename
  }

  const event = new CustomEvent(`${EVENT_PREFIX}:init`);
  document.body.dispatchEvent(event);

  (window as Window).addEventListener('focus', () => {
    if (settings.updateOnWindowFocus) {
      cartRequestUpdate({}, {});
    }
  });
}

const export_liquidAjaxCart = window.liquidAjaxCart;
export default export_liquidAjaxCart;