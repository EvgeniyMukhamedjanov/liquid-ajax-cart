import { settings } from './../settings';
import { cartRequestChange, cartRequestUpdate } from './../ajax-api';
import { getCartState, subscribeToCartStateUpdate } from './../state';
import { findLineItemByCode } from './../helpers';

const disablingElementTypes = ['checkbox', 'radio'];

function consoleInputError(htmlNode) {
	const { propertyInputAttribute } = settings.computed;
	const attributeValue = htmlNode.getAttribute(propertyInputAttribute);
	const nameValue = htmlNode.getAttribute('name');
	console.error(`Liquid Ajax Cart: the element [${ propertyInputAttribute }="${ attributeValue }"]${ nameValue ? `[name="${ nameValue }"]` : '' } has wrong attributes.`);
}

function getInputData(htmlNode) {
	const { propertyInputAttribute } = settings.computed;
	if (!(htmlNode.hasAttribute(propertyInputAttribute))) {
		return [ undefined, undefined ];
	}

	let attributeValue = htmlNode.getAttribute(propertyInputAttribute).trim();
	if (!attributeValue) {
		const nameValue = htmlNode.getAttribute('name').trim();
		if(nameValue) {
			attributeValue = nameValue;
		}
	}

	if ( !attributeValue ) {
		consoleInputError();
		return [ undefined, undefined ];
	}

	if(attributeValue === 'note') {
		return [ attributeValue, undefined ];
	}

	let [objectCode, ...propertyName] = attributeValue.trim().split('[');
	let isNotValid = false;
	if(!propertyName 
		|| propertyName.length !== 1 
		|| propertyName[0].length < 2 
		|| propertyName[0].indexOf(']') !== propertyName[0].length - 1 ) {
		consoleInputError();
		return [ undefined, undefined ];
	}
	propertyName = propertyName[0].replace(']', '');

	return [ objectCode, propertyName ];
}

function initEventListeners() {

	document.addEventListener('change', function(e) {
		changeHandler(e.target, e);
	}, false);

	document.addEventListener("keydown", function(e) {
		if (e.key === "Enter" ) {
			if ( e.target.tagName.toUpperCase() !== 'TEXTAREA' || e.ctrlKey) {
				changeHandler(e.target, e);
			}
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
			let elementType = element.getAttribute('type') || '';
			elementType = elementType.toLowerCase();
			if(elementType === 'hidden') {
				return;
			}
			element.readOnly = true;
			if(disablingElementTypes.includes(elementType) || element.tagName.toUpperCase() === 'SELECT') {
				element.disabled = true;
			}
		})
	} else {
		document.querySelectorAll(`[${ propertyInputAttribute }]`).forEach( element => {
			const elementTag = element.tagName.toUpperCase();
			let elementType = element.getAttribute('type') || '';
			elementType = elementType.toLowerCase();
			if(elementType === 'hidden') {
				return;
			}

			const [ objectCode, propertyName ] = getInputData(element);
			
			if(!objectCode) {
				return;
			}

			if (!(state.status.cartStateSet)) {
				return;
			}

			let propertyValue = undefined;
			let doNotEnable = false;
			if( objectCode === 'note' ) {
				propertyValue = state.cart.note;
			} else if (objectCode === 'attributes') {
				propertyValue = state.cart.attributes[propertyName];
			} else {
				const [ lineItem, objectCodeType ] = findLineItemByCode(objectCode, state);
				if(lineItem) {
					propertyValue = lineItem.properties[propertyName];
				}
				if(lineItem === null) {
					let attributeValue = element.getAttribute(propertyInputAttribute).trim();
					if (!attributeValue) {
						const nameValue = element.getAttribute('name').trim();
						if(nameValue) {
							attributeValue = nameValue;
						}
					}
					console.error(`Liquid Ajax Cart: line item with ${ objectCodeType }="${ objectCode }" was not found when the [${propertyInputAttribute}] element with "${attributeValue}" value tried to get updated from the State`);
					doNotEnable = true;
				}
			}

			if(elementType === 'checkbox' || elementType === 'radio') {
				if(element.value === propertyValue) {
					element.checked = true;
				} else {
					element.checked = false;
				}
			} else {
				if ( !propertyValue && typeof propertyValue !== 'string' && !(propertyValue instanceof String)) {
					propertyValue = '';
				}
				element.value = propertyValue;
			}

			if (!doNotEnable) {
				element.readOnly = false;
				if(disablingElementTypes.includes(elementType) || element.tagName.toUpperCase() === 'SELECT') {
					element.disabled = false;
				}
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

	let attributeValue = htmlNode.getAttribute(propertyInputAttribute).trim();
	if (!attributeValue) {
		const nameValue = htmlNode.getAttribute('name').trim();
		if(nameValue) {
			attributeValue = nameValue;
		}
	}
	const [ objectCode, propertyName ] = getInputData(htmlNode);
	if(!objectCode) {
		return;
	}

	let htmlNodeType = htmlNode.getAttribute('type') || '';
	htmlNodeType = htmlNodeType.toLowerCase();
	let newPropertyValue = htmlNode.value;
	if(htmlNodeType === 'checkbox' && !htmlNode.checked) {
		let negativeValueInput = document.querySelector(`input[type="hidden"][${ propertyInputAttribute }="${ attributeValue }"]`);
		if (!negativeValueInput && ( objectCode === 'note' || objectCode === 'attributes') ) {
			negativeValueInput = document.querySelector(`input[type="hidden"][${ propertyInputAttribute }][name="${ attributeValue }"]`);
		}
		if(negativeValueInput) {
			newPropertyValue = negativeValueInput.value;
		} else {
			newPropertyValue = '';
		}
	}

	if( objectCode === 'note' ) {
		const formData = new FormData();
		formData.set('note', newPropertyValue);
		cartRequestUpdate( formData, { info: { initiator: htmlNode }} );
	} else if (objectCode === 'attributes') {
		const newProperties = {
			...state.cart.attributes
		}
		newProperties[propertyName] = newPropertyValue;

		const formData = new FormData();
		for( let p in newProperties) {
			formData.set(`attributes[${ p }]`, newProperties[p]);
		}
		cartRequestUpdate( formData, { info: { initiator: htmlNode }} );
	} else {
		const [ lineItem, objectCodeType ] = findLineItemByCode(objectCode, state);

		if (lineItem === null) {
			console.error(`Liquid Ajax Cart: line item with ${ objectCodeType }="${ objectCode }" was not found when the [${propertyInputAttribute}] element with "${attributeValue}" value tried to update the cart`);
		}

		if(!lineItem) {
			return
		}
			
		const newProperties = {
			...lineItem.properties
		}
		newProperties[propertyName] = newPropertyValue;

		const formData = new FormData();
		formData.set(objectCodeType, objectCode);
		formData.set('quantity', lineItem.quantity);
		for( let p in newProperties) {
			formData.set(`properties[${ p }]`, newProperties[p]);
		}

		cartRequestChange( formData, { info: { initiator: htmlNode }} );
	}
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