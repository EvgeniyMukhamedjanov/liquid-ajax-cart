import { settings } from './settings';
import { cartRequestChange, cartRequestAdd, cartRequestClear, cartRequestUpdate } from './ajax-api';
import { getCartState, subscribeToCartStateUpdate } from './state';

const ACTION_TOGGLE = 'toggle';
const ACTION_ADD = 'add';
const ACTION_REMOVE = 'remove';

const CHANGE_URL = '/cart/change';
const ADD_URL = '/cart/add';
const CLEAR_URL = '/cart/clear';
const UPDATE_URL = '/cart/update';


function initEventListeners() {
	document.addEventListener('click', function(e) {
	    for (var target = e.target; target && target != this; target = target.parentNode) {
	    	requestButtonClickHandler.call(target, e);
			toggleClassButtonClickHandler.call(target, e);
	    }
	}, false);

	document.addEventListener('change', function(e) {
		quantityInputChangeHandler.call(e.target, e);
	}, false);

	document.addEventListener("keydown", function(e) {
		const { quantityInputAttribute } = settings.computed;

		if (e.key === "Enter") {
			quantityInputChangeHandler.call(e.target, e);
		}

		if (e.key === "Escape") {
			quantityInputEscHandler.call(e.target, e);
		}
	}, false);
}

function stateUpdateHandler ( state ) {
	const { quantityInputAttribute } = settings.computed;

	if ( state.status.requestInProgress ) {
		document.querySelectorAll(`[${ quantityInputAttribute }]`).forEach( quantityInput => {
			quantityInput.readOnly = true;
		})
	} else {
		document.querySelectorAll(`[${ quantityInputAttribute }]`).forEach( quantityInput => {
			
			// Update all the inputs from state because some of them might be out of ajax-sections
			if ( state.status.cartStateSet ) {
				const relatedLineItem = state.cart.items.find( lineItem => lineItem.key === quantityInput.getAttribute( quantityInputAttribute ).trim() );
				if (relatedLineItem) {
					quantityInput.value = relatedLineItem.quantity;
				}
			}

			quantityInput.readOnly = false;
		})
	}
}



function requestButtonClickHandler (e) {
	const { requestButtonAttribute } = settings.computed;
	let url = undefined;
	const validURLs = [ CHANGE_URL, ADD_URL, CLEAR_URL, UPDATE_URL ];

	if ( this.hasAttribute( requestButtonAttribute ) ) {
		const attr = this.getAttribute( requestButtonAttribute );
		if ( attr ) {
			let attrURL;
			try {
				attrURL = new URL(attr, window.location.origin);
				if ( validURLs.includes( attrURL.pathname ) ) {
					url = attrURL;
				} else {
					throw `URL should be one of the following: ${CHANGE_URL}, ${ADD_URL}, ${UPDATE_URL}, ${CLEAR_URL}`
				}
			} catch (error) {
				console.error(`Liquid Ajax Cart: ${requestButtonAttribute} contains an invalid URL as a parameter.`, error);
			}
		}
	}

	if ( url === undefined ) {
		if ( this.hasAttribute( 'href' ) && this.tagName.toUpperCase() === 'A' ) {
			const linkURL = new URL(this.href);
			if ( validURLs.includes( linkURL.pathname ) ) {
				url = linkURL;
			} else if ( this.hasAttribute( requestButtonAttribute ) ) {
				console.error(
					`Liquid Ajax Cart: a link with the ${requestButtonAttribute} contains an invalid href URL.`, 
					`URL should be one of the following: ${CHANGE_URL}, ${ADD_URL}, ${UPDATE_URL}, ${CLEAR_URL}`
				);
			}
		}
	}

	if ( url === undefined ) {
		return;
	}

	e.preventDefault();

	const state = getCartState();
	if ( state.status.requestInProgress ) {
		return;
	}

	const formData = new FormData();
	url.searchParams.forEach(( value, key ) => {
		formData.append(key, value);
	});

	switch ( url.pathname ) {
		case ADD_URL:
			cartRequestAdd( formData, { info: { initiator: this }} );
			break;
		case CHANGE_URL:
			cartRequestChange( formData, { info: { initiator: this }} );
			break;
		case UPDATE_URL:
			cartRequestUpdate( formData, { info: { initiator: this }} );
			break;
		case CLEAR_URL:
			cartRequestClear( {}, { info: { initiator: this }});
			break;
	}
}

function toggleClassButtonClickHandler (e) {
	const { toggleClassButtonAttribute } = settings.computed;

	if (!( this.hasAttribute( toggleClassButtonAttribute ) )) {
		return;
	}

	e.preventDefault();
	const parameters = this.getAttribute( toggleClassButtonAttribute ).split( '|' );
	if ( !parameters ) {
		console.error('Liquid Ajax Cart: Error while toggling body class');
		return;
	}

	const cssClass = parameters[0].trim();
	let action = parameters[1] ? parameters[1].trim() : ACTION_TOGGLE;
	if ( action !== ACTION_ADD && action !== ACTION_REMOVE ) {
		action = ACTION_TOGGLE;
	}


	if ( cssClass ) {
		try {
			if ( action === ACTION_ADD ) {
				document.body.classList.add( cssClass );
			} else if ( action === ACTION_REMOVE ) {
				document.body.classList.remove( cssClass );
			} else {
				document.body.classList.toggle( cssClass );
			}
        } catch (e) {
        	console.error('Liquid Ajax Cart: Error while toggling body class:', cssClass)
        	console.error(e);
        }
	}
}

function quantityInputChangeHandler (e) {
	const { quantityInputAttribute } = settings.computed;

	if ( !( this.hasAttribute( quantityInputAttribute )) ) {
		return;
	}

	e.preventDefault(); // prevent form submission

	const state = getCartState();
	if ( state.status.requestInProgress ) {
		return;
	}

	let value = Number( this.value.trim() );
	const itemKey = this.getAttribute( quantityInputAttribute ).trim();

	if ( isNaN( value )) {
		console.error('Liquid Ajax Cart: input value of a data-ajax-cart-quantity-input must be an Integer number');
		return; 
	}

	if ( value < 1 ) { 
		value = 0;
	}

	if ( !itemKey ) {
		console.error('Liquid Ajax Cart: attribute value of a data-ajax-cart-quantity-input must be an item key');
		return;
	}

	const formData = new FormData();
	formData.set('id', itemKey);
	formData.set('quantity', value);

	cartRequestChange( formData, { info: { initiator: this }} );

	this.blur();
}

function quantityInputEscHandler (e) {
	const { quantityInputAttribute } = settings.computed;

	if ( !( this.hasAttribute( quantityInputAttribute )) ) {
		return;
	}

	const quantityInput = this;
	const state = getCartState();

	if ( state.status.cartStateSet ) {
		const relatedLineItem = state.cart.items.find( lineItem => lineItem.key === quantityInput.getAttribute( quantityInputAttribute ).trim() );
		if (relatedLineItem) {
			quantityInput.value = relatedLineItem.quantity;
		}
	}

	this.blur();
}


function init () {
	initEventListeners();
	subscribeToCartStateUpdate( stateUpdateHandler );
}

init();