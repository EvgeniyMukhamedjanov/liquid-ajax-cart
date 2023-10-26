import {FormattersObjectType, ConfigurationValue} from './ts-types';

import {cartDomBinderRerender} from './dom-binder';

type SettingsType = {
  binderFormatters: FormattersObjectType,
  requestErrorText: string,
  updateOnWindowFocus: boolean,
  quantityTagAllowZero: boolean,
  quantityTagDebounce: number
}
type SettingsKeysType = keyof SettingsType;

const settings: SettingsType = {
  binderFormatters: {},
  requestErrorText: 'There was an error while updating your cart. Please try again.',
  updateOnWindowFocus: true,
  quantityTagAllowZero: false,
  quantityTagDebounce: 300
}

function configureCart(property: string, value: ConfigurationValue) {
  if (property in settings) {
    (settings[property as SettingsKeysType] as ConfigurationValue) = value;
    if (property === 'binderFormatters') {
      cartDomBinderRerender();
    }
  } else {
    console.error(`Liquid Ajax Cart: unknown configuration parameter "${property}"`);
  }
}

export {settings, configureCart};
