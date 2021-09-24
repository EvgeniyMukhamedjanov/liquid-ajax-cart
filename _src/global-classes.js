import { settings } from './settings';
import { getCartState, subscribeToCartStateUpdate } from './state';

subscribeToCartStateUpdate( state => {
	const { 
		cartStateSetBodyClass, 
		requestInProgressBodyClass,
		emptyCartBodyClass
	} = settings;

	if ( cartStateSetBodyClass ) {
		if ( state.status.cartStateSet ) {
			document.body.classList.add( cartStateSetBodyClass );
		} else {
			document.body.classList.remove( cartStateSetBodyClass );
		}
	}

	if ( requestInProgressBodyClass ) {
		if ( state.status.requestInProgress ) {
			document.body.classList.add( requestInProgressBodyClass );
		} else {
			document.body.classList.remove( requestInProgressBodyClass );
		}
	}

	if ( emptyCartBodyClass ) {
		if ( state.status.cartStateSet && state.cart.item_count === 0 ) {
			document.body.classList.add( emptyCartBodyClass );
		} else {
			document.body.classList.remove( emptyCartBodyClass );
		}
	}
});