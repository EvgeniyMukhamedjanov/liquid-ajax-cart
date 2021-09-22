const REQUEST_ADD = 'add';
const REQUEST_CHANGE = 'change';
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

		default:
			return undefined;
	}
	return undefined;
}

const cartRequest = ( requestType, body ) => {
	const endpoint = getEndpoint( requestType )
	const requestBody = requestType === REQUEST_GET ? undefined : { ...body };
	const method = requestType === REQUEST_GET ? 'GET' : 'POST'

	subscribers.forEach( callback => {
		try {
			callback({
				requestType,
				endpoint,
				// the same requestBody will be used in the fetch request, 
				// so subscriber can make changes in it before the request
				requestBody

				// if a callback is fired without 'responseData' object in the payload, 
				// it means this is a callback before request is started
			});
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during callback');
			console.error(e);
		}
	})

	const fetchPayload = {
		method,
		headers: {
	    	'Content-Type': 'application/json'
	  	}
	}
	if ( requestType !== REQUEST_GET ) {
		fetchPayload.body = JSON.stringify( requestBody )
	}

	return fetch( 
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

		subscribers.forEach( callback => {
			try {
				callback({
					requestType,
					endpoint,
					requestBody,
					// if a callback is fired with 'responseData' object, 
					// it means this is a callback after request is done
					responseData: data
				});
			} catch (e) {
				console.error('Liquid Ajax Cart: Error during callback');
				console.error(e);
			}
		})

		// console.log( data );

		return data;
	}).catch( data => {
		console.log(data);
		// todo: callbacks!!!
	});
}

const cartGet = () => {
	return cartRequest( REQUEST_GET )
}

const cartAdd = ( body ) => {
	return cartRequest( REQUEST_ADD, body )
}

const cartChange = ( body ) => {
	return cartRequest( REQUEST_CHANGE, body )
}

const subscribeToAjaxAPI = ( callback ) => {
	subscribers.push( callback );
}

export { cartAdd, cartChange, cartGet, subscribeToAjaxAPI, REQUEST_ADD }