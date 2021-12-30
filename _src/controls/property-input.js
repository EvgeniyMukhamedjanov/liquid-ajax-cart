import { settings } from './../settings';
import { cartRequestChange } from './../ajax-api';
import { getCartState, subscribeToCartStateUpdate } from './../state';
import { findLineItemByCode } from './../helpers';

const disablingElementTypes = ['checkbox', 'radio'];

function splitPropertyAttribute(attributeValue) {
	const { propertyInputAttribute } = settings.computed;

	let [objectCode, ...propertyName] = attributeValue.split(' ');
	objectCode = objectCode.trim();
	propertyName = propertyName || [];
	propertyName = propertyName.join(' ');
	if (!objectCode || !propertyName) {
		console.error(`Liquid Ajax Cart: ${ propertyInputAttribute } attribute must contain two parameters separated by the space symbol. The current value is "${ attributeValue }".`);
	}
	return [ objectCode, propertyName ];
}

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
	const { propertyInputAttribute } = settings.computed;

	if ( state.status.requestInProgress ) {
		document.querySelectorAll(`[${ propertyInputAttribute }]`).forEach( element => {
			element.readOnly = true;
			const elementType = element.getAttribute('type').toLowerCase();
			if(disablingElementTypes.includes(elementType)) {
				element.disabled = true;
			}
		})
	} else {
		document.querySelectorAll(`[${ propertyInputAttribute }]`).forEach( element => {
			const attributeValue = element.getAttribute( propertyInputAttribute );
			const [ objectCode, propertyName ] = splitPropertyAttribute(attributeValue);
			
			if(!(objectCode && propertyName)) {
				return;
			}

			const [ lineItem ] = findLineItemByCode(objectCode, state);
			
			if(lineItem) {
				const elementType = element.getAttribute('type').toLowerCase();
				if(elementType === 'checkbox' || elementType === 'radio') {
					if(element.value === lineItem.properties[propertyName]) {
						element.checked = true;
					} else {
						element.checked = false;
					}
				} else {
					element.value = lineItem.properties[propertyName];
				}
				element.readOnly = false;
				if(disablingElementTypes.includes(elementType)) {
					element.disabled = false;
				}
				return;
			}

			if(lineItem === null) {
				element.value = '';
			}
		})
	}
}

function changeHandler (htmlNode, e) {
	const { propertyInputAttribute } = settings.computed;

	if ( !( htmlNode.hasAttribute( propertyInputAttribute )) ) {
		return;
	}

	if(e) {
		e.preventDefault(); // prevent form submission
	}

	htmlNode.blur();

	const state = getCartState();
	if (!(state.status.cartStateSet)) {
		return;
	}
	if ( state.status.requestInProgress ) {
		return;
	}

	const attributeValue = htmlNode.getAttribute( propertyInputAttribute );
	const [ objectCode, propertyName ] = splitPropertyAttribute(attributeValue);
	if(!objectCode || !propertyName) {
		return;
	}

	const [ lineItem, objectCodeType ] = findLineItemByCode(objectCode, state);

	if (lineItem === null) {
		console.error(`Liquid Ajax Cart: line item was not found when the ${propertyInputAttribute}="${attributeValue}" element tried to update the cart`);
	}

	if(!lineItem) {
		return
	}
		
	const newProperties = {
		...lineItem.properties
	}

	const htmlNodeType = htmlNode.getAttribute('type').toLowerCase();
	if(htmlNodeType === 'checkbox' && !htmlNode.checked) {
		newProperties[propertyName] = '';
	} else {
		newProperties[propertyName] = htmlNode.value;
	}

	const formData = new FormData();
	formData.set(objectCodeType, objectCode);
	formData.set('quantity', lineItem.quantity);
	for( let p in newProperties) {
		formData.set(`properties[${ p }]`, newProperties[p]);
	}

	cartRequestChange( formData, { info: { initiator: this }} );
}

function escHandler (htmlNode) {
	const { propertyInputAttribute } = settings.computed;

	if ( !( htmlNode.hasAttribute( propertyInputAttribute )) ) {
		return;
	}

	const state = getCartState();
	if ( !(state.status.cartStateSet) ) {
		htmlNode.blur();
		return;
	}

	const attributeValue = htmlNode.getAttribute( propertyInputAttribute );
	let [ objectCode, ...propertyName ] = attributeValue.split(' ');
	if(propertyName.length === 0) {
		console.error(`Liquid Ajax Cart: ${propertyInputAttribute} attribute must contain two parameters separated by the space symbol`);
		return;
	}
	objectCode = objectCode.trim();
	propertyName = propertyName.join(' ');
	
	const [ lineItem ] = findLineItemByCode(objectCode, state);
	if(lineItem) {
		let propertyValue = undefined;
		for( let p in lineItem.properties ) {
			if(propertyName === p) {
				propertyValue = lineItem.properties[p];
				break;
			}
		}
		if(propertyValue !== undefined) {
			htmlNode.value = propertyValue;
		}
	}

	htmlNode.blur();
}

function cartPropertyInputInit () {
	initEventListeners();
	subscribeToCartStateUpdate( stateHandler );
}

export { cartPropertyInputInit }