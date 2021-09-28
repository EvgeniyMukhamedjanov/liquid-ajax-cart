import { subscribeToCartAjaxRequests, cartRequestGet, REQUEST_ADD } from './ajax-api';
import { settings } from './settings';

const queryCounter = {
	all: 0
	/**
	 * 'item_key': {
	 * 		quantity: 0,
	 * 		properties: 0,
	 * }
	 */ 
};

const subscribers = [];
let cart = {};
let status = {
	requestInProgress: false,
	cartStateSet: false,
};

const init = () => {

	subscribeToCartAjaxRequests(( data, subscribeToResult ) => {		
		beforeRequestHandler( data )
		statusUpdate();

		subscribeToResult( data => {
			afterRequestHandler( data );
			statusUpdate();
		})
	});

	const initialStateContainer = document.querySelector(`[${ settings.computed.initialStateAttribute }]`);
	if ( initialStateContainer ) {
		try {
			const initialState = JSON.parse(initialStateContainer.textContent);
			// todo: create a function for checking cart object
			if ( 'item_count' in initialState ) {
				cart = initialState;
				statusUpdate();
			} else {
				throw `JSON from ${ settings.computed.initialStateAttribute } script is not correct cart object`;
			}
		} catch (e) {
			console.error(`Can't parse cart JSON from ${ settings.computed.initialStateAttribute } script`);
			console.error(e);
			cartRequestGet();
		}
	} else {
		cartRequestGet();
	}
}



const beforeRequestHandler = ( data ) => {
	queryCounter.all++;
}

const afterRequestHandler = ( data ) => {
	queryCounter.all--;
	if ( 'responseData' in data && data.responseData.ok ) {
		if ( data.requestType === REQUEST_ADD ) {
			if ( 'extraResponseData' in data && data.extraResponseData.ok ) {
				cart = data.extraResponseData.body;
			} else {
				cartRequestGet();
			}
			
		} else {
			cart = data.responseData.body;
		}
	}
}

const statusUpdate = () => {
	status.requestInProgress = queryCounter.all > 0;
	status.cartStateSet = 'item_count' in cart; // todo: create a function for checking cart object
	notify();
}

const subscribeToCartStateUpdate = ( callback ) => {
	try {
		callback({
			cart,
			status
		});
		subscribers.push( callback );
	} catch (e) {
		console.log('Liquid Ajax Cart: Error during subscribing to the state');
		console.error(e);
	}
}

const getCartState = () => {
	return {
		cart,
		status
	}
}

const notify = () => {
	subscribers.forEach( callback => {
		try {
			callback({
				cart,
				status,
			});
		} catch (e) {
			console.error(e);
			// todo: add error handler like in subscribeToCartStateUpdate
		}
	})
}

init();

export { subscribeToCartStateUpdate, getCartState };