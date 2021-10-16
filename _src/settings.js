const cssClassesPrefix = 'js-ajax-cart';
const dataAttributePrefix = 'data-ajax-cart';

const defaultSettings = {
	productFormsFilter: formNode => true
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

		cartStateSetBodyClass: `${ cssClassesPrefix }-set`,
		requestInProgressBodyClass: `${ cssClassesPrefix }-request-in-progress`,
		emptyCartBodyClass: `${ cssClassesPrefix }-empty`,
		notEmptyCartBodyClass: `${ cssClassesPrefix }-not-empty`,
		productFormsProcessingClass: `${ cssClassesPrefix }-form-in-progress`,

	};
}
configure();

export { settings, configure };