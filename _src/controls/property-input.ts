import { AppStateType, JSONValueType, RequestBodyType } from './../ts-types';

import { settings } from './../settings';
import { cartRequestChange, cartRequestUpdate } from './../ajax-api';
import { getCartState, subscribeToCartStateUpdate } from './../state';
import { findLineItemByCode } from './../helpers';

type ValidElementType = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function consoleInputError(element: Element) {
	const { propertyInputAttribute } = settings.computed;

	const attributeValue = element.getAttribute(propertyInputAttribute);
	const nameValue = element.getAttribute('name');
	console.error(`Liquid Ajax Cart: the element [${ propertyInputAttribute }="${ attributeValue }"]${ nameValue ? `[name="${ nameValue }"]` : '' } has wrong attributes.`);
}

function isValidElement(element: Element): boolean {
	const { propertyInputAttribute } = settings.computed;

	if ( !(element.hasAttribute(propertyInputAttribute)) ) {
		return false;
	}

	if((!(element instanceof HTMLInputElement) || element.type === 'hidden')
		&& !(element instanceof HTMLTextAreaElement)
		&& !(element instanceof HTMLSelectElement)) {
		return false;
	}

	return true;
}

type InputDataType = {
	objectCode: string | undefined,
	propertyName: string | undefined,
	attributeValue: string | undefined
}
function getInputData(element: Element): InputDataType {
	const { propertyInputAttribute } = settings.computed;
	const result: InputDataType = {
		objectCode: undefined,
		propertyName: undefined,
		attributeValue: undefined
	}

	if (!(element.hasAttribute(propertyInputAttribute))) {
		return result;
	}

	let attributeValue = element.getAttribute(propertyInputAttribute).trim();
	if (!attributeValue) {
		const nameValue = element.getAttribute('name').trim();
		if(nameValue) {
			attributeValue = nameValue;
		}
	}

	if ( !attributeValue ) {
		consoleInputError(element);
		return result;
	}
	result.attributeValue = attributeValue;

	if(attributeValue === 'note') {
		result.objectCode = 'note';
		return result;
	}

	let [objectCode, ...propertyName] = attributeValue.trim().split('[');
	let isNotValid = false;
	if(!propertyName 
		|| propertyName.length !== 1 
		|| propertyName[0].length < 2 
		|| propertyName[0].indexOf(']') !== propertyName[0].length - 1 ) {
		consoleInputError(element);
		return result;
	}
	result.objectCode = objectCode;
	result.propertyName = propertyName[0].replace(']', '');

	return result;
}

function initEventListeners() {

	document.addEventListener('change', function(e) {
		changeHandler((e.target as HTMLElement), e);
	}, false);

	document.addEventListener("keydown", function(e) {
		const element = e.target as HTMLElement;
		if (e.key === "Enter") {
			if ( !(element instanceof HTMLTextAreaElement) || e.ctrlKey) {
				changeHandler(element, e);
			}
		}

		if (e.key === "Escape") {
			escHandler(element);
		}
	}, false);
}

function stateHandler ( state: AppStateType ) {
	const { propertyInputAttribute } = settings.computed;

	if ( state.status.requestInProgress ) {
		document.querySelectorAll(`[${ propertyInputAttribute }]`).forEach( element => {
			if(isValidElement(element)) {
				(element as ValidElementType).disabled = true;
			}
		})
	} else {
		document.querySelectorAll(`[${ propertyInputAttribute }]`).forEach( element => {
			if(!isValidElement(element)) {
				return;
			}

			const { objectCode, propertyName, attributeValue } = getInputData(element);
			
			if(!objectCode) {
				return;
			}

			if (!(state.status.cartStateSet)) {
				return;
			}

			let propertyValue: JSONValueType | undefined = undefined;
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
					console.error(`Liquid Ajax Cart: line item with ${ objectCodeType }="${ objectCode }" was not found when the [${propertyInputAttribute}] element with "${attributeValue}" value tried to get updated from the State`);
					doNotEnable = true;
				}
			}

			if( element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
				if((element as HTMLInputElement).value === propertyValue) {
					(element as HTMLInputElement).checked = true;
				} else {
					(element as HTMLInputElement).checked = false;
				}
			} else {
				if ( typeof propertyValue !== 'string' 
					&& !(propertyValue instanceof String) 
					&& typeof propertyValue !== 'number' 
					&& !(propertyValue instanceof Number)) {
					if (Array.isArray(propertyValue) || <JSONValueType>propertyValue instanceof Object) {
						propertyValue = JSON.stringify(propertyValue);
						console.warn(`Liquid Ajax Cart: the ${ propertyInputAttribute } with the "${ attributeValue }" value is bound to the ${ propertyName } ${ objectCode === 'attributes' ? 'attribute' : 'property' } that is not string or number: ${ propertyValue }`);
					} else {
						propertyValue = '';
					}
				}
				(element as ValidElementType).value = <string>propertyValue;
			}

			if (!doNotEnable) {
				(element as ValidElementType).disabled = false;
			}
		})
	}
}

function changeHandler (element: Element, e: Event) {
	const { propertyInputAttribute } = settings.computed;

	if(!isValidElement(element)) {
		return;
	}

	if(e) {
		e.preventDefault(); // prevent form submission
	}

	(element as ValidElementType).blur();
	const state = getCartState();
	if (!(state.status.cartStateSet)) {
		return;
	}
	if ( state.status.requestInProgress ) {
		return;
	}

	const { objectCode, propertyName, attributeValue } = getInputData(element);
	if(!objectCode) {
		return;
	}

	let newPropertyValue = (element as ValidElementType).value;
	if(element instanceof HTMLInputElement && element.type === 'checkbox' && !element.checked) {
		let negativeValueInput = <HTMLInputElement>document.querySelector(`input[type="hidden"][${ propertyInputAttribute }="${ attributeValue }"]`);
		if (!negativeValueInput && ( objectCode === 'note' || objectCode === 'attributes') ) {
			negativeValueInput = <HTMLInputElement>document.querySelector(`input[type="hidden"][${ propertyInputAttribute }][name="${ attributeValue }"]`);
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
		cartRequestUpdate( formData, { newQueue: true, info: { initiator: element }} );
	} else if (objectCode === 'attributes') {
		const formData = new FormData();
		formData.set(`attributes[${ propertyName }]`, newPropertyValue);
		cartRequestUpdate( formData, { newQueue: true, info: { initiator: element }} );
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
		let requestBody: RequestBodyType = formData;
		formData.set(objectCodeType, objectCode);
		formData.set('quantity', lineItem.quantity.toString());
		for( let p in newProperties) {
			const v = newProperties[p];
			if ( typeof v === 'string' || v instanceof String ) {
				formData.set(`properties[${ p }]`, <string>newProperties[p]);
			} else {
				requestBody = {
					[ objectCodeType ]: objectCode,
					quantity: lineItem.quantity,
					properties: newProperties
				}
			}
		}
		cartRequestChange( requestBody, { newQueue: true, info: { initiator: element }} );
	}
}

function escHandler (element: Element) {
	if(!isValidElement(element)) {
		return;
	}

	if ( !(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement) ) {
		return;
	}

	if ( element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio') ) {
		return;
	}

	const state = getCartState();
	if ( !(state.status.cartStateSet) ) {
		(element as ValidElementType).blur();
		return;
	}

	const { objectCode, propertyName } = getInputData(element);
	if(!objectCode) {
		return;
	}

	let propertyValue: JSONValueType | undefined = undefined;
	if( objectCode === 'note' ) {
		propertyValue = state.cart.note;
	} else if ( objectCode === 'attributes' ) {
		propertyValue = state.cart.attributes[propertyName];
	} else {
		const [ lineItem ] = findLineItemByCode(objectCode, state);
		if(lineItem) {
			propertyValue = lineItem.properties[propertyName];
		}
	}
	if(propertyValue !== undefined) {
		if ( !propertyValue && typeof propertyValue !== 'string' && !(propertyValue instanceof String)) {
			propertyValue = '';
		}
		element.value = String(propertyValue);
	}

	(element as ValidElementType).blur();
}

function cartPropertyInputInit () {
	initEventListeners();
	subscribeToCartStateUpdate( stateHandler );
	stateHandler( getCartState() );
}

export { cartPropertyInputInit }