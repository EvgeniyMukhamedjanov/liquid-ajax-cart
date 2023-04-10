import {
  RequestStateType,
  RequestResultSubscriberType,
  LineItemType,
  MessageType
} from './ts-types';

import {subscribeToCartAjaxRequests, REQUEST_ADD, REQUEST_CHANGE} from './ajax-api';
import {getCartState} from './state';
import {settings} from './settings';

const MESSAGE_TYPES = {
  ERROR: 'error'
}

const MESSAGE_CODES = {
  LINE_ITEM_QUANTITY_ERROR: 'line_item_quantity_error',
  SHOPIFY_ERROR: 'shopify_error',
  REQUEST_ERROR: 'request_error',
}

function getRequestError(requestState: RequestStateType): MessageType | undefined {

  const {requestErrorText} = settings;

  if (requestState.responseData?.ok) return undefined;

  if ('responseData' in requestState) {
    if ('description' in requestState.responseData.body && requestState.responseData.body.description) {
      return {
        type: MESSAGE_TYPES.ERROR,
        text: <string>requestState.responseData.body.description,
        code: MESSAGE_CODES.SHOPIFY_ERROR,
        requestState
      }
    }
    if ('message' in requestState.responseData.body && requestState.responseData.body.message) {
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

const changeRequestContainers = (requestState: RequestStateType): NodeListOf<Element> => {
  let errorContainers: NodeListOf<Element>;

  const {messagesAttribute} = settings.computed;
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
    if (requestedLineNumber > 0 && state.status.cartStateSet) {
      const lineItemIndex = requestedLineNumber - 1;
      requestedId = state.cart.items[lineItemIndex]?.key;
    }
  }

  if (requestedId) {
    if (requestedId.indexOf(':') > -1) {
      errorContainers = document.querySelectorAll(`[${messagesAttribute}="${requestedId}"]`);
    } else if (state.status.cartStateSet) {
      errorContainers = document.querySelectorAll(
        state.cart.items.reduce((acc, element) => {
          if (element.key === requestedId || element.id === Number(requestedId)) {
            acc.push(`[${messagesAttribute}="${element.key}"]`);
          }
          return acc;
        }, []).join(',')
      );
    }
  }
  return errorContainers;
}

const addRequestContainers = (requestState: RequestStateType): NodeListOf<Element> => {
  let errorContainers: NodeListOf<Element>;
  const initiator: Element = requestState.info?.initiator;
  if (initiator instanceof HTMLFormElement) {
    errorContainers = initiator.querySelectorAll(`[${settings.computed.messagesAttribute}="form"]`);
  }
  return errorContainers;
}

const cartMessagesInit = () => {
  subscribeToCartAjaxRequests((requestState, subscribeToResult) => {
    let errorContainers: NodeListOf<Element>;

    if (requestState.requestType === REQUEST_ADD)
      errorContainers = addRequestContainers(requestState);
    else if (requestState.requestType === REQUEST_CHANGE)
      errorContainers = changeRequestContainers(requestState);

    if (errorContainers && errorContainers.length > 0) {
      errorContainers.forEach((element) => {
        element.innerHTML = '';
      });

      subscribeToResult((requestState) => {
        if (requestState.info.cancel) return;

        const {messageBuilder} = settings;
        const errorMessage = getRequestError(requestState);
        if (errorMessage) {
          errorContainers.forEach((element: Element) => {
            element.innerHTML = messageBuilder([errorMessage]);
          });
        }
      });
    }
  });
};

export {cartMessagesInit}