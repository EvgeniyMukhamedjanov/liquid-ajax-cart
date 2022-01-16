import { 
	AppStateType, 
	AppStateCartType, 
	AppStateStatusType, 
	StateSubscriberType, 
	RequestStateType, 
	JSONObjectType,
	JSONValueType,
	LineItemType } from './ts-types';

import { subscribeToCartAjaxRequests, cartRequestGet, cartRequestUpdate, REQUEST_ADD } from './ajax-api';
import { settings } from './settings';

let queryCounter: number = 0;

const subscribers: Array<StateSubscriberType> = [];
let cart: AppStateCartType = null;
let status: AppStateStatusType = {
	requestInProgress: false,
	cartStateSet: false,
};

function cartStateInit() {

	subscribeToCartAjaxRequests(( requestState: RequestStateType, subscribeToResult ) => {		
		beforeRequestHandler( requestState );
		statusUpdate();

		subscribeToResult( (requestState: RequestStateType) => {
			afterRequestHandler( requestState );
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
			console.error(`Liquid Ajax Cart: can't parse cart JSON from the "${ settings.computed.initialStateAttribute }" script. A /cart.js request will be performed to receive the cart state`);
			console.error(e);
			cartRequestGet();
		}
	} else {
		cartRequestGet();
	}
}

function cartStateFromObject ( data: JSONObjectType ): AppStateCartType {
	// todo: improve checking
	const { attributes, items, item_count } = data;
	if ( attributes === undefined || attributes === null || typeof attributes !== 'object' ) {
		return null;
	}

	if ( typeof item_count !== 'number' && !( item_count instanceof Number )) {
		return null;
	}

	if ( !Array.isArray(items) ) {
		return null;
	}
	const newItems: LineItemType[] = [];
	for( let i = 0; i < (items as JSONValueType[]).length; i++ ) {
		const item = items[i] as ({ [key: string]: JSONValueType });
		if ( typeof item.id !== 'number' && !( item.id instanceof Number )) {
			return null;
		}
		if ( typeof item.key !== 'string' && !( item.key instanceof String )) {
			return null;
		}
		if ( typeof item.quantity !== 'number' && !( item.quantity instanceof Number )) {
			return null;
		}
		if ( !('properties' in item) ) {
			return null;
		}
		newItems.push({
			...item,
			id: (item.id as number),
			key: (item.key as string),
			quantity: (item.quantity as number),
			properties: (item.properties as ({ [key: string]: JSONValueType }))
		});
	}

	return {
		...data,
		attributes: (attributes as ({[key: string]: JSONValueType})),
		items: newItems,
		item_count: (item_count as number)
	}
}



function beforeRequestHandler( data: RequestStateType ) {
	queryCounter++;
}

function afterRequestHandler( data: RequestStateType ) {
	queryCounter--;
	let newCart: AppStateCartType | undefined = undefined;
	if ( 'responseData' in data && data.responseData.ok ) {
		if ( data.requestType === REQUEST_ADD ) {
			if ( 'extraResponseData' in data && data.extraResponseData.ok ) {
				newCart = cartStateFromObject(data.extraResponseData.body);
			} else {
				cartRequestUpdate();
			}
			
		} else {
			newCart = cartStateFromObject(data.responseData.body);
		}
	}
	if( newCart ) {
		cart = newCart;
	} else if ( newCart === null ) {
		console.error(`Liquid Ajax Cart: expected to receive the updated cart state but the object is not recognized. The request:`, data);
	}
}

const statusUpdate = () => {
	status.requestInProgress = queryCounter > 0;
	status.cartStateSet = cart !== null;
	notify();
}

function subscribeToCartStateUpdate( callback: StateSubscriberType ) {
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

function getCartState (): AppStateType {
	return {
		cart,
		status
	}
}

const notify = () => {
	subscribers.forEach(( callback: StateSubscriberType ) => {
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

export { cartStateInit, subscribeToCartStateUpdate, getCartState };