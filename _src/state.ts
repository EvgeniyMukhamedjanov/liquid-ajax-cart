import { 
	AppStateType, 
	AppStateCartType, 
	AppStateStatusType, 
	StateSubscriberType, 
	RequestStateType, 
	JSONObjectType,
	JSONValueType,
	LineItemType } from './ts-types';

import { subscribeToCartAjaxRequests, subscribeToCartQueues, cartRequestGet, cartRequestUpdate, REQUEST_ADD } from './ajax-api';
import { settings } from './settings';

const subscribers: Array<StateSubscriberType> = [];
let cart: AppStateCartType = null;
let previousCart: AppStateCartType | undefined = undefined
let status: AppStateStatusType = {
	requestInProgress: false,
	cartStateSet: false,
};

function cartStateInit() {

	subscribeToCartQueues(inProgress => {
		status.requestInProgress = inProgress;
		notify(false);
	});

	subscribeToCartAjaxRequests(( requestState: RequestStateType, subscribeToResult ) => {		
		subscribeToResult( (requestState: RequestStateType) => {
			let newCart: AppStateCartType | undefined = undefined;
			if ( requestState.extraResponseData?.ok ) {
				newCart = cartStateFromObject(requestState.extraResponseData.body);
			}

			if ( !newCart && requestState.responseData?.ok ) {
				if ( requestState.requestType === REQUEST_ADD ) {
					cartRequestUpdate();
				} else {
					newCart = cartStateFromObject(requestState.responseData.body);
				}
			}
			if( newCart ) {
				previousCart = cart;
				cart = newCart;
				status.cartStateSet = true;
				notify(true);
			} else if ( newCart === null ) {
				console.error(`Liquid Ajax Cart: expected to receive the updated cart state but the object is not recognized. The request state:`, requestState);
			}
		})
	});

	const initialStateContainer = document.querySelector(`[${ settings.computed.initialStateAttribute }]`);
	if ( initialStateContainer ) {
		try {
			const initialState = JSON.parse(initialStateContainer.textContent);
			cart = cartStateFromObject(initialState);
			if ( cart === null ) {
				throw `JSON from ${ settings.computed.initialStateAttribute } script is not correct cart object`;
			} else {
				status.cartStateSet = true;
				notify(true);
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

function subscribeToCartStateUpdate( callback: StateSubscriberType ) {
	subscribers.push( callback );
}

function getCartState (): AppStateType {
	return {
		cart,
		status,
		previousCart
	}
}

const notify = ( isCartUpdated: boolean ) => {
	subscribers.forEach(( callback: StateSubscriberType ) => {
		try {
			callback(getCartState(), isCartUpdated);
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during a call of a cart state update subscriber');
			console.error(e);
		}
	})
}

export { cartStateInit, subscribeToCartStateUpdate, getCartState };