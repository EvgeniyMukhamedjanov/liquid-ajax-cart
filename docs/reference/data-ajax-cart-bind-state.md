---
title: data-ajax-cart-bind-state
layout: page
---

# data-ajax-cart-bind-state

Add the `data-ajax-cart-bind-state` attribute to an HTML element, pass a [State object](/reference/state/) property as the attribute's value and Liquid Ajax Cart will display the state property's value within the HTML element and refresh it when the cart gets updated.

{% include code/data-ajax-cart-bind-state.html %}

The attribute supports formatters and there is the `money_with_currency` formatter out of the box. The `money_with_currency` uses the `Intl` JavaScript object and `Shopify.locale` value:

```javascript
return Intl.NumberFormat(window.Shopify.locale, { 
  style: 'currency',
  currency: state.cart.currency
}).format(value / 100);
```

If the `Shopify.locale` or the `Intl` are not available, the formatter will return the following:
```javascript
// 100.00 USD
return `${ (value / 100).toFixed(2) } ${ state.cart.currency }`;
```

You can define your own formatters using the [`stateBinderFormatters`](/reference/stateBinderFormatters/) configuration parameter.