import {JSONValueType, RequestBodyType} from '../ts-types';

import {
  cartRequestChange,
  cartRequestUpdate, EVENT_QUEUE_END,
  EVENT_QUEUE_START,
  EVENT_REQUEST_END,
  getProcessingStatus
} from '../ajax-api';
import {getCartState} from '../state';
import {findLineItemByCode} from '../helpers';
import {DATA_ATTR_PREFIX} from "../const";

type ValidElementType = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

const DATA_ATTR_PROPERTY_INPUT = `${DATA_ATTR_PREFIX}-property-input`

function consoleInputError(element: Element) {

  const attributeValue = element.getAttribute(DATA_ATTR_PROPERTY_INPUT);
  const nameValue = element.getAttribute('name');
  console.error(`Liquid Ajax Cart: the element [${DATA_ATTR_PROPERTY_INPUT}="${attributeValue}"]${nameValue ? `[name="${nameValue}"]` : ''} has wrong attributes.`);
}

function isValidElement(element: Element): boolean {

  if (!(element.hasAttribute(DATA_ATTR_PROPERTY_INPUT))) {
    return false;
  }

  return !((!(element instanceof HTMLInputElement) || element.type === 'hidden')
    && !(element instanceof HTMLTextAreaElement)
    && !(element instanceof HTMLSelectElement));
}

type InputDataType = {
  objectCode: string | undefined,
  propertyName: string | undefined,
  attributeValue: string | undefined
}

function getInputData(element: Element): InputDataType {
  const result: InputDataType = {
    objectCode: undefined,
    propertyName: undefined,
    attributeValue: undefined
  }

  if (!(element.hasAttribute(DATA_ATTR_PROPERTY_INPUT))) {
    return result;
  }

  let attributeValue = element.getAttribute(DATA_ATTR_PROPERTY_INPUT).trim();
  if (!attributeValue) {
    const nameValue = element.getAttribute('name').trim();
    if (nameValue) {
      attributeValue = nameValue;
    }
  }

  if (!attributeValue) {
    consoleInputError(element);
    return result;
  }
  result.attributeValue = attributeValue;

  if (attributeValue === 'note') {
    result.objectCode = 'note';
    return result;
  }

  let [objectCode, ...propertyName] = attributeValue.trim().split('[');
  if (!propertyName
    || propertyName.length !== 1
    || propertyName[0].length < 2
    || propertyName[0].indexOf(']') !== propertyName[0].length - 1) {
    consoleInputError(element);
    return result;
  }
  result.objectCode = objectCode;
  result.propertyName = propertyName[0].replace(']', '');

  return result;
}

function initEventListeners() {

  document.addEventListener('change', function (e) {
    changeHandler((e.target as HTMLElement), e);
  }, false);

  document.addEventListener("keydown", function (e) {
    const element = e.target as HTMLElement;
    if (e.key === "Enter") {
      if (!(element instanceof HTMLTextAreaElement) || e.ctrlKey) {
        changeHandler(element, e);
      }
    }

    if (e.key === "Escape") {
      escHandler(element);
    }
  }, false);
}

function processingHandler() {

  document.querySelectorAll(`[${DATA_ATTR_PROPERTY_INPUT}]`).forEach(element => {
    if (!isValidElement(element)) {
      return;
    }

    if (getProcessingStatus()) {
      (element as ValidElementType).disabled = true;
      return;
    }

    const {objectCode, propertyName, attributeValue} = getInputData(element);

    if (!objectCode) {
      return;
    }

    const state = getCartState();

    let propertyValue: JSONValueType | undefined = undefined;
    let doNotEnable = false;
    if (objectCode === 'note') {
      propertyValue = state.cart.note;
    } else if (objectCode === 'attributes') {
      propertyValue = state.cart.attributes[propertyName];
    } else {
      const [lineItem, objectCodeType] = findLineItemByCode(objectCode, state);
      if (lineItem) {
        propertyValue = lineItem.properties[propertyName];
      }
      if (lineItem === null) {
        console.error(`Liquid Ajax Cart: line item with ${objectCodeType}="${objectCode}" was not found when the [${DATA_ATTR_PROPERTY_INPUT}] element with "${attributeValue}" value tried to get updated from the State`);
        doNotEnable = true;
      }
    }

    if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
      (element as HTMLInputElement).checked = (element as HTMLInputElement).value === propertyValue;
    } else {
      if (typeof propertyValue !== 'string'
        && !(propertyValue instanceof String)
        && typeof propertyValue !== 'number'
        && !(propertyValue instanceof Number)) {
        if (Array.isArray(propertyValue) || <JSONValueType>propertyValue instanceof Object) {
          propertyValue = JSON.stringify(propertyValue);
          console.warn(`Liquid Ajax Cart: the ${DATA_ATTR_PROPERTY_INPUT} with the "${attributeValue}" value is bound to the ${propertyName} ${objectCode === 'attributes' ? 'attribute' : 'property'} that is not string or number: ${propertyValue}`);
        } else {
          propertyValue = '';
        }
      }
      (element as ValidElementType).value = <string>propertyValue;
    }

    if (!doNotEnable) {
      (element as ValidElementType).disabled = false;
    }

  });
}

function changeHandler(element: Element, e: Event) {

  if (!isValidElement(element)) {
    return;
  }

  if (e) {
    e.preventDefault(); // prevent form submission
  }

  (element as ValidElementType).blur();
  const state = getCartState();

  if (getProcessingStatus()) {
    return;
  }

  const {objectCode, propertyName, attributeValue} = getInputData(element);
  if (!objectCode) {
    return;
  }

  let newPropertyValue = (element as ValidElementType).value;
  if (element instanceof HTMLInputElement && element.type === 'checkbox' && !element.checked) {
    let negativeValueInput = <HTMLInputElement>document.querySelector(`input[type="hidden"][${DATA_ATTR_PROPERTY_INPUT}="${attributeValue}"]`);
    if (!negativeValueInput && (objectCode === 'note' || objectCode === 'attributes')) {
      negativeValueInput = <HTMLInputElement>document.querySelector(`input[type="hidden"][${DATA_ATTR_PROPERTY_INPUT}][name="${attributeValue}"]`);
    }
    if (negativeValueInput) {
      newPropertyValue = negativeValueInput.value;
    } else {
      newPropertyValue = '';
    }
  }

  if (objectCode === 'note') {
    const formData = new FormData();
    formData.set('note', newPropertyValue);
    cartRequestUpdate(formData, {info: {initiator: element}});
  } else if (objectCode === 'attributes') {
    const formData = new FormData();
    formData.set(`attributes[${propertyName}]`, newPropertyValue);
    cartRequestUpdate(formData, {info: {initiator: element}});
  } else {
    const [lineItem, objectCodeType] = findLineItemByCode(objectCode, state);

    if (lineItem === null) {
      console.error(`Liquid Ajax Cart: line item with ${objectCodeType}="${objectCode}" was not found when the [${DATA_ATTR_PROPERTY_INPUT}] element with "${attributeValue}" value tried to update the cart`);
    }

    if (!lineItem) {
      return
    }

    const newProperties = {
      ...lineItem.properties
    }
    newProperties[propertyName] = newPropertyValue;

    const formData = new FormData();
    let requestBody: RequestBodyType = formData;
    formData.set(objectCodeType, objectCode);
    formData.set('quantity', lineItem.quantity.toString());
    for (let p in newProperties) {
      const v = newProperties[p];
      if (typeof v === 'string' || v instanceof String) {
        formData.set(`properties[${p}]`, <string>newProperties[p]);
      } else {
        requestBody = {
          [objectCodeType]: objectCode,
          quantity: lineItem.quantity,
          properties: newProperties
        }
      }
    }
    cartRequestChange(requestBody, {info: {initiator: element}});
  }
}

function escHandler(element: Element) {
  if (!isValidElement(element)) {
    return;
  }

  if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
    return;
  }

  if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
    return;
  }

  const state = getCartState();

  const {objectCode, propertyName} = getInputData(element);
  if (!objectCode) {
    return;
  }

  let propertyValue: JSONValueType | undefined = undefined;
  if (objectCode === 'note') {
    propertyValue = state.cart.note;
  } else if (objectCode === 'attributes') {
    propertyValue = state.cart.attributes[propertyName];
  } else {
    const [lineItem] = findLineItemByCode(objectCode, state);
    if (lineItem) {
      propertyValue = lineItem.properties[propertyName];
    }
  }
  if (propertyValue !== undefined) {
    if (!propertyValue && typeof propertyValue !== 'string' && !(propertyValue instanceof String)) {
      propertyValue = '';
    }
    element.value = String(propertyValue);
  }

  (element as ValidElementType).blur();
}

function cartPropertyInputInit() {
  initEventListeners();

  document.addEventListener(EVENT_QUEUE_START, processingHandler);
  document.addEventListener(EVENT_REQUEST_END, processingHandler);
  document.addEventListener(EVENT_QUEUE_END, processingHandler);
  processingHandler();
}

export {cartPropertyInputInit}