const subscribers = [];

const queryCounter = {
	all: 0
	/**
	 * 'item_key': {
	 * 		quantity: 0,
	 * 		properties: 0,
	 * }
	 */ 
};

let currentState = {
	cart: {},
	status: {}
};

function setState ( newState ) {
	currentState = {
		...currentState,
		...newState,
		isSet: true
	};
	notify();
}

function notify() {
	subscribers.forEach(element => {
		if ( element !== undefined ) {
			element(currentState);
		}
	});
}

export function getCartState () {
	return currentState;
}

/**
 * For setting up the cart json from outside. 
 * For example — initial state {{ cart | json }}.
 */
export function setCartJson ( cartJson ) {
	setState({
		cart: cartJson
	});
}

export function subscribeToCartState ( callbackFunction ) {
	callbackFunction( currentState );

	const subscribtionId = subscribers.push( callbackFunction ) - 1;
	return subscribtionId;
}

export function unsubscribeFromCartState ( subscribtionId ) {
	subscribers[ subscribtionId ] = undefined;
}

/**
 * Refresh from server
 */
export function refreshCartState () {
	fetch('/cart.js', {
		method: 'GET',
	 	headers: {
	    	'Content-Type': 'application/json'
	  	}
	})
	.then(response => {
		if (response.ok) {
			return response.json();
		}
	  	throw response;
	}).then(data => {
		setState({
			cart: data
		});
	}).catch((error) => {
	  	console.error('Error:', error);
	});
}

export function changeCartItem ( key, quantity, options ) {
	if (key.indexOf(':') < 0) {
		return;
	}
	// if(parseInt(qty) > -1 && qty !== sta )

	const body = {
		'id': key,
		'quantity': quantity,
		'sections': 'ajax-cart'
	}

	fetch('/cart/change.js', {
		method: 'POST',
	 	headers: {
	    	'Content-Type': 'application/json'
	  	},
	  	body: JSON.stringify(body)
	})
	.then(response => {
		if (response.ok) {
			return response.json();
		}
	  	throw response;
	}).then(data => {
		console.log(data);
		return data;
		return new Promise((resolve, reject) => {
		 	setTimeout(() => {
		    	resolve(data);
			}, 1000);
		})
	}).then(data => {
		setState({
			cart: data
		});
	}).catch((error) => {
	  	console.error('Error:', error);
	});
}