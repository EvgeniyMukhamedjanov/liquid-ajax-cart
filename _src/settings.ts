import {FormattersObjectType, ConfigurationValue, MutationsListType} from './ts-types';

import {cartDomBinderRerender} from './dom-binder';
import {cartMutationsRun} from "./mutations";

type SettingsType = {
  binderFormatters: FormattersObjectType,
  requestErrorText: string,
  updateOnWindowFocus: boolean,
  quantityTagAllowZero: boolean,
  quantityTagDebounce: number,
  mutations: MutationsListType
}
type SettingsKeysType = keyof SettingsType;

const settings: SettingsType = {
  binderFormatters: {},
  requestErrorText: 'There was an error while updating your cart. Please try again.',
  updateOnWindowFocus: true,
  quantityTagAllowZero: false,
  quantityTagDebounce: 300,
  mutations: []
}

function configureCart(property: string, value: ConfigurationValue) {
  if (property in settings) {
    (settings[property as SettingsKeysType] as ConfigurationValue) = value;
    if (window.liquidAjaxCart.init) {
      if (property === 'binderFormatters') {
        cartDomBinderRerender();
      }
      if (property === 'mutations') {
        cartMutationsRun();
      }
    }
  } else {
    console.error(`Liquid Ajax Cart: unknown configuration parameter "${property}"`);
  }
}

export {settings, configureCart};
