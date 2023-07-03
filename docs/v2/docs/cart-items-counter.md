---
title: Cart items counter
layout: docs-v2
disable_anchors: true
---

# Cart items counter

<p class="lead" markdown="1">
Liquid Ajax Cart lets you display user cart data, such as total cart items number or total cart price, 
outside the cart sections as well. Usually this information is located in the header. 
</p>

The following Liquid code might be used to show the total cart items number and total price:
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

But those are static values and will be refreshed only if a user reloads the page.

In order to make them update without page reload, apply the [`data-ajax-cart-bind-state`](/v2/docs/data-ajax-cart-bind-state/)
to the elements and provide a path to a [Cart state](/v2/docs/cart-state) property, that you want to display.
For the cart items number it will be `cart.item_count` value, for the cart price — `cart.total_price`.

The attribute supports formatters. In order to display price values, use the `money_with_currency` formatter.

Liquid Ajax Cart will replace the elements inner content with the actual values when the cart is updated by Ajax.
{%- capture highlight_code -%}
{% raw %}
<span data-ajax-cart-bind-state="cart.item_count" class="header__cart-quantity">
  {{ cart.item_count }}
</span>
<span data-ajax-cart-bind-state="cart.total_price | money_with_currency" class="header__cart-total">
  {{ cart.total_price | money_with_currency }}
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

In order to show or hide the counters depending on the fact that the cart is empty or not empty,
use the [`js-ajax-cart-empty`](/v2/docs/js-ajax-cart-empty/) and [`js-ajax-cart-not-empty`](/v2/docs/js-ajax-cart-not-empty/)
CSS classes.