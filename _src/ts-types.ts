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
  initiator?: Element | "mutation",
  cancel?: boolean,
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
  } | null,
  extraResponseData?: {
    ok: boolean,
    status: number,
    body: JSONObjectType
  },
  fetchError?: string
}

export type CartRequestOptionsType = {
  firstCallback?: (requestState: RequestStateType) => void,
  lastCallback?: (requestState: RequestStateType) => void,
  info?: RequestStateInfoType,
  important?: boolean
}

export type EventQueueType = CustomEvent;
export type EventRequestStartType = CustomEvent<{
  requestState: RequestStateType
}>
export type EventRequestEndType = CustomEvent<{
  requestState: RequestStateType,
  cart?: AppStateCartType | undefined,
  previousCart?: AppStateCartType | undefined,
  sections?: Array<UpdatedSectionType>
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
  item_count: number,
  token?: string
} | null;

export type AppStateType = JSONObjectType & {
  cart: AppStateCartType,
  previousCart: AppStateCartType | undefined
}

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

export type MutationRequestType = {
  type?: string, // add, change, update, clear, get
  body?: RequestBodyType
}

export type MutationsListType = Array<() => void | {
  requests?: MutationRequestType[]
}>

declare global {
  interface Window {
    liquidAjaxCart: {
      conf: (property: string, value: ConfigurationValue) => void,
      get?: (options: CartRequestOptionsType | undefined) => void,
      add?: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      change?: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      update?: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      clear?: (body: RequestBodyType, options: CartRequestOptionsType | undefined) => void,
      cart?: AppStateCartType,
      processing?: boolean,
      init?: boolean
    }
    Shopify?: {
      locale?: String,
      routes?: {
        root: String
      }
    }
  }
}