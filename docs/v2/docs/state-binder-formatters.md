---
title: stateBinderFormatters
layout: docs-v2
disable_anchors: true
---

# stateBinderFormatters

<p class="lead" markdown="1">
The configuration parameter lets you define custom formatters to use with the [`data-ajax-cart-bind-state`](/v2/docs/data-ajax-cart-bind-state/) attribute.
</p>

For example, if you use the `option_selection.js` Shopify asset and its `Shopify.formatMoney` function, 
you can specify your own formatter for money related values.
Use the [`conf`](/v2/docs/liquid-ajax-cart-conf) method of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart) object to do this:

{%- capture highlight_code -%}
liquidAjaxCart.conf('stateBinderFormatters', {
  'my_formatter': value => {
    // Don't change anything if the value is not a number
    if ( typeof value !== 'number' && !(value instanceof Number)) {
      return value;
    }

    // Apply formatMoney function if it exists
    if (window.Shopify?.formatMoney) {
      return Shopify.formatMoney(value);
    }

    // Fallback to the "100 USD" format if there is no Shopify.formatMoney
    const state = getCartState();
    return `${ value.toFixed(2) } ${ state.cart.currency }`;
  }
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Applying the filter:
{%- capture highlight_code -%}
{% raw %}
<span data-ajax-cart-bind-state="cart.total_price | my_formatter">
  {{ cart.total_price | money_with_currency }}
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}