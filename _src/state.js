import { subscribeToAjaxAPI, cartGet, REQUEST_ADD } from './ajax-api';

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

subscribeToAjaxAPI( data => {
	if ( !('responseData' in data) ) {
		beforeRequestHandler( data )
	} else {
		afterRequestHandler( data );
	}
	statusUpdate();
	notify();
});

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
	status.cartStateSet = 'item_count' in cart;
}

const subscribeToCartState = ( callback ) => {
	try {
		callback({
			cart,
			status
		});
		subscribers.push( callback )
	} catch {}
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
		} catch {}
	})
}

export { subscribeToCartState, getCartState };