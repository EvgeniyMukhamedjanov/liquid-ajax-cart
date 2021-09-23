const defaultSettings = {
	dataAttributePrefix: 'data-ajax-cart',
	cssClassesPrefix: 'js-ajax-cart',
	productFormsFilter: formNode => true,
	requestInProgressBodyClass: 'js-ajax-cart-request-in-progress',
	cartStateSetBodyClass: 'js-ajax-cart-set',
	emptyCartBodyClass: 'js-ajax-cart-empty',
	productFormsIgnoreSubmitOnProcessing: true,
	productFormsProcessingClass: 'js-ajax-cart-form-in-progress',
	productFormsButtonProcessingClass: 'js-ajax-cart-button-in-progress',
	productFormsButtonProcessingDisabledAttribute: false
}

let settings = {};

const configure = ( newSettings = {} ) => {
	settings = {
		...defaultSettings,
		...newSettings
	};
	settings.computed = {
		productFormsErrorsAttribute: `${ settings.dataAttributePrefix }-form-error`,
		sectionsAttribute: `${ settings.dataAttributePrefix }-section`,
		binderAttribute: `${ settings.dataAttributePrefix }-bind-state`,
		quantityButtonAttribute: `${ settings.dataAttributePrefix }-quantity-button`,
		toggleClassButtonAttribute: `${ settings.dataAttributePrefix }-toggle-class-button`,
		toggleClassPrefix: `${ settings.cssClassesPrefix }-toggle-`,
		initialStateAttribute: `${ settings.dataAttributePrefix }-initial-state`,
		sectionScrollAreaAttribute: `${ settings.dataAttributePrefix }-section-scroll`
	};
}
configure();

export { settings, configure };