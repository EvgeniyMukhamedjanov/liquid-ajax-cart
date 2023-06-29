---
title: data-ajax-cart-quantity-input
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-quantity-input

<p class="lead" markdown="1">
The attribute to ajaxify cart line item quantity inputs.
</p>

Add the `data-ajax-cart-quantity-input` attribute with a cart item index or a cart item key as the value to an input element to ajaxify it: 
once a user changes the input value, Liquid Ajax Cart will send a Shopify Cart API request to update the quantity.

The request will be sent on the input `change` event and on the `Enter` key `keydown` event.

If a user presses the `Esc` key within the input, its value will be reset to the current item quantity according to the [Cart state](/v2/docs/cart-state/) object.

The `data-ajax-cart-quantity-input` input fields become `readonly` when there is a Shopify Cart API request in progress (if the [Cart state](/v2/docs/cart-state/) `status.requestInProgress` property is `true`)

## Using a line item index

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    {% for item in cart.items %}
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      <div>
        Quantity:
        <!-- data-ajax-cart-quantity-input ajaxifies the line item quantity input -->
        <input data-ajax-cart-quantity-input="{{ forloop.index }}"
          name="updates[]" 
          value="{{ item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

        <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Using line item key

The line item key is supported also, but there were found unexpected behaviour of the `/add/change.js` endpoint handler in some cases. Test it carefully with your store before going live:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    {% for item in cart.items %}
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      <div>
        Quantity:
        <!-- data-ajax-cart-quantity-input ajaxifies the line item quantity input -->
        <input data-ajax-cart-quantity-input="{{ item.key }}"
          name="updates[]" 
          value="{{ item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

         <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Adding the "Plus" and "Minus buttons"

In order to attach "Plus" and "Minus" buttons to the `data-ajax-cart-quantity-input` input, use the [`ajax-cart-quantity`](/v2/docs/ajax-cart-quantity/) tag.
