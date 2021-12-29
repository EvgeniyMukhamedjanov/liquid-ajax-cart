const REQUEST_ADD = 'add';
const REQUEST_CHANGE = 'change';
const REQUEST_UPDATE = 'update';
const REQUEST_CLEAR = 'clear';
const REQUEST_GET = 'get';

const subscribers = [];

const getEndpoint = ( requestType ) => {
	switch ( requestType ) {
		case REQUEST_ADD:
			return '/cart/add.js';
			break;

		case REQUEST_CHANGE:
			return '/cart/change.js';
			break;

		case REQUEST_GET:
			return '/cart.js';
			break;

		case REQUEST_CLEAR:
			return '/cart/clear.js';
			break;

		case REQUEST_UPDATE:
			return '/cart/update.js';
			break;

		default:
			return undefined;
	}
	return undefined;
}

const cartRequest = ( requestType, body, options = {} ) => {
	const endpoint = getEndpoint( requestType );
	let requestBody = undefined;
	if ( requestType !== REQUEST_GET ) {
		requestBody = body || {};
	}
	const method = requestType === REQUEST_GET ? 'GET' : 'POST';
	const info = options.info || {};
	const resultSubscribers = 'firstComplete' in options ? [ options.firstComplete ] : [];
	const requestState = {
		requestType,
		endpoint
	}

	subscribers.forEach( callback => {
		try {
			callback({
				requestType,
				endpoint,
				info,
				// the same requestBody will be used in the fetch request, 
				// so subscriber can make changes in it before the request
				requestBody
			}, resultCallback => resultSubscribers.push( resultCallback ));
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during Ajax request subscriber callback in ajax-api');
			console.error(e);
		}
	});

	if ( 'lastComplete' in options ) {
		resultSubscribers.push( options.lastComplete );
	}

	requestState.requestBody = requestBody;
	requestState.info = info;

	const fetchPayload = {
		method
	}
	if ( requestType !== REQUEST_GET ) {
		if ( requestBody instanceof FormData || requestBody instanceof URLSearchParams ) {
			fetchPayload.body = requestBody;
			fetchPayload.headers = {
		    	'x-requested-with': 'XMLHttpRequest'
		  	}
		} else {
			fetchPayload.body = JSON.stringify(requestBody);
			fetchPayload.headers = {
		    	'Content-Type': 'application/json'
		  	}
		}
	}

	fetch( 
		endpoint, 
		fetchPayload
	).then( response => {
		return response.json().then( responseBody => {
			return {
				ok: response.ok,
				status: response.status,
				body: responseBody
			}
		});
	}).then( data => {

		requestState.responseData = data;

		if ( REQUEST_ADD !== requestType || !(requestState.responseData.ok)) {
			return requestState;
		}

		// if requestType is REQUEST_ADD lets call 'update' also to get cart json
		// for state and all the subscribers
		return fetch ( getEndpoint( REQUEST_UPDATE ), {
			method: 'POST',
			headers: {
		    	'Content-Type': 'application/json'
		  	}
		}).then( response => response.json().then( responseBody => {
				requestState.extraResponseData = {
					ok: response.ok,
					status: response.status,
					body: responseBody
				};
				return requestState;
			})
		);

	}).catch( error => {
		console.error('Liquid Ajax Cart: Error while performing cart Ajax request')
		console.error(error);
		requestState.fetchError = error;
		// throw requestState;
	}).finally(() => {
		resultSubscribers.forEach( callback => {
			try {
				callback(requestState);
			} catch (e) {
				console.error('Liquid Ajax Cart: Error during Ajax request result callback in ajax-api');
				console.error(e);
			}
		})
	});
}

const cartRequestGet = ( options ) => {
	cartRequest( REQUEST_GET, undefined, options );
}

const cartRequestAdd = ( body, options ) => {
	cartRequest( REQUEST_ADD, body, options );
}

const cartRequestChange = ( body, options ) => {
	cartRequest( REQUEST_CHANGE, body, options );
}

const cartRequestUpdate = ( body, options ) => {
	cartRequest( REQUEST_UPDATE, body, options );
}

const cartRequestClear = ( body, options ) => {
	cartRequest( REQUEST_CLEAR, body, options );
}

const subscribeToCartAjaxRequests = ( callback ) => {
	subscribers.push( callback );
}

export { 
	cartRequestAdd, 
	cartRequestChange, 
	cartRequestClear, 
	cartRequestGet, 
	cartRequestUpdate, 
	subscribeToCartAjaxRequests, 
	REQUEST_ADD,
	REQUEST_CHANGE
}