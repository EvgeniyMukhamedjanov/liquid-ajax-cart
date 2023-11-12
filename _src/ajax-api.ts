import {
  EventQueueType,
  EventRequestStartType,
  EventRequestEndType,
  RequestStateType,
  CartRequestOptionsType,
  JSONObjectType,
  RequestBodyType,
  RequestStateInfoType,
  JSONValueType,
} from './ts-types';

import {
  EVENT_PREFIX
} from './const';

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

const EVENT_QUEUE_START = `${EVENT_PREFIX}:queue-start`;
const EVENT_QUEUE_START_INTERNAL = `${EVENT_PREFIX}:queue-start-internal`;

const EVENT_QUEUE_EMPTY_INTERNAL = `${EVENT_PREFIX}:queue-empty-internal`;

const EVENT_QUEUE_END_INTERNAL = `${EVENT_PREFIX}:queue-end-internal`;
const EVENT_QUEUE_END = `${EVENT_PREFIX}:queue-end`;

const EVENT_REQUEST_START_INTERNAL = `${EVENT_PREFIX}:request-start-internal`;
const EVENT_REQUEST_START = `${EVENT_PREFIX}:request-start`;

const EVENT_REQUEST_END_INTERNAL = `${EVENT_PREFIX}:request-end-internal`;
const EVENT_REQUEST_END = `${EVENT_PREFIX}:request-end`;

const queues: QueueItemType[][] = [];

let processing = false;

function addToQueues(queueItem: QueueItemType) {
  if (!(queueItem.options?.important) || queues.length === 0) {
    const newLength = queues.push([queueItem]);
    if (newLength === 1) {
      setProcessingStatus(true);
      runQueues();
    }
    return;
  }
  queues[0].push(queueItem);
  return;
}

function runQueues() {
  if (queues.length === 1 && queues[0].length === 0) {
    const eventInternal: EventQueueType = new CustomEvent(EVENT_QUEUE_EMPTY_INTERNAL);
    document.dispatchEvent(eventInternal);
  }

  if (queues.length === 0) {
    setProcessingStatus(false);
    return;
  }

  if (queues[0].length === 0) {
    queues.shift();
    runQueues();
    return;
  }

  const {requestType, body, options} = queues[0][0];
  cartRequest(requestType, body, options, () => {
    queues[0].shift();
    runQueues();
  });
  return;
}

function setProcessingStatus(value: boolean) {
  processing = value
  const eventInternal: EventQueueType = new CustomEvent(processing ? EVENT_QUEUE_START_INTERNAL : EVENT_QUEUE_END_INTERNAL);
  document.dispatchEvent(eventInternal);

  const eventPublic: EventQueueType = new CustomEvent(processing ? EVENT_QUEUE_START : EVENT_QUEUE_END);
  document.dispatchEvent(eventPublic);
}

function cartRequest(requestType: string, body: RequestBodyType, options: CartRequestOptionsType, finalCallback: () => void) {
  const endpoint = getEndpoint(requestType);
  let requestBody: RequestBodyType = undefined;
  if (requestType !== REQUEST_GET) {
    requestBody = body || {};
  }
  const method: string = requestType === REQUEST_GET ? 'GET' : 'POST';
  const info: RequestStateInfoType = options.info || {};
  const requestState: RequestStateType = {
    requestType,
    endpoint,
    requestBody,
    info
  }
  const redundantSections: string[] = [];

  const eventInternal: EventRequestStartType = new CustomEvent(EVENT_REQUEST_START_INTERNAL, {
    detail: {
      requestState: {
        requestType,
        endpoint,
        info,
        requestBody
      }
    }
  });
  document.dispatchEvent(eventInternal);

  const eventPublic: EventRequestStartType = new CustomEvent(EVENT_REQUEST_START, {
    detail: {
      requestState: {
        requestType,
        endpoint,
        info,
        requestBody
      }
    }
  });
  document.dispatchEvent(eventPublic);

  if (info.cancel) {
    requestState.responseData = null;
    cartRequestFinally(options, finalCallback, requestState);
    return;
  }

  if (requestBody !== undefined) {
    let sectionsParam: JSONValueType = undefined;
    if (requestBody instanceof FormData || requestBody instanceof URLSearchParams) {
      if (requestBody.has('sections')) {
        sectionsParam = requestBody.get('sections').toString();
      }
    } else {
      sectionsParam = requestBody.sections;
    }
    if (typeof sectionsParam === 'string' || <JSONValueType>sectionsParam instanceof String || Array.isArray(sectionsParam)) {
      const allSections: string[] = [];
      if (Array.isArray(sectionsParam)) {
        allSections.push(...(sectionsParam as string[]));
      } else {
        allSections.push(...((sectionsParam as string).split(',')));
      }
      if (REQUEST_ADD === requestType) {
        // if it is an "add.js" request, it is better to get all sections html from a separate request
        // https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/issues/72
        redundantSections.push(...allSections.slice(0, 5));
      }
      if (allSections.length > 5) {
        redundantSections.push(...allSections.slice(5));
        const newSectionsParam = allSections.slice(0, 5).join(',');
        if (requestBody instanceof FormData || requestBody instanceof URLSearchParams) {
          requestBody.set('sections', newSectionsParam);
        } else {
          requestBody.sections = newSectionsParam;
        }
      }
    } else if (sectionsParam !== undefined && sectionsParam !== null) {
      console.error(`Liquid Ajax Cart: "sections" parameter in a Cart Ajax API request must be a string or an array. Now it is ${sectionsParam}`);
    }
  }

  const fetchPayload: FetchPayloadType = {
    method
  }
  if (requestType !== REQUEST_GET) {
    if (requestBody instanceof FormData || requestBody instanceof URLSearchParams) {
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
  ).then(response => {
    return response.json().then((responseBody: JSONObjectType) => {
      return {
        ok: response.ok,
        status: response.status,
        body: responseBody
      }
    });
  }).then(data => {

    requestState.responseData = data;

    if (!(requestState.responseData.ok) || (requestState.responseData.body.token && redundantSections.length === 0)) {
      return requestState;
    }

    return extraRequest(redundantSections).then(extraResponseData => {
      requestState.extraResponseData = extraResponseData;
      return requestState;
    })

  }).catch(error => {
    console.error('Liquid Ajax Cart: Error while performing cart Ajax request')
    console.error(error);
    requestState.responseData = null;
    requestState.fetchError = error;
  }).finally(() => {
    cartRequestFinally(options, finalCallback, requestState);
  });
}

function cartRequestFinally(
  options: CartRequestOptionsType,
  finalCallback: () => void | undefined,
  requestState: RequestStateType
) {
  if ('firstCallback' in options) {
    try {
      options.firstCallback(requestState);
    } catch (e) {
      console.error('Liquid Ajax Cart: Error in request "firstCallback" function');
      console.error(e);
    }
  }

  const detail = {
    requestState
  }

  const eventInternal: EventRequestEndType = new CustomEvent(EVENT_REQUEST_END_INTERNAL, {
    detail
  });
  document.dispatchEvent(eventInternal);

  const eventPublic: EventRequestEndType = new CustomEvent(EVENT_REQUEST_END, {
    detail
  });
  document.dispatchEvent(eventPublic);

  if ('lastCallback' in options) {
    try {
      options.lastCallback(requestState);
    } catch (e) {
      console.error('Liquid Ajax Cart: Error in request "lastCallback" function');
      console.error(e);
    }
  }

  finalCallback();
}

function extraRequest(sections: string[] = []): Promise<{ ok: boolean, status: number, body: JSONObjectType }> {
  const requestBody: JSONObjectType = {};
  if (sections.length > 0) {
    requestBody.sections = sections.slice(0, 5).join(',');
  }

  return fetch(getEndpoint(REQUEST_UPDATE), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  }).then(response => response.json().then(responseBody => {
    const data = {
      ok: response.ok,
      status: response.status,
      body: responseBody
    };
    if (sections.length < 6) {
      return data;
    }

    return extraRequest(sections.slice(5)).then(addData => {
      if (addData.ok && addData.body?.sections && typeof addData.body.sections === 'object') {
        if (!('sections' in data.body)) {
          data.body.sections = {};
        }
        data.body.sections = {...data.body.sections, ...addData.body.sections}
      }
      return data;
    })
  }));
}


function cartRequestGet(options: CartRequestOptionsType | undefined = {}): void {
  addToQueues({requestType: REQUEST_GET, body: undefined, options});
}

function cartRequestAdd(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}): void {
  addToQueues({requestType: REQUEST_ADD, body, options});
}

function cartRequestChange(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}): void {
  addToQueues({requestType: REQUEST_CHANGE, body, options});
}

function cartRequestUpdate(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}): void {
  addToQueues({requestType: REQUEST_UPDATE, body, options});
}

function cartRequestClear(body: RequestBodyType = {}, options: CartRequestOptionsType | undefined = {}): void {
  addToQueues({requestType: REQUEST_CLEAR, body, options});
}

function getEndpoint(requestType: string): string | undefined {
  switch (requestType) {
    case REQUEST_ADD:
      return `${window.Shopify?.routes?.root || '/'}cart/add.js`;

    case REQUEST_CHANGE:
      return `${window.Shopify?.routes?.root || '/'}cart/change.js`;

    case REQUEST_GET:
      return `${window.Shopify?.routes?.root || '/'}cart.js`;

    case REQUEST_CLEAR:
      return `${window.Shopify?.routes?.root || '/'}cart/clear.js`;

    case REQUEST_UPDATE:
      return `${window.Shopify?.routes?.root || '/'}cart/update.js`;

    default:
      return undefined;
  }
}

function getProcessingStatus() {
  return processing;
}

export {
  cartRequestAdd,
  cartRequestChange,
  cartRequestClear,
  cartRequestGet,
  cartRequestUpdate,
  getProcessingStatus,

  addToQueues,

  REQUEST_ADD,
  REQUEST_CHANGE,
  REQUEST_UPDATE,
  REQUEST_CLEAR,
  REQUEST_GET,

  EVENT_QUEUE_START_INTERNAL,
  EVENT_QUEUE_EMPTY_INTERNAL,
  EVENT_QUEUE_END_INTERNAL,
  EVENT_REQUEST_START_INTERNAL,
  EVENT_REQUEST_END_INTERNAL
}