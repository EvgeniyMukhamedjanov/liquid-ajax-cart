import { settings } from './../settings';
import { cartRequestChange } from './../ajax-api';
import { getCartState, subscribeToCartStateUpdate } from './../state';
import { findLineItemByCode } from './../helpers';

function initEventListeners() {
	document.addEventListener('change', function(e) {
		changeHandler(e.target, e);
	}, false);

	document.addEventListener("keydown", function(e) {
		if (e.key === "Enter") {
			changeHandler(e.target, e);
		}

		if (e.key === "Escape") {
			escHandler(e.target);
		}
	}, false);
}

function stateHandler ( state ) {
	const { quantityInputAttribute } = settings.computed;

	if ( state.status.requestInProgress ) {
		document.querySelectorAll(`[${ quantityInputAttribute }]`).forEach( input => {
			input.readOnly = true;
		})
	} else {
		document.querySelectorAll(`[${ quantityInputAttribute }]`).forEach( input => {
			
			const lineItemCode = input.getAttribute( quantityInputAttribute ).trim();
			const [ lineItem ] = findLineItemByCode(lineItemCode, state);
			if(lineItem) {
				input.value = lineItem.quantity;
			} else if(lineItem === null) {
				input.value = 0;
			}


			input.readOnly = false;
		})
	}
}

function changeHandler (htmlNode, e) {
	const { quantityInputAttribute } = settings.computed;

	if ( !( htmlNode.hasAttribute( quantityInputAttribute )) ) {
		return;
	}

	if (e) {
		e.preventDefault(); // prevent form submission
	}

	const state = getCartState();
	if ( state.status.requestInProgress ) {
		return;
	}

	let value = Number( htmlNode.value.trim() );
	const lineItem = htmlNode.getAttribute( quantityInputAttribute ).trim();

	if ( isNaN( value )) {
		console.error('Liquid Ajax Cart: input value of a data-ajax-cart-quantity-input must be an Integer number');
		return; 
	}

	if ( value < 1 ) { 
		value = 0;
	}

	if ( !lineItem ) {
		console.error('Liquid Ajax Cart: attribute value of a data-ajax-cart-quantity-input must be an item key or an item index');
		return;
	}

	const lineItemReqProperty = lineItem.length > 3 ? 'id' : 'line';

	const formData = new FormData();
	formData.set(lineItemReqProperty, lineItem);
	formData.set('quantity', value);

	cartRequestChange( formData, { info: { initiator: this }} );

	htmlNode.blur();
}

function escHandler (htmlNode) {
	const { quantityInputAttribute } = settings.computed;

	if ( !( htmlNode.hasAttribute( quantityInputAttribute )) ) {
		return;
	}

	const attributeValue = htmlNode.getAttribute( quantityInputAttribute ).trim();
	let relatedLineItem;
	const state = getCartState();

	if ( state.status.cartStateSet ) {
		if ( attributeValue.length > 3 ) {
			relatedLineItem = state.cart.items.find( lineItem => lineItem.key === attributeValue );
		} else {
			const lineItemIndex = Number(attributeValue) - 1;
			relatedLineItem = state.cart.items[lineItemIndex];
		}
		if (relatedLineItem) {
			htmlNode.value = relatedLineItem.quantity;
		}
	}

	htmlNode.blur();
}

function cartQuantityInputInit () {
	initEventListeners();
	subscribeToCartStateUpdate( stateHandler );
}

export { cartQuantityInputInit }