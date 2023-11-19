---
title: Cart totals in the header
layout: docs-v2
---

# Cart totals in the header

<p class="lead" markdown="1">
Liquid Ajax Cart lets you display user cart data, such as the number of cart items or the total cart price, 
outside the [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) elements as well. 
Usually this information is located in the header of a webpage. 
</p>

## Display cart totals

The following Liquid code might be used to show the number of cart items and the total cart price:
{%- capture highlight_code -%}
{% raw %}
<span class="header__cart-quantity">
  {{ cart.item_count }}
</span>
<span class="header__cart-total">
  {{ cart.total_price | money_with_currency }}
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

However, those values are static and will update only after a page refresh.

## Ajaxify cart totals

To enable updates without requiring a page refresh, apply the [`data-ajax-cart-bind`](/v2/data-ajax-cart-bind/) attribute
to the elements and provide a property from the [`liquidAjaxCart.cart`](/v2/liquid-ajax-cart-cart/) object, that you want to display.
For displaying the number of cart items, use the `item_count` property, 
while for showing the cart total price, employ the `total_price` property.

The attribute supports formatters. In order to display price values, use the `money_with_currency` formatter.

Liquid Ajax Cart updates the content of the [`data-ajax-cart-bind`](/v2/data-ajax-cart-bind/) elements 
when the Shopify cart state is changed.

{%- capture highlight_code -%}
{% raw %}
<span data-ajax-cart-bind="item_count" class="header__cart-quantity">
  {{ cart.item_count }}
</span>
<span data-ajax-cart-bind="total_price | money_with_currency" class="header__cart-total">
  {{ cart.total_price | money_with_currency }}
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code highlight_lines="1,4" %}

## Hide, when the cart is empty

In order to show or hide the cart totals if the cart is empty or not empty,
use the [`js-ajax-cart-empty`](/v2/js-ajax-cart-empty/) and [`js-ajax-cart-not-empty`](/v2/js-ajax-cart-not-empty/)
CSS classes.