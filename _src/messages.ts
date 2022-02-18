import { 
	RequestStateType, 
	RequestResultSubscriberType,
	LineItemType,
	MessageType
} from './ts-types';

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

const changeRequestHandler = ( requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType ) => {

	subscribeToResult( ( requestState: RequestStateType ) => {
		const { messagesAttribute } = settings.computed;
		const { lineItemQuantityErrorText, messageBuilder } = settings;

		if (requestState.info.cancel) return;

		const state = getCartState();
		const itemQuantityErrors: LineItemType[] = [];
		let requestedId: string, 
			requestedLine: string, 
			requestedQuantity: number = 1, 
			lineItemIndex: number, 
			requestedIdItems: LineItemType[] = [],
			errorContainers: NodeListOf<Element>, 
			resultItems: LineItemType[] = [];

		if ( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) {
			if (requestState.requestBody.has('line')) {
				requestedLine = requestState.requestBody.get('line').toString();
			}
			if (requestState.requestBody.has('id')) {
				requestedId = requestState.requestBody.get('id').toString();
			}
	    } else {
	    	if('line' in requestState.requestBody) {
				requestedLine = String(requestState.requestBody.line);
			}
			if('id' in requestState.requestBody) {
				requestedId = String(requestState.requestBody.id);
			}
		}

		if ( requestedLine ) {
			const requestedLineNumber = Number(requestedLine);
			if ( requestedLineNumber > 0 && state.status.cartStateSet ) {
				lineItemIndex = requestedLineNumber - 1;
				requestedId = state.cart.items[lineItemIndex]?.key;
			}
		}

		if ( requestedId ) {
			if ( requestedId.indexOf(':') > -1 ) {
				errorContainers = document.querySelectorAll(`[${ messagesAttribute }="${ requestedId }"]`);
			} else if ( state.status.cartStateSet ) {
	        	errorContainers = document.querySelectorAll(
	        		state.cart.items.reduce(( acc, element ) => {
	        			if ( element.key === requestedId || element.id === Number(requestedId) ) {
		        			acc.push(`[${ messagesAttribute }="${ element.key }"]`);
		        		}
		        		return acc;
	        		}, []).join(',')
	        	);
			}

			if ( errorContainers.length > 0 ) {
				errorContainers.forEach( element => {
					element.innerHTML = '';
				});
			}
		}

		if ( requestState.responseData?.ok ) {
			if (!state.previousCart) return;

			if (( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) && requestState.requestBody.has('quantity')) {
				requestedQuantity = Number(requestState.requestBody.get('quantity').toString());
			} else if('quantity' in requestState.requestBody) {
				requestedQuantity = Number(requestState.requestBody.quantity);
			}

			if ( requestedId ) {
				resultItems = (requestState.responseData.body.items as LineItemType[]).reduce(( acc: LineItemType[], element: LineItemType ) => {
					if (( element.key === requestedId || element.id == Number(requestedId) ) ) {
						acc.push(element);
					}
					return acc;
				}, []);
			}

			resultItems.forEach((element: LineItemType) => {
				if ( !isNaN(requestedQuantity) && element.quantity < requestedQuantity && state.previousCart.item_count === requestState.responseData.body.item_count ) {
					errorContainers.forEach((errorContainersItem: Element) => {
						if (errorContainersItem.getAttribute(messagesAttribute) === element.key) {
							errorContainersItem.innerHTML = messageBuilder([{
								type: MESSAGE_TYPES.ERROR,
								text: lineItemQuantityErrorText,
								code: MESSAGE_CODES.LINE_ITEM_QUANTITY_ERROR,
								requestState
							}]);
						}
					})
				}
			});
		} else {
			const errorMessage = getRequestError( requestState );

			if ( errorContainers && errorContainers.length > 0 ) {
				errorContainers.forEach( element => {
					element.innerHTML = messageBuilder([ errorMessage ]);
				});
			}
		}
    });
}

const addRequestHandler = ( requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType ) => {
	const initiator: Element = requestState.info?.initiator;
	let formErrorContainers: NodeListOf<Element>;

	if ( initiator instanceof HTMLFormElement ) {
		formErrorContainers = initiator.querySelectorAll(`[${ settings.computed.messagesAttribute }="form"]`);
		if ( formErrorContainers.length > 0 ) {
			formErrorContainers.forEach(( element: Element ) => {
				element.innerHTML = '';
			});
		}
	}

	subscribeToResult(( requestState: RequestStateType ) => {
		if (requestState.info.cancel) return;
		
		const { messageBuilder } = settings;
		const errorMessage = getRequestError( requestState );
		if ( errorMessage && formErrorContainers ) {
			formErrorContainers.forEach(( element: Element ) => {
				element.innerHTML = messageBuilder([ errorMessage ]);
			});
		}
	});
}

function getRequestError( requestState: RequestStateType ): MessageType | undefined {

	const { requestErrorText } = settings;

	if (requestState.responseData?.ok) return undefined;

	if ( 'responseData' in requestState ) {
		if ( 'description' in requestState.responseData.body ) {
			return { 
				type: MESSAGE_TYPES.ERROR,
				text: <string>requestState.responseData.body.description,
				code: MESSAGE_CODES.SHOPIFY_ERROR,
				requestState
			}
		} 
		if ( 'message' in requestState.responseData.body ) {
			return { 
				type: MESSAGE_TYPES.ERROR,
				text: <string>requestState.responseData.body.message,
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
	subscribeToCartAjaxRequests(( requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType ) => {

		interface HandlersInterface {
			[key: string]: (requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType) => void
		}
		const handlers: HandlersInterface = {};
		handlers[REQUEST_ADD] = addRequestHandler;
		handlers[REQUEST_CHANGE] = changeRequestHandler;

		if ( requestState.requestType in handlers ) {
			handlers[requestState.requestType](requestState, subscribeToResult);
		}
	});
};

export { cartMessagesInit }