import { 
	RequestCallbackType, 
	QueuesCallbackType,
	RequestStateType, 
	CartRequestOptionsType, 
	JSONObjectType,
	RequestBodyType,
	RequestStateInfoType,
	RequestResultCallback,
	JSONValueType
} from './ts-types';

type FetchPayloadType = {
	method: string,
	headers?: {
		[key: string]: string
	}
	body?: string | FormData
}

type QueueItemType = {
	requestType: string, 
	body: RequestBodyType, 
	options: CartRequestOptionsType
}

const REQUEST_ADD = 'add';
const REQUEST_CHANGE = 'change';
const REQUEST_UPDATE = 'update';
const REQUEST_CLEAR = 'clear';
const REQUEST_GET = 'get';

const requestSubscribers: RequestCallbackType[] = [];
const queuesSubscribers: QueuesCallbackType[] = [];
const queues: QueueItemType[][] = [];

function addToQueues(queueItem: QueueItemType) {
	if ( queueItem.options?.newQueue || queues.length === 0 ) {
		const newLength = queues.push([ queueItem ]);
		if (newLength === 1) {
			notifyQueuesSubscribers(true);
			runQueues();
		}
		return;
	}
	queues[0].push(queueItem);
	return;
}

function runQueues() {

	if (queues.length === 0) { 
		notifyQueuesSubscribers(false);
		return; 
	}

	if (queues[0].length === 0) {
		queues.shift();
		runQueues();
		return;
	}

	const { requestType, body, options } = queues[0][0];
	cartRequest(requestType, body, options, () => {
		queues[0].shift();
		runQueues();
	});
	return;
}

function notifyQueuesSubscribers(inProgress: boolean) {
	queuesSubscribers.forEach( callback => {
		try {
			callback(inProgress);
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during queues subscriber callback in ajax-api');
			console.error(e);
		}
	});
}

function cartRequest( requestType: string, body: RequestBodyType, options: CartRequestOptionsType, finalCallback: () => void | undefined = undefined ) {
	const endpoint = getEndpoint( requestType );
	let requestBody: RequestBodyType = undefined;
	if ( requestType !== REQUEST_GET ) {
		requestBody = body || {};
	}
	const method: string = requestType === REQUEST_GET ? 'GET' : 'POST';
	const info: RequestStateInfoType = options.info || {};
	const resultSubscribers: RequestResultCallback[] = 'firstComplete' in options ? [ options.firstComplete ] : [];
	const requestState: RequestStateType = {
		requestType,
		endpoint,
		requestBody,
		info
	}
	const redundandSections: string[] = [];

	requestSubscribers.forEach( callback => {
		try {
			callback({
				requestType,
				endpoint,
				info,
				requestBody
			}, ( resultCallback: RequestResultCallback ) => { resultSubscribers.push( resultCallback ) } );
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during Ajax request subscriber callback in ajax-api');
			console.error(e);
		}
	});

	if ( 'lastComplete' in options ) {
		resultSubscribers.push( options.lastComplete );
	}

	if (info.cancel) {
		cartRequestFinally(resultSubscribers, finalCallback, requestState);
		return;
	}

	if ( requestBody !== undefined ) {
		let sectionsParam: JSONValueType = undefined;
		if ( requestBody instanceof FormData || requestBody instanceof URLSearchParams ) {
			if ( requestBody.has('sections') ) {
				sectionsParam = requestBody.get('sections').toString();
			}
		} else {
			sectionsParam = requestBody.sections;
		}
		if ( typeof sectionsParam === 'string' || <JSONValueType>sectionsParam instanceof String || Array.isArray(sectionsParam) ) {
			const allSections: string[] = [];
			if ( Array.isArray(sectionsParam) ) {
				allSections.push( ...(sectionsParam as string[]) );
			} else {
				allSections.push( ...((sectionsParam as string).split(',')) ); 
			}
			if ( allSections.length > 5 ) {
				redundandSections.push( ...allSections.slice(5) );
				const newSectionsParam = allSections.slice(0, 5).join(',');
				if ( requestBody instanceof FormData || requestBody instanceof URLSearchParams ) {
					requestBody.set('sections', newSectionsParam);
				} else {
					requestBody.sections = newSectionsParam;
				}
			}
		} else if ( sectionsParam !== undefined && sectionsParam !== null ) {
			console.error(`Liquid Ajax Cart: "sections" parameter in a Cart Ajax API request must be a string or an array. Now it is ${ sectionsParam }`);
		}
	}

	const fetchPayload: FetchPayloadType = {
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
		return response.json().then( (responseBody: JSONObjectType) => {
			return {
				ok: response.ok,
				status: response.status,
				body: responseBody
			}
		});
	}).then( data => {

		requestState.responseData = data;

		if (( REQUEST_ADD !== requestType && redundandSections.length === 0 ) || !(requestState.responseData.ok)) {
			return requestState;
		}

		return extraRequest( redundandSections ).then( extraResponseData => {
			requestState.extraResponseData = extraResponseData;
			return requestState;
		})

	}).catch( error => {
		console.error('Liquid Ajax Cart: Error while performing cart Ajax request')
		console.error(error);
		requestState.fetchError = error;
		// throw requestState;
	}).finally(() => {
		cartRequestFinally(resultSubscribers, finalCallback, requestState);
	});
}

function cartRequestFinally(
	resultSubscribers: RequestResultCallback[], 
	finalCallback: () => void | undefined, 
	requestState: RequestStateType
) {
	resultSubscribers.forEach( callback => {
		try {
			callback(requestState);
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during Ajax request result callback in ajax-api');
			console.error(e);
		}
	});
	if (finalCallback) {
		try {
			finalCallback();
		} catch (e) {
			console.error('Liquid Ajax Cart: Error during Ajax request final internal callback in ajax-api');
			console.error(e);
		}
	}
}

function extraRequest ( sections: string[] = [] ): Promise<{ ok:boolean, status:number, body:JSONObjectType }> {
	const requestBody: JSONObjectType = {};
	if ( sections.length > 0 ) {
		requestBody.sections = sections.slice(0, 5).join(',');
	}
	let result = undefined;
	return fetch( getEndpoint( REQUEST_UPDATE ), {
		method: 'POST',
		headers: {
	    	'Content-Type': 'application/json'
	  	},
	  	body: JSON.stringify(requestBody)
	}).then( response => response.json().then( responseBody => {
		const data = {
			ok: response.ok,
			status: response.status,
			body: responseBody
		};
		if ( sections.length < 6 ) {
			return data;
		}

		return extraRequest( sections.slice(5) ).then( addData => {
			if ( addData.ok && addData.body?.sections && typeof addData.body.sections === 'object' ) {
				if ( !('sections' in data.body) ) {
					data.body.sections = {};
				}
				data.body.sections = { ...data.body.sections, ...addData.body.sections }
			}
			return data;
		})
	}));
}


function cartRequestGet ( options: CartRequestOptionsType | undefined = {} ): void {
	addToQueues({ requestType: REQUEST_GET, body: undefined, options });
}

function cartRequestAdd( body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {} ): void {
	addToQueues({ requestType: REQUEST_ADD, body, options });
}

function cartRequestChange( body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {} ): void {
	addToQueues({ requestType: REQUEST_CHANGE, body, options });
}

function cartRequestUpdate( body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {} ): void {
	addToQueues({ requestType: REQUEST_UPDATE, body, options });
}

function cartRequestClear( body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {} ): void {
	addToQueues({ requestType: REQUEST_CLEAR, body, options });
}

function subscribeToCartAjaxRequests( callback: RequestCallbackType ): void {
	requestSubscribers.push( callback );
}

function subscribeToCartQueues( callback: QueuesCallbackType ): void {
	queuesSubscribers.push( callback );
}

function getEndpoint ( requestType: string ): string | undefined {
	switch ( requestType ) {
		case REQUEST_ADD:
			return `${ window.Shopify?.routes?.root || '/' }cart/add.js`;
			break;

		case REQUEST_CHANGE:
			return `${ window.Shopify?.routes?.root || '/' }cart/change.js`;
			break;

		case REQUEST_GET:
			return `${ window.Shopify?.routes?.root || '/' }cart.js`;
			break;

		case REQUEST_CLEAR:
			return `${ window.Shopify?.routes?.root || '/' }cart/clear.js`;
			break;

		case REQUEST_UPDATE:
			return `${ window.Shopify?.routes?.root || '/' }cart/update.js`;
			break;

		default:
			return undefined;
	}
	return undefined;
}

export { 
	cartRequestAdd, 
	cartRequestChange, 
	cartRequestClear, 
	cartRequestGet, 
	cartRequestUpdate, 
	subscribeToCartAjaxRequests, 
	subscribeToCartQueues,
	REQUEST_ADD,
	REQUEST_CHANGE
}