---
title: data-ajax-cart-quantity-input
layout: docs-v2
---

# data-ajax-cart-quantity-input

<p class="lead" markdown="1">
An attribute which ajaxifies cart item quantity input fields.
</p>

## How it works 

Add the `data-ajax-cart-quantity-input` attribute with a cart item index 
or a cart item key as the value to an input element.
When a user changes the input value or presses the `Enter` key within the input, 
Liquid Ajax Cart performs a Shopify Cart API `/cart/change.js` Ajax request to update the quantity.

If a user presses the `Esc` key within the input, its value will be reset to the current item quantity 
according to the [`liquidAjaxCart.cart`](/v2/liquid-ajax-cart-cart/) object.

## Using a line item index

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    <!-- Loop through cart items -->
    {% for line_item in cart.items %}
      {% assign line_item_index = forloop.index %}

      <div><a href="{{ line_item.url }}">{{ line_item.title | escape }}</a></div>
      <div>Price: {{ line_item.final_price | money }}</div>

      <div>
        Quantity:

        <!-- Item quantity input ajaxified by the data-ajax-cart-quantity-input -->
        <input data-ajax-cart-quantity-input="{{ line_item_index }}"
          name="updates[]" 
          value="{{ line_item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

        <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="16" %}

## Using line item key

The line item key is supported also, but there were found unexpected behaviour of the `/add/change.js` endpoint handler in some cases. Test it carefully with your store before going live:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    <!-- Loop through cart items -->
    {% for line_item in cart.items %}
      <div><a href="{{ line_item.url }}">{{ line_item.title | escape }}</a></div>
      <div>Price: {{ line_item.final_price | money }}</div>

      <div>
        Quantity:

        <!-- Item quantity input ajaxified by the data-ajax-cart-quantity-input -->
        <input data-ajax-cart-quantity-input="{{ line_item.key }}"
          name="updates[]" 
          value="{{ line_item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

        <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="14" %}

## Loading state

The `data-ajax-cart-quantity-input` input fields become `disabled` when there is a Shopify Cart API Ajax request in progress.

## "Plus" and "Minus buttons"

To attach "Plus" and "Minus" buttons to the `data-ajax-cart-quantity-input` input, 
use the [`<ajax-cart-quantity>`](/v2/ajax-cart-quantity/) custom tag.
