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
	const { messagesAttribute } = settings.computed;
	let requestedId: string, 
		requestedLine: string, 
		requestedQuantity: number, 
		lineItemIndex: number, 
		requestedIdItems: LineItemType[] = [], 
		errorContainers: NodeListOf<Element>, 
		itemCountBefore: number;
	const state = getCartState();

	if ( requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams ) {
		if (requestState.requestBody.has('line')) {
			requestedLine = requestState.requestBody.get('line').toString();
		}
		if (requestState.requestBody.has('id')) {
			requestedId = requestState.requestBody.get('id').toString();
		}
		if (requestState.requestBody.has('quantity')) {
			requestedQuantity = Number(requestState.requestBody.get('quantity').toString());
		}
    } else {
    	if('line' in requestState.requestBody) {
			requestedLine = String(requestState.requestBody.line);
		}
		if('id' in requestState.requestBody) {
			requestedId = String(requestState.requestBody.id);
		}
		if('quantity' in requestState.requestBody) {
			requestedQuantity = Number(requestState.requestBody.quantity);
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
		if ( state.status.cartStateSet ) {
			state.cart.items.forEach( (element: LineItemType) => {
				if ( element.key === requestedId || element.id === Number(requestedId) ) {
					requestedIdItems.push( element );
				}
			});

			itemCountBefore = state.cart.item_count;
		}

		if ( requestedId.indexOf(':') > -1 ) {
			if ( requestedLine === undefined && requestedIdItems.length === 1) {
				requestedLine = requestedIdItems[0].key;
			}
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

	subscribeToResult( ( requestState: RequestStateType ) => {
		const { lineItemQuantityErrorText, messageBuilder } = settings;
		const { messagesAttribute } = settings.computed;
		let resultItems: LineItemType[] = [];
		const itemQuantityErrors: LineItemType[] = [];
		let errorContainers: NodeListOf<Element>;

		if ( requestState.responseData?.ok ) {
			if ( requestedId ) {
				resultItems = (requestState.responseData.body.items as LineItemType[]).reduce(( acc: LineItemType[], element: LineItemType ) => {
					if (( element.key === requestedId || element.id == Number(requestedId) ) ) {
						acc.push(element);
					}
					return acc;
				}, []);
			}


			resultItems.forEach( (element: LineItemType) => {
				if ( !isNaN(requestedQuantity) && element.quantity < requestedQuantity && itemCountBefore === requestState.responseData.body.item_count ) {
					itemQuantityErrors.push( element );
				}
			});

			const errorContainersSelectorArray: string[] = itemQuantityErrors.reduce((acc: string[], element: LineItemType) => {
				acc.push(`[${ messagesAttribute }="${ element.key }"]`);
        		return acc;
        	}, []);

			if ( errorContainersSelectorArray.length > 0 ) {
				errorContainers = document.querySelectorAll( errorContainersSelectorArray.join(',') );
			}

			if ( errorContainers && errorContainers.length > 0 ) {
				errorContainers.forEach( (element: Element) => {
					element.innerHTML = messageBuilder([{
						type: MESSAGE_TYPES.ERROR,
						text: lineItemQuantityErrorText,
						code: MESSAGE_CODES.LINE_ITEM_QUANTITY_ERROR,
						requestState
					}]);
				});
			}
		} else {
			const errorMessage = getRequestError( requestState );
			if ( requestedId ) {
				if ( requestedId.indexOf(':') > -1 ) {
					errorContainers = document.querySelectorAll(`[${ messagesAttribute }="${ requestedId }"]`);
				} else {

					resultItems = [];
					const state = getCartState();
					if ( state.status.cartStateSet ) {
						state.cart.items.forEach( (element: LineItemType) => {
							if (element.key === requestedId || element.id === Number(requestedId)) {
								resultItems.push( element );
							}
						});
					}

					const errorContainersSelectorArray = resultItems.map( element => `[${ messagesAttribute }="${ element.key }"]` );
		        	errorContainers = document.querySelectorAll(errorContainersSelectorArray.join(','));
				}
			}

			if ( errorContainers.length > 0 ) {
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