import { AppStateType } from './ts-types';

import { settings } from './settings';
import { getCartState, subscribeToCartStateUpdate } from './state';
import { subscribeToCartAjaxRequests } from './ajax-api';

function updateClasses( state: AppStateType ): void {
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

let timer: ReturnType<typeof setTimeout> | undefined = undefined;
function addToCartCssClassInit() {
	subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {
	  if ( requestState.requestType === 'add' ) {
	    subscribeToResult( requestState => {
	      if ( requestState.responseData?.ok ) {
	      	const { addToCartCssClass } = settings;
	      	let cssClass = '';
	      	let duration = 0;
	      	if ( typeof addToCartCssClass === 'string' || addToCartCssClass instanceof String ) {
	      		cssClass = <string>addToCartCssClass;
	      	} else if ( Array.isArray(addToCartCssClass) && addToCartCssClass.length === 2 &&
	      		(typeof addToCartCssClass[0] === 'string' || (addToCartCssClass[0] as object) instanceof String) && 
	      		(typeof addToCartCssClass[1] === 'number' || (addToCartCssClass[1] as object) instanceof Number)) {
	      		cssClass = addToCartCssClass[0];
	      		if ( addToCartCssClass[1] > 0 ) {
	      			duration = addToCartCssClass[1];
	      		} else {
	      			console.error(`Liquid Ajax Cart: the addToCartCssClass[1] value must be a positive integer. Now it is ${ addToCartCssClass[1] }`);
	      		}
	      	} else {
	      		console.error(`Liquid Ajax Cart: the "addToCartCssClass" configuration parameter must be a string or a [string, number] array`);
	      	}

	      	if (cssClass !== '') {
	      		try {
	      			document.body.classList.add( cssClass );
	      		} catch(e) {
	      			console.error(`Liquid Ajax Cart: error while adding the "${ cssClass }" CSS class from the addToCartCssClass parameter to the body tag`);
	      			console.error(e);
	      		}

	      		if ( duration > 0 ) {
	      			if ( timer !== undefined ) {
	      				clearTimeout( timer );
	      			}
	      			timer = setTimeout(() => {
	      				document.body.classList.remove( cssClass );
	      			}, duration)
	      		}
	      	}
	      }
	    });
	  }
	});
}

const cartGlobalClassesInit = () => {
	subscribeToCartStateUpdate( updateClasses );
	updateClasses( getCartState() );
	addToCartCssClassInit();
}

export { cartGlobalClassesInit }