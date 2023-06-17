import {AppStateType, EventStateType} from '../ts-types';

import { settings } from '../settings';
import { cartRequestChange } from '../ajax-api';
import {EVENT_STATE, getCartState/*, subscribeToCartStateUpdate*/} from '../state';
import { findLineItemByCode } from '../helpers';

function initEventListeners() {
	document.addEventListener('change', function(e) {
		changeHandler((e.target as Element), e);
	}, false);

	document.addEventListener("keydown", function(e) {
		if (e.key === "Enter") {
			changeHandler((e.target as Element), e);
		}

		if (e.key === "Escape") {
			escHandler((e.target as Element));
		}
	}, false);
}

function isValidElement(element: Element): boolean {
	const { quantityInputAttribute } = settings.computed;

	if ( !(element.hasAttribute(quantityInputAttribute)) ) {
		return false;
	}

	if( !(element instanceof HTMLInputElement) || ( element.type !== 'text' && element.type !== 'number' )) {
		console.error(`Liquid Ajax Cart: the ${ quantityInputAttribute } attribute supports "input" elements only with the "text" and the "number" types`);
		return false;
	}

	return true;
}

function stateHandler ( state: AppStateType ) {
	const { quantityInputAttribute } = settings.computed;

	if ( state.status.requestInProgress ) {
		document.querySelectorAll(`input[${ quantityInputAttribute }]`).forEach(( input: HTMLInputElement) => {
			if( isValidElement(input) ) {
				input.disabled = true;
			}
		})
	} else {
		document.querySelectorAll(`input[${ quantityInputAttribute }]`).forEach(( input: HTMLInputElement ) => {
			if( !isValidElement(input) ) {
				return;
			}

			const lineItemCode = input.getAttribute( quantityInputAttribute ).trim();
			const [ lineItem ] = findLineItemByCode(lineItemCode, state);
			if(lineItem) {
				input.value = lineItem.quantity.toString();
			} else if(lineItem === null) {
				input.value = "0";
			}

			input.disabled = false;
		})
	}
}

function changeHandler (element: Element, e: Event) {
	const { quantityInputAttribute } = settings.computed;

	if( !isValidElement(element) ) {
		return;
	}

	if (e) {
		e.preventDefault(); // prevent form submission
	}

	const state = getCartState();
	if ( state.status.requestInProgress ) {
		return;
	}

	let value = Number( (element as HTMLInputElement).value.trim() );
	const lineItem = element.getAttribute( quantityInputAttribute ).trim();

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
	formData.set('quantity', value.toString());

	cartRequestChange( formData, { newQueue: true, info: { initiator: element }} );

	(element as HTMLInputElement).blur();
}

function escHandler (element: Element) {
	const { quantityInputAttribute } = settings.computed;

	if( !isValidElement(element) ) {
		return;
	}

	const attributeValue = element.getAttribute( quantityInputAttribute ).trim();
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
			(element as HTMLInputElement).value = relatedLineItem.quantity.toString();
		}
	}

	(element as HTMLInputElement).blur();
}

function cartQuantityInputInit () {
	initEventListeners();
	// subscribeToCartStateUpdate( stateHandler );
	document.addEventListener(EVENT_STATE, (event: EventStateType) => {
		stateHandler(event.detail.state);
	})
	stateHandler( getCartState() );
}

export { cartQuantityInputInit }