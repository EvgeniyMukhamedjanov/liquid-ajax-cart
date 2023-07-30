---
title: data-ajax-cart-bind
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-bind

<p class="lead" markdown="1">
The attribute displays a [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) object's property, 
such as cart total quantity or cart total price, 
outside the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements. 
Liquid Ajax Cart will update the displayed value if the cart is changed.
</p>

## How it works

Add the `data-ajax-cart-bind` attribute with the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) object's property, 
that you want to show, to any HTML element
 —
Liquid Ajax Cart will put the property value as the inner content of the HTML element
and update it if the property value is changed.

## Use cases

The most popular use cases are showing cart items number and cart total price in the site header.

### Cart total quantity

The cart total quantity is kept in the `item_count` property of the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) object.
Pass the `item_count` as the value for the `data-ajax-cart-bind` attribute.

{%- capture highlight_code -%}
{% raw %}
<span class="header__cart-quantity">
  (
  <span data-ajax-cart-bind="item_count">
    <!-- Cart item count appears here -->
  </span>
  )
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

The best practice is to use the `data-ajax-cart-bind` on top of Liquid expressions.
The liquid expression `{% raw %}{{ cart.item_count }}{% endraw %}` displays the amount
until Liquid Ajax Cart is loaded or if JavaScript is disabled.

{%- capture highlight_code -%}
{% raw %}
<span class="header__cart-quantity">
  (
  <span data-ajax-cart-bind="item_count">
    <!-- Cart item count appears here -->
    {{ cart.item_count }}
  </span>
  )
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

### Cart total price

The cart total price is kept in the `total_price` property of the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) object.
Pass the `total_price` as the value for the `data-ajax-cart-bind` attribute.
Use the `money_with_currency` formatter with money related properties.

{%- capture highlight_code -%}
{% raw %}
<span class="header__cart-total">
  (
  <span data-ajax-cart-bind="total_price | money_with_currency">
    <!-- Cart total price appears here -->
  </span>
  )
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

The best practice is to use the `data-ajax-cart-bind` on top of Liquid expressions.
The liquid expression `{% raw %}{{ cart.total_price | money_with_currency }}{% endraw %}` displays the amount
until Liquid Ajax Cart is loaded or if JavaScript is disabled.

{%- capture highlight_code -%}
{% raw %}
<span class="header__cart-total">
  (
  <span data-ajax-cart-bind="total_price | money_with_currency">
    <!-- Cart total price appears here -->
    {{ cart.total_price | money_with_currency }}
  </span>
  )
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

## Formatters

The attribute supports formatters and there is the `money_with_currency` formatter out of the box. 
The `money_with_currency` uses the `Intl` JavaScript object and `Shopify.locale` value:

{%- capture highlight_code -%}
return Intl.NumberFormat(window.Shopify.locale, {
  style: 'currency',
  currency: window.liquidAjaxCart.cart.currency
}).format(passedValue / 100);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

If the `Shopify.locale` or the `Intl` are not available, the formatter will return the following:

{%- capture highlight_code -%}
// 100.00 USD
return `${ (value / 100).toFixed(2) } ${ window.liquidAjaxCart.cart.currency }`;
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Use the [`binderFormatters`](/v2/docs/binder-formatters/) configuration parameter to define custom formatters.