import { cartRequestChange, cartRequestAdd, cartRequestClear, cartRequestUpdate } from '../ajax-api';
import { getCartState } from '../state';
import {DATA_ATTR_PREFIX} from "../const";

const CHANGE_URL = `${ window.Shopify?.routes?.root || '/' }cart/change`;
const ADD_URL = `${ window.Shopify?.routes?.root || '/' }cart/add`;
const CLEAR_URL = `${ window.Shopify?.routes?.root || '/' }cart/clear`;
const UPDATE_URL = `${ window.Shopify?.routes?.root || '/' }cart/update`;

const DATA_ATTR_REQUEST_BUTTON = `${DATA_ATTR_PREFIX}-request-button`;

function clickHandler (element: Element, e: Event) {
	let url = undefined;
	const validURLs = [ CHANGE_URL, ADD_URL, CLEAR_URL, UPDATE_URL ];

	if ( !(element.hasAttribute( DATA_ATTR_REQUEST_BUTTON )) ) {
		return;
	}

	const attr = element.getAttribute( DATA_ATTR_REQUEST_BUTTON );
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
			console.error(`Liquid Ajax Cart: ${DATA_ATTR_REQUEST_BUTTON} contains an invalid URL as a parameter.`, error);
		}
	} else {
		if ( element instanceof HTMLAnchorElement && element.hasAttribute( 'href' ) ) {
			const linkURL = new URL((element as HTMLAnchorElement).href);
			if ( validURLs.includes( linkURL.pathname ) ) {
				url = linkURL;
			} else if ( element.hasAttribute( DATA_ATTR_REQUEST_BUTTON ) ) {
				console.error(
					`Liquid Ajax Cart: a link with the ${DATA_ATTR_REQUEST_BUTTON} contains an invalid href URL.`,
					`URL should be one of the following: ${CHANGE_URL}, ${ADD_URL}, ${UPDATE_URL}, ${CLEAR_URL}`
				);
			}
		}
	}

	if ( url === undefined ) {
		console.error( `Liquid Ajax Cart: a ${DATA_ATTR_REQUEST_BUTTON} element doesn't have a valid URL` );
		return;
	}

	if(e) {
		e.preventDefault();
	}

	const state = getCartState();
	if (state.status.requestInProgress) {
		return;
	}

	const formData = new FormData();
	url.searchParams.forEach(( value, key ) => {
		formData.append(key, value);
	});

	switch ( url.pathname ) {
		case ADD_URL:
			cartRequestAdd( formData, { newQueue: true, info: { initiator: element }} );
			break;
		case CHANGE_URL:
			cartRequestChange( formData, { newQueue: true, info: { initiator: element }} );
			break;
		case UPDATE_URL:
			cartRequestUpdate( formData, { newQueue: true, info: { initiator: element }} );
			break;
		case CLEAR_URL:
			cartRequestClear( {}, { newQueue: true, info: { initiator: element }});
			break;
	}
}


function cartRequestButtonInit () {
	document.addEventListener('click', function(e: Event) {
	    for (let target = (e.target as Element); target && target != document.documentElement; target = target.parentElement) {
	    	clickHandler(target, e);
	    }
	}, false);
}

export { cartRequestButtonInit }