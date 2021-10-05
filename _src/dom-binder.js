import { getCartState, subscribeToCartStateUpdate } from './state';
import { settings } from './settings';

const updateDOM = ( state ) => {

	const binderAttribute = settings.computed.binderAttribute;

	if ( state.status.cartStateSet ) {
		document.querySelectorAll( `[${ binderAttribute }]` ).forEach( element => {
			const path = element.getAttribute( binderAttribute );
			const value = computeValue( path );
			if (value !== undefined) {
				element.innerText = value;
			}
		});
	}
}

const computeValue = ( str ) => {
	const [ path, ...filters ] = str.split('|');
	let value = getStateValueByString( path );
	filters.forEach( element => {
		const formatterName = element.trim();
		if ( formatterName !== '' ) {
			if ( formatterName in formatters ) {
				value = formatters[ formatterName ]( value );
			} else {
				// todo: console.log
			}
			
		}
	})
	return value;
}

// don't pass obj parameter when you call the function — the obj param is for reccursive calls
function getStateValueByString ( str, obj = getCartState() ) {
	const state = getCartState();
	// todo test with "foo.bar.", ".foo.bar", ".foo.bar.", "foo..bar", "foo. .bar. "
	const properties = str.split('.');
	const currentProperty = properties.shift().trim();
	if ( currentProperty in obj && properties.length > 0 ) {
		return getStateValueByString( properties.join('.'), obj[ currentProperty ] )
	}
	return obj[ currentProperty ];
}

const formatters = {
	'amount': ( value ) => {
		if ( 'Shopify' in window && 'formatMoney' in Shopify ) {
			return Shopify.formatMoney(value, '{{ amount }}');
		}
	},
	'amount_no_decimals': ( value ) => {
		if ( 'Shopify' in window && 'formatMoney' in Shopify ) {
			return Shopify.formatMoney(value, '{{ amount_no_decimals }}');
		}
	},
	'amount_with_comma_separator': ( value ) => {
		if ( 'Shopify' in window && 'formatMoney' in Shopify ) {
			return Shopify.formatMoney(value, '{{ amount_with_comma_separator }}');
		}
	},
	'amount_no_decimals_with_comma_separator': ( value ) => {
		if ( 'Shopify' in window && 'formatMoney' in Shopify ) {
			return Shopify.formatMoney(value, '{{ amount_no_decimals_with_comma_separator }}');
		}
	},
	'amount_with_apostrophe_separator': ( value ) => {
		if ( 'Shopify' in window && 'formatMoney' in Shopify ) {
			return Shopify.formatMoney(value, '{{ amount_with_apostrophe_separator }}');
		}
	}
}

const init = () => {
	subscribeToCartStateUpdate( updateDOM );
	updateDOM( getCartState() );
}
init();