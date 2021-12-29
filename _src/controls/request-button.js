import { settings } from './../settings';
import { cartRequestChange, cartRequestAdd, cartRequestClear, cartRequestUpdate } from './../ajax-api';
import { getCartState } from './../state';

const CHANGE_URL = '/cart/change';
const ADD_URL = '/cart/add';
const CLEAR_URL = '/cart/clear';
const UPDATE_URL = '/cart/update';


function clickHandler (htmlNode, e) {
	const { requestButtonAttribute } = settings.computed;
	let url = undefined;
	const validURLs = [ CHANGE_URL, ADD_URL, CLEAR_URL, UPDATE_URL ];

	if ( htmlNode.hasAttribute( requestButtonAttribute ) ) {
		const attr = htmlNode.getAttribute( requestButtonAttribute );
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
				console.error(`Liquid Ajax Cart: ${requestButtonAttribute} contains an invalid URL as a parameter.`, error);
			}
		}
	}

	if ( url === undefined ) {
		if ( htmlNode.hasAttribute( 'href' ) && htmlNode.tagName.toUpperCase() === 'A' ) {
			const linkURL = new URL(htmlNode.href);
			if ( validURLs.includes( linkURL.pathname ) ) {
				url = linkURL;
			} else if ( htmlNode.hasAttribute( requestButtonAttribute ) ) {
				console.error(
					`Liquid Ajax Cart: a link with the ${requestButtonAttribute} contains an invalid href URL.`, 
					`URL should be one of the following: ${CHANGE_URL}, ${ADD_URL}, ${UPDATE_URL}, ${CLEAR_URL}`
				);
			}
		}
	}

	if ( url === undefined ) {
		return;
	}

	if(e) {
		e.preventDefault();
	}

	const state = getCartState();
	if ( state.status.requestInProgress ) {
		return;
	}

	const formData = new FormData();
	url.searchParams.forEach(( value, key ) => {
		formData.append(key, value);
	});

	switch ( url.pathname ) {
		case ADD_URL:
			cartRequestAdd( formData, { info: { initiator: htmlNode }} );
			break;
		case CHANGE_URL:
			cartRequestChange( formData, { info: { initiator: htmlNode }} );
			break;
		case UPDATE_URL:
			cartRequestUpdate( formData, { info: { initiator: htmlNode }} );
			break;
		case CLEAR_URL:
			cartRequestClear( {}, { info: { initiator: htmlNode }});
			break;
	}
}


function cartRequestButtonInit () {
	document.addEventListener('click', function(e) {
	    for (var target = e.target; target && target != this; target = target.parentNode) {
	    	clickHandler(target, e);
	    }
	}, false);
}

export { cartRequestButtonInit }