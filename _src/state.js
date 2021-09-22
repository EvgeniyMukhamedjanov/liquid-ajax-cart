import { subscribeToAjaxAPI, cartGet, REQUEST_ADD } from './ajax-api';
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

	subscribeToAjaxAPI( data => {
		if ( !('responseData' in data) ) {
			beforeRequestHandler( data )
		} else {
			afterRequestHandler( data );
		}
		statusUpdate();
		notify();
	});

	const initialStateContainer = document.querySelector(`[${ settings.computed.initialStateAttribute }]`);
	if ( initialStateContainer ) {
		try {
			const initialState = JSON.parse(initialStateContainer.textContent);
			// todo: create a function for checking cart object
			if ( 'item_count' in initialState ) {
				cart = initialState;
				statusUpdate();
				notify();
			} else {
				throw `JSON from ${ settings.computed.initialStateAttribute } script is not correct cart object`;
			}
		} catch (e) {
			console.error(`Can't parse cart JSON from ${ settings.computed.initialStateAttribute } script`);
			console.error(e);
			cartGet();
		}
	} else {
		cartGet();
	}
}



const beforeRequestHandler = ( data ) => {
	queryCounter.all++;
}

const afterRequestHandler = ( data ) => {
	queryCounter.all--;
	if ( data.responseData.ok ) {
		if ( data.requestType !== REQUEST_ADD ) {
			cart = data.responseData.body;
		} else {
			cartGet();
		}
	}
}

const statusUpdate = () => {
	status.requestInProgress = queryCounter.all > 0;
	status.cartStateSet = 'item_count' in cart; // todo: create a function for checking cart object
}

const subscribeToCartState = ( callback ) => {
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
			// todo: add error handler like in subscribeToCartState
		}
	})
}

init();

export { subscribeToCartState, getCartState };