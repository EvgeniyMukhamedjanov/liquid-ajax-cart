---
title: Cart totals in the header
layout: docs-v2
disable_anchors: true
---

# Cart totals in the header

<p class="lead" markdown="1">
Liquid Ajax Cart lets you display user cart data, such as total cart items number or total cart price, 
outside the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements as well. Usually this information is located in the header. 
</p>

## Display cart totals

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

But those values are static and will be updated only if a user reloads the page.

## Ajaxify cart totals

In order to make them updatable without page refresh, apply the [`data-ajax-cart-bind-state`](/v2/docs/data-ajax-cart-bind-state/)
to the elements and provide a path to a [Cart state](/v2/docs/cart-state/) property, that you want to display.
For the cart items number it will be `cart.item_count` value, for the cart price — `cart.total_price`.

The attribute supports formatters. In order to display price values, use the `money_with_currency` formatter.

Liquid Ajax Cart will replace the elements inner content with the actual values when the cart content is changed.
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

## Hide, when the cart is empty

In order to show or hide the cart totals if the cart is empty or not empty,
use the [`js-ajax-cart-empty`](/v2/docs/js-ajax-cart-empty/) and [`js-ajax-cart-not-empty`](/v2/docs/js-ajax-cart-not-empty/)
CSS classes.