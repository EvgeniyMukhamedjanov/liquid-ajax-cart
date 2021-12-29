import { cartSettingsInit, configureCart, settings } from './settings';
import { cartRequestGet, cartRequestAdd, cartRequestChange, cartRequestUpdate, cartRequestClear, subscribeToCartAjaxRequests } from './ajax-api';
import { getCartState, cartStateInit, subscribeToCartStateUpdate } from './state';
import { cartDomBinderInit } from './dom-binder';
import { cartSectionsInit } from './sections';
import { cartControlsInit } from './controls';
import { cartProductFormsInit } from './product-forms';
import { cartMessagesInit } from './messages';
import { cartGlobalClassesInit } from './global-classes';

if (!( 'liquidAjaxCart' in window )) {
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
	}

	window.addEventListener('focus', () => {
		if ( settings.updateOnWindowFocus ) {
			cartRequestUpdate();
		}
	})
}

const export_configureCart = liquidAjaxCart.configureCart;

const export_cartRequestGet = liquidAjaxCart.cartRequestGet;
const export_cartRequestAdd = liquidAjaxCart.cartRequestAdd;
const export_cartRequestChange = liquidAjaxCart.cartRequestChange;
const export_cartRequestUpdate = liquidAjaxCart.cartRequestUpdate;
const export_cartRequestClear = liquidAjaxCart.cartRequestClear;
const export_subscribeToCartAjaxRequests = liquidAjaxCart.subscribeToCartAjaxRequests;

const export_getCartState = liquidAjaxCart.getCartState;
const export_subscribeToCartStateUpdate = liquidAjaxCart.subscribeToCartStateUpdate;

export { 
	export_configureCart as configureCart,

	export_cartRequestGet as cartRequestGet, 
	export_cartRequestAdd as cartRequestAdd, 
	export_cartRequestChange as cartRequestChange, 
	export_cartRequestUpdate as cartRequestUpdate, 
	export_cartRequestClear as cartRequestClear, 
	export_subscribeToCartAjaxRequests as subscribeToCartAjaxRequests,

	export_getCartState as getCartState,
	export_subscribeToCartStateUpdate as subscribeToCartStateUpdate
}