import { cartSettingsInit, configureCart, settings } from './settings';
import { cartRequestGet, cartRequestAdd, cartRequestChange, cartRequestUpdate, cartRequestClear, subscribeToCartAjaxRequests } from './ajax-api';
import { getCartState, cartStateInit, subscribeToCartStateUpdate } from './state';
import { cartDomBinderInit } from './dom-binder';
import { cartSectionsInit, subscribeToCartSectionsUpdate } from './sections';
import { cartControlsInit } from './controls';
import { cartProductFormsInit } from './product-forms';
import { cartMessagesInit } from './messages';
import { cartGlobalClassesInit } from './global-classes';

function isCompatible() {
	try {

		if (!('fetch' in window)) return false;
		if (!('Promise' in window)) return false;
		if (!('FormData' in window)) return false;
		if (!('WeakMap' in window)) return false;
		if (!('DOMParser' in window)) return false;
		const obj = { foo: `bar${ 'bar' }` }
		let { foo } = obj;
		if (foo !== 'barbar') return false;

		const weakMap = new WeakMap();
		weakMap.set(obj, 'foo');
		foo = weakMap.get(obj);
		if (!foo) return false;

		const formData = new FormData();
		formData.set('foo', 'bar');
		foo = formData.get('foo').toString();
		if (!foo) return false;

		return true;
	} catch(error) {
		console.error(error);
		return false;
	}
}

if (!( 'liquidAjaxCart' in window )) {
	
	if (isCompatible()) {
	
		cartSettingsInit();
		cartProductFormsInit();

		// should be before cartStateInit because 
		// it must subscribe to ajax-api before state 
		// so that all state subscribers can work with updated DOM
		cartSectionsInit();

		cartStateInit();
		cartDomBinderInit(); // state subscriber
		cartControlsInit(); // state subscriber
		cartGlobalClassesInit(); // state subscriber

		// API subscriber but must be after cartStateInit because it uses state
		// to calculate if there is an error
		cartMessagesInit(); 

		window.liquidAjaxCart = {
			configureCart,

			cartRequestGet, 
			cartRequestAdd, 
			cartRequestChange, 
			cartRequestUpdate, 
			cartRequestClear, 
			subscribeToCartAjaxRequests,

			getCartState,
			subscribeToCartStateUpdate,

			subscribeToCartSectionsUpdate
		}

		window.addEventListener('focus', () => {
			if ( settings.updateOnWindowFocus ) {
				cartRequestUpdate({}, {});
			}
		});
	} else {
		console.warn('Liquid Ajax Cart is not supported by this browser');
		document.body.className += ' js-ajax-cart-not-compatible';
		window.liquidAjaxCart = {
			configureCart: function() {},

			cartRequestGet: function() {}, 
			cartRequestAdd: function() {}, 
			cartRequestChange: function() {}, 
			cartRequestUpdate: function() {}, 
			cartRequestClear: function() {}, 
			subscribeToCartAjaxRequests: function() {},

			getCartState,
			subscribeToCartStateUpdate: function() {},

			subscribeToCartSectionsUpdate: function() {}
		}
	}
}

const export_configureCart = window.liquidAjaxCart.configureCart;

const export_cartRequestGet = window.liquidAjaxCart.cartRequestGet;
const export_cartRequestAdd = window.liquidAjaxCart.cartRequestAdd;
const export_cartRequestChange = window.liquidAjaxCart.cartRequestChange;
const export_cartRequestUpdate = window.liquidAjaxCart.cartRequestUpdate;
const export_cartRequestClear = window.liquidAjaxCart.cartRequestClear;
const export_subscribeToCartAjaxRequests = window.liquidAjaxCart.subscribeToCartAjaxRequests;

const export_getCartState = window.liquidAjaxCart.getCartState;
const export_subscribeToCartStateUpdate = window.liquidAjaxCart.subscribeToCartStateUpdate;

const export_subscribeToCartSectionsUpdate = window.liquidAjaxCart.subscribeToCartSectionsUpdate;

export { 
	export_configureCart as configureCart,

	export_cartRequestGet as cartRequestGet, 
	export_cartRequestAdd as cartRequestAdd, 
	export_cartRequestChange as cartRequestChange, 
	export_cartRequestUpdate as cartRequestUpdate, 
	export_cartRequestClear as cartRequestClear, 
	export_subscribeToCartAjaxRequests as subscribeToCartAjaxRequests,

	export_getCartState as getCartState,
	export_subscribeToCartStateUpdate as subscribeToCartStateUpdate,

	export_subscribeToCartSectionsUpdate as subscribeToCartSectionsUpdate
}