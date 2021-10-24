import { subscribeToCartAjaxRequests, REQUEST_ADD, REQUEST_CHANGE } from './ajax-api';
import { getCartState } from './state';
import { settings } from './settings';

const MESSAGE_TYPES = {
	ERROR: 'error'
}

const MESSAGE_CODES = {
	LINE_ITEM_QUANTITY_ERROR: 'line_item_quantity_error',
	SHOPIFY_ERROR: 'shopify_error',
	REQUEST_ERROR: 'request_error',
}

const changeRequestHandler = ( requestState, subscribeToResult ) => {
	const { messagesAttribute } = settings.computed;
	let requestedId, requestedQuantity, requestedIdItems = [], itemKey, errorContainers;

	if ( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) {
		requestedId = requestState.requestBody.get('id');
		requestedQuantity = requestState.requestBody.get('quantity');
    } else {
		requestedId = requestState.requestBody.id;
		requestedQuantity = requestState.requestBody.quantity;
	}

	if ( requestedId ) {
		const state = getCartState();
		if ( state.status.cartStateSet ) {
			state.cart.items.forEach( element => {
				requestedIdItems.push( element );
			});
		}

		if ( requestedId.indexOf(':') > -1 ) {
			errorContainers = document.querySelectorAll(`[${ messagesAttribute }="${ requestedId }"]`);
		} else {
			const errorContainersSelectorArray = requestedIdItems.map( element => `[${ messagesAttribute }="${ element.key }"]` );
        	errorContainers = document.querySelectorAll(errorContainersSelectorArray.join(','));
		}

		if ( errorContainers.length > 0 ) {
			errorContainers.forEach( element => {
				element.innerHTML = '';
			});
		}
	}

	subscribeToResult( requestState => {
		const { lineItemQuantityErrorText, messageBuilder } = settings;
		const { messagesAttribute } = settings.computed;
		let resultItems = [];
		const itemQuantityErrors = [];

		if ( requestState.responseData?.ok ) {
			if ( requestedId ) {
				resultItems = requestState.responseData.body.items.reduce(( acc, element ) => {
					if (( element.key === requestedId || element.id === requestedId ) ) {
						acc.push(element);
					}
					return acc;
				}, []);
			}

			resultItems.forEach( element => {
				if ( element.quantity < requestedQuantity ) {
					itemQuantityErrors.push( element );
				}
			});

			const errorContainersSelectorArray = itemQuantityErrors.reduce((acc, element) => {
				acc.push(`[${ messagesAttribute }="${ element.key }"]`);
        		return acc;
        	}, []);

			errorContainers = [];
			if ( errorContainersSelectorArray.length > 0 ) {
				errorContainers = document.querySelectorAll( errorContainersSelectorArray.join(',') );
			}

			errorContainers.forEach( element => {
				element.innerHTML = messageBuilder([{
					type: MESSAGE_TYPES.ERROR,
					text: lineItemQuantityErrorText,
					code: MESSAGE_CODES.LINE_ITEM_QUANTITY_ERROR,
					requestState
				}]);
			});
		} else {
			const errorMessage = getRequestError( requestState );

			if ( requestedId.indexOf(':') > -1 ) {
				errorContainers = document.querySelectorAll(`[${ messagesAttribute }="${ requestedId }"]`);
			} else {

				resultItems = [];
				const state = getCartState();
				if ( state.status.cartStateSet ) {
					state.cart.items.forEach( element => {
						resultItems.push( element );
					});
				}

				const errorContainersSelectorArray = resultItems.map( element => `[${ messagesAttribute }="${ element.key }"]` );
	        	errorContainers = document.querySelectorAll(errorContainersSelectorArray.join(','));
			}

			if ( errorContainers.length > 0 ) {
				errorContainers.forEach( element => {
					element.innerHTML = messageBuilder([ errorMessage ]);
				});
			}
		}
    });
}

const addRequestHandler = ( requestState, subscribeToResult ) => {
	const initiator = requestState.info?.initiator;
	let formErrorContainers;

	if ( initiator instanceof HTMLFormElement ) {
		formErrorContainers = initiator.querySelectorAll(`[${ settings.computed.messagesAttribute }="form"]`);
		if ( formErrorContainers.length > 0 ) {
			formErrorContainers.forEach( element => {
				element.innerHTML = '';
			});
		}
	}

	subscribeToResult( requestState => {
		const { messageBuilder } = settings;
		const errorMessage = getRequestError( requestState );
		if ( errorMessage && formErrorContainers ) {
			formErrorContainers.forEach( element => {
				element.innerHTML = messageBuilder([ errorMessage ]);
			});
		}
	});
}

const getRequestError = (requestState) => {

	const { requestErrorText } = settings;

	if (requestState.responseData?.ok) return undefined;

	if ( 'responseData' in requestState ) {
		if ( 'description' in requestState.responseData.body ) {
			return { 
				type: MESSAGE_TYPES.ERROR,
				text: requestState.responseData.body.description,
				code: MESSAGE_CODES.SHOPIFY_ERROR,
				requestState
			}
		} 
		if ( 'message' in requestState.responseData.body ) {
			return { 
				type: MESSAGE_TYPES.ERROR,
				text: requestState.responseData.body.message,
				code: MESSAGE_CODES.SHOPIFY_ERROR,
				requestState
			}
		}
	} 

	return { 
		type: MESSAGE_TYPES.ERROR,
		text: requestErrorText,
		code: MESSAGE_CODES.REQUEST_ERROR,
		requestState
	}
}

const cartMessagesInit = () => {
	subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {
		const handlers = {};
		handlers[REQUEST_ADD] = addRequestHandler;
		handlers[REQUEST_CHANGE] = changeRequestHandler;

		if ( requestState.requestType in handlers ) {
			handlers[requestState.requestType](requestState, subscribeToResult);
		}
	});
};

export { cartMessagesInit }