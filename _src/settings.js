const cssClassesPrefix = 'js-ajax-cart';
const dataAttributePrefix = 'data-ajax-cart';

const defaultSettings = {
	productFormsFilter: formNode => true,
	messageBuilder: messages => {
		let result = '';
		messages.forEach( element => {
			result += `<div class="${ cssClassesPrefix }-message ${ cssClassesPrefix }-message--${ element.type }">${ element.text }</div>`;
		})
		return result;
	},

	lineItemQuantityErrorText: 'You can\'t add more of this item to your cart',
	requestErrorText: 'There was an error while updating your cart. Please try again.',
}

let settings = {};

const configure = ( newSettings = {} ) => {
	settings = {
		...defaultSettings,
		...newSettings
	};
	settings.computed = {
		productFormsErrorsAttribute: `${ dataAttributePrefix }-form-error`,
		sectionsAttribute: `${ dataAttributePrefix }-section`,
		binderAttribute: `${ dataAttributePrefix }-bind-state`,
		requestButtonAttribute: `${ dataAttributePrefix }-request-button`,
		toggleClassButtonAttribute: `${ dataAttributePrefix }-toggle-class-button`,
		initialStateAttribute: `${ dataAttributePrefix }-initial-state`,
		sectionScrollAreaAttribute: `${ dataAttributePrefix }-section-scroll`,
		quantityInputAttribute: `${ dataAttributePrefix }-quantity-input`,
		messagesAttribute: `${ dataAttributePrefix }-messages`,

		cartStateSetBodyClass: `${ cssClassesPrefix }-set`,
		requestInProgressBodyClass: `${ cssClassesPrefix }-request-in-progress`,
		emptyCartBodyClass: `${ cssClassesPrefix }-empty`,
		notEmptyCartBodyClass: `${ cssClassesPrefix }-not-empty`,
		productFormsProcessingClass: `${ cssClassesPrefix }-form-in-progress`,

	};
}

export { settings, configure };