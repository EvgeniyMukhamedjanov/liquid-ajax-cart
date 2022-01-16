export type JSONValueType =
    | string
    | number
    | boolean
    | { [key: string]: JSONValueType }
    | Array<JSONValueType>
    | null;

export type JSONObjectType = {
    [x: string]: JSONValueType;
}

// todo: add URLtype to requestBody
export type RequestBodyType = JSONObjectType | FormData | undefined;

export type RequestStateInfoType = {
	initiator?: Element
}

export type RequestStateType = {
	requestType: string,
	endpoint: string,
	requestBody: RequestBodyType,
	info: RequestStateInfoType,
	responseData?: {
		ok: boolean,
		status: number,
		body: JSONObjectType
	},
	extraResponseData?: {
		ok: boolean,
		status: number,
		body: JSONObjectType
	},
	fetchError?: string
}

export type CartRequestOptionsType = {
	firstComplete?: (requestState: RequestStateType) => void,
	lastComplete?: (requestState: RequestStateType) => void,
	info?: RequestStateInfoType
}

export type RequestResultCallback = ( requestState: RequestStateType) => void;
export type RequestResultSubscriberType = ( resultCallback: RequestResultCallback ) => void;

export type RequestCallbackType = ( requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType ) => void;

export type LineItemType = {
	key: string,
	id: number,
	quantity: number,
	properties: {
		[key: string]: JSONValueType
	}
}

export type AppStateCartType = JSONObjectType & {
	attributes: {
		[key: string]: JSONValueType
	},
	items: Array<LineItemType>,
	item_count: number
} | null;
export type AppStateStatusType = {
	requestInProgress: boolean,
	cartStateSet: boolean
}
export type AppStateType = JSONObjectType & {
	status: AppStateStatusType,
	cart: AppStateCartType
}
export type StateSubscriberType = (state: AppStateType) => void;

export type FormattersObjectType = {
	[key: string]: (value: JSONValueType | undefined) => JSONValueType | undefined
}


export type MessageType = {
	type: string,
	text: string,
	code: string,
	requestState: RequestStateType
}


declare global {
    interface Window { 
    	liquidAjaxCart: any,
    	Shopify: any 
    }
}