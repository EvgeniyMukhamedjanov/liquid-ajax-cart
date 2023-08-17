import {JSONValueType, JSONObjectType, FormattersObjectType} from './ts-types';

import {getCartState} from './state';
import {settings} from './settings';
import {DATA_ATTR_PREFIX} from "./const";
import {EVENT_REQUEST_END_INTERNAL} from "./ajax-api";

type StateValueType = JSONValueType | undefined;

const DATA_ATTR_BIND_STATE = `${DATA_ATTR_PREFIX}-bind`;

function updateDOM() {
  const state = getCartState();
  if (state.cart) {
    document.querySelectorAll(`[${DATA_ATTR_BIND_STATE}]`).forEach((element: Element) => {
      const path = element.getAttribute(DATA_ATTR_BIND_STATE);
      element.textContent = computeValue(path);
    });
  }
}

function computeValue(str: string): string {
  const {binderFormatters} = settings;

  const [path, ...filters] = str.split('|');
  const state = <JSONObjectType>getCartState().cart;
  let value = getStateValueByString(path, state);
  filters.forEach(element => {
    const formatterName = element.trim();
    if (formatterName !== '') {
      if (typeof binderFormatters === 'object' && formatterName in binderFormatters) {
        value = binderFormatters[formatterName](value);
      } else if (formatterName in defaultFormatters) {
        value = defaultFormatters[formatterName](value);
      } else {
        console.warn(`Liquid Ajax Cart: the "${formatterName}" formatter is not found`);
      }
    }
  });
  if (typeof value === 'string' || value instanceof String || typeof value === 'number' || value instanceof Number) {
    return (<string | number>value).toString();
  }
  console.error(`Liquid Ajax Cart: the calculated value for the ${DATA_ATTR_BIND_STATE}="${str}" element must be string or number. But the value is`, value);
  return '';
}

function getStateValueByString(str: string, obj: JSONObjectType): StateValueType {
  const properties = str.split('.');
  const currentProperty = properties.shift().trim();
  if (currentProperty !== '' && currentProperty in obj && properties.length > 0) {
    return getStateValueByString(properties.join('.'), <JSONObjectType>obj[currentProperty])
  }
  return <StateValueType>obj[currentProperty];
}

const defaultFormatters: FormattersObjectType = {
  'money_with_currency': (value) => {
    const state = getCartState();

    if (typeof value !== 'number' && !(value instanceof Number)) {
      console.error(`Liquid Ajax Cart: the 'money_with_currency' formatter is not applied because the value is not a number. The value is `, value);
      return value;
    }

    const moneyValue = (value as number) / 100;

    if ('Intl' in window && window.Shopify?.locale) {
      return Intl.NumberFormat(<string>window.Shopify.locale, {
        style: 'currency',
        currency: <string>state.cart.currency
      }).format(moneyValue);
    }

    return `${moneyValue.toFixed(2)} ${state.cart.currency}`;
  }
}

function cartDomBinderRerender() {
  updateDOM();
}

function cartDomBinderInit() {
  document.addEventListener(EVENT_REQUEST_END_INTERNAL, updateDOM);
  updateDOM();
}

export {cartDomBinderInit, cartDomBinderRerender}