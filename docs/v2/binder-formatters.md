---
title: binderFormatters
layout: docs-v2
---

# binderFormatters

<p class="lead" markdown="1">
A configuration parameter which lets you define custom formatters 
to use with the [`data-ajax-cart-bind`](/v2/data-ajax-cart-bind/) attribute.
</p>

## Code example

For example, if you use the `option_selection.js` Shopify asset and its `Shopify.formatMoney` function, 
you can specify your own formatter for money related values.
Use the [`conf`](/v2/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object to do this:

{%- capture highlight_code -%}
liquidAjaxCart.conf('binderFormatters', {
  'my_formatter': value => {
    // Don't change anything if the value is not a number
    if (typeof value !== 'number' && !(value instanceof Number)) {
      return value;
    }

    // Apply formatMoney function if it exists
    if (window.Shopify?.formatMoney) {
      return Shopify.formatMoney(value);
    }

    // Fallback to the "100 USD" format if there is no Shopify.formatMoney
    return `${ value.toFixed(2) } ${ window.liquidAjaxCart.cart.currency }`;
  }
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Applying the filter:
{%- capture highlight_code -%}
{% raw %}
<span data-ajax-cart-bind="total_price | my_formatter">
  {{ cart.total_price | money_with_currency }}
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}