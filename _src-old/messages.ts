import {
  RequestStateType,
  EventRequestStartType, EventRequestEndType
} from './ts-types';

import {EVENT_REQUEST_END_INTERNAL, EVENT_REQUEST_START_INTERNAL, REQUEST_ADD, REQUEST_CHANGE} from './ajax-api';
import {getCartState} from './state';
import {settings} from './settings';
import {DATA_ATTR_PREFIX} from "./const";
import {HTMLProductFormElement} from "./controls/product-form-element";

const DATA_ATTR_ERRORS = `${DATA_ATTR_PREFIX}-errors`;

function getRequestError(requestState: RequestStateType): string {
  const {requestErrorText} = settings;
  if (requestState.responseData?.ok) return '';

  const errors = <string | Record<string, string[]> | undefined>requestState.responseData?.body?.errors
    || <string | Record<string, string[]> | undefined>requestState.responseData?.body?.description
    || <string | undefined>requestState.responseData?.body?.message;

  if (!errors) return requestErrorText;

  if (typeof errors === 'string') {
    return errors;
  }

  if (typeof errors === 'object') {
    return Object.values(errors).map((e) => e.join(', ')).join('; ');
  }

  return requestErrorText;
}

const changeRequestContainers = (requestState: RequestStateType): Array<Element> => {
  const errorContainers: Array<Element> = [];

  const state = getCartState();

  let requestedId: string,
    requestedLine: string;

  if (requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams) {
    if (requestState.requestBody.has('line')) {
      requestedLine = requestState.requestBody.get('line').toString();
    }
    if (requestState.requestBody.has('id')) {
      requestedId = requestState.requestBody.get('id').toString();
    }
  } else {
    if ('line' in requestState.requestBody) {
      requestedLine = String(requestState.requestBody.line);
    }
    if ('id' in requestState.requestBody) {
      requestedId = String(requestState.requestBody.id);
    }
  }

  if (requestedLine) {
    const requestedLineNumber = Number(requestedLine);
    if (requestedLineNumber > 0) {
      const lineItemIndex = requestedLineNumber - 1;
      requestedId = state.cart.items[lineItemIndex]?.key;
    }
  }

  if (requestedId) {
    if (requestedId.indexOf(':') > -1) {
      errorContainers.push(...Array.from(document.querySelectorAll(`[${DATA_ATTR_ERRORS}="${requestedId}"]`)));
    } else {
      errorContainers.push(...Array.from(document.querySelectorAll(
        state.cart.items.reduce((acc, element) => {
          if (element.key === requestedId || element.id === Number(requestedId)) {
            acc.push(`[${DATA_ATTR_ERRORS}="${element.key}"]`);
          }
          return acc;
        }, []).join(',')
      )));
    }
  }
  return errorContainers;
}

const addRequestContainers = (requestState: RequestStateType): Array<Element> => {
  const initiator = requestState.info?.initiator;
  if (initiator instanceof HTMLProductFormElement) {
    return Array.from(initiator.querySelectorAll(`[${DATA_ATTR_ERRORS}="form"]`));
  }
  return [];
}

const getContainers = (requestState: RequestStateType): Array<Element> => {
  switch (requestState.requestType) {
    case REQUEST_ADD:
      return addRequestContainers(requestState);
    case REQUEST_CHANGE:
      return changeRequestContainers(requestState);
    default:
      return [];
  }
}

const cartMessagesInit = () => {
  document.addEventListener(EVENT_REQUEST_START_INTERNAL, (event: EventRequestStartType) => {
    const {requestState} = event.detail;
    getContainers(requestState).forEach((element) => {
      element.textContent = '';
    });
  });

  document.addEventListener(EVENT_REQUEST_END_INTERNAL, (event: EventRequestEndType) => {
    const {requestState} = event.detail;
    if (requestState.info.cancel) return;

    const containers = getContainers(requestState);

    if (containers.length === 0) return;

    const errorMessage = getRequestError(requestState);
    if (!errorMessage) return;

    containers.forEach((element: Element) => {
      element.textContent = errorMessage;
    });
  });
};

export {cartMessagesInit}