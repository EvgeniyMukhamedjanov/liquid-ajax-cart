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
import {CartRequestOptionsType, RequestBodyType} from "./ts-types";

let isInit: boolean = false;

function checkInit(key: string) {
  if (!isInit) {
    throw new Error(`Liquid Ajax Cart: the "${key}" method might be used only after initialization`);
  }
}

function readOnlyProp(key: string) {
  throw new Error(`Liquid Ajax Cart: the "${key}" is a read-only property`);
}

if (!('liquidAjaxCart' in window)) {
  class LiquidAjaxCart {

    constructor() {
      this.#init();
    }

    async #init() {
      cartSectionsInit();
      cartMessagesInit();
      await cartStateInit();
      cartDomBinderInit();
      cartControlsInit();
      cartGlobalClassesInit();

      isInit = true;
      const event = new CustomEvent(`${EVENT_PREFIX}:init`);
      document.dispatchEvent(event);

      (window as Window).addEventListener('focus', () => {
        if (settings.updateOnWindowFocus) {
          cartRequestUpdate({}, {});
        }
      });
    }

    conf = configureCart;

    public get(options: CartRequestOptionsType | undefined = {}) {
      checkInit('get');
      return cartRequestGet(options)
    };

    public add(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}) {
      checkInit('add');
      return cartRequestAdd(body, options)
    };

    public change(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}) {
      checkInit('change');
      return cartRequestChange(body, options);
    };

    public update(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}) {
      checkInit('update');
      return cartRequestUpdate(body, options)
    };

    public clear(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}) {
      checkInit('clear');
      return cartRequestClear(body, options)
    };

    get cart() {
      checkInit('cart');
      return getCartState().cart;
    }
    set cart(_) {
      readOnlyProp('cart');
    }

    get previousCart() {
      checkInit('previousCart');
      return getCartState().previousCart;
    }
    set previousCart(_) {
      readOnlyProp('previousCart');
    }

    get processing() {
      checkInit('processing');
      return getProcessingStatus();
    }
    set processing(_) {
      readOnlyProp('processing');
    }

    get init() {
      checkInit('init');
      return isInit;
    }
    set init(_) {
      readOnlyProp('init');
    }
  }

  (window as Window).liquidAjaxCart = new LiquidAjaxCart();

  // cartSectionsInit should be before cartStateInit because
  // it must subscribe to ajax-api before state
  // so that all state subscribers can work with updated DOM
  // cartSectionsInit(); // api subscriber
  //
  // cartMessagesInit(); // api subscriber
  // cartStateInit(); // api subscriber
  //
  // cartDomBinderInit(); // state subscriber
  // cartControlsInit(); // state subscriber
  // cartGlobalClassesInit(); // state subscriber

  // const event = new CustomEvent(`${EVENT_PREFIX}:init`);
  // document.body.dispatchEvent(event);
  //
  // (window as Window).addEventListener('focus', () => {
  //   if (settings.updateOnWindowFocus) {
  //     cartRequestUpdate({}, {});
  //   }
  // });
}


const export_liquidAjaxCart = window.liquidAjaxCart;
export default export_liquidAjaxCart;