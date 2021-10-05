import { settings } from './settings';
import { getCartState, subscribeToCartStateUpdate } from './state';

const updateClasses = state => {
	const { 
		cartStateSetBodyClass, 
		requestInProgressBodyClass,
		emptyCartBodyClass,
		notEmptyCartBodyClass
	} = settings.computed;

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

	if ( notEmptyCartBodyClass ) {
		if ( state.status.cartStateSet && state.cart.item_count === 0 ) {
			document.body.classList.remove( notEmptyCartBodyClass );
		} else {
			document.body.classList.add( notEmptyCartBodyClass );
		}
	}
}

const init = () => {
	subscribeToCartStateUpdate( updateClasses );
	updateClasses( getCartState() );
}
init();