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

export type RequestBodyType = JSONObjectType | FormData | URLSearchParams | undefined;

export type RequestStateInfoType = {
  initiator?: Element,
  cancel?: boolean
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
  info?: RequestStateInfoType,
  important?: boolean
}

export type RequestResultCallback = (requestState: RequestStateType) => void;
export type RequestResultSubscriberType = (resultCallback: RequestResultCallback) => void;

// export type RequestCallbackType = (requestState: RequestStateType, subscribeToResult: RequestResultSubscriberType) => void;
// export type QueuesCallbackType = (inProgress: boolean) => void;

export type EventQueuesType = CustomEvent<{inProgress: boolean}>;
export type EventRequestType = CustomEvent<{
  requestState: RequestStateType,
  onResult: RequestResultSubscriberType
}>

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
  cart: AppStateCartType,
  previousCart: AppStateCartType | undefined
}
export type EventStateType = CustomEvent<{
  state: AppStateType,
  isCartUpdated: boolean
}>;

export type ConfigurationValue =
  | string
  | boolean;

export type FormattersObjectType = {
  [key: string]: (value: JSONValueType | undefined) => JSONValueType | undefined
}

export type UpdatedSectionType = {
  id: string,
  elements: Array<Element>
}
export type EventSectionsType = CustomEvent<Array<UpdatedSectionType>>;

declare global {
  interface Window {
    liquidAjaxCart: {
      conf: (property: string, value: ConfigurationValue) => void,
      get: (options: CartRequestOptionsType | undefined) => void,
      add: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      change: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      update: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      clear: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      state: AppStateType,
    }
    Shopify?: {
      locale?: String,
      routes?: {
        root: String
      }
    }
  }
}