---
title: ajax-cart-quantity
layout: docs-v2
---

# ajax-cart-quantity

<p class="lead" markdown="1">
A custom tag which binds "Plus" and "Minus" buttons 
to a [`data-ajax-cart-quantity-input`](/v2/data-ajax-cart-quantity-input/) cart item quantity input.  
</p>

## Setup

Let's say you have a cart item quantity input, 
ajaxified using the [`data-ajax-cart-quantity-input`](/v2/data-ajax-cart-quantity-input/) attribute:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>
  
    <div class="my-cart__items" data-ajax-cart-section-scroll>
      {% for line_item in cart.items %}
        {% assign line_item_index = forloop.index %}
  
        <div><a href="{{ line_item.url }}">{{ line_item.title | escape }}</a></div>
        <div>Price: {{ line_item.final_price | money }}</div>

        <div>
          Quantity:
          <!-- Item quantity input ajaxified by the "data-ajax-cart-quantity-input" attribute -->
          <input data-ajax-cart-quantity-input="{{ line_item_index }}"
            name="updates[]" 
            value="{{ item.quantity }}" 
            type="number" 
            form="my-ajax-cart-form" />

        <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

In order to attach "Plus" and "Minus" buttons, add elements for them next to the input field with the
`data-ajax-cart-quantity-plus` and `data-ajax-cart-quantity-minus` attributes
and wrap them all with the `<ajax-cart-quantity>` tag:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>

    <div class="my-cart__items" data-ajax-cart-section-scroll>
      {% for line_item in cart.items %}
        {% assign line_item_index = forloop.index %}
  
        <div><a href="{{ line_item.url }}">{{ line_item.title | escape }}</a></div>
        <div>Price: {{ line_item.final_price | money }}</div>

        <div>
          Quantity:
          <ajax-cart-quantity>
            <a data-ajax-cart-quantity-minus
              href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
              Minus one 
            </a>

            <!-- Item quantity input ajaxified by the "data-ajax-cart-quantity-input" attribute -->
            <input data-ajax-cart-quantity-input="{{ line_item_index }}"
              name="updates[]" 
              value="{{ item.quantity }}" 
              type="number" 
              form="my-ajax-cart-form" />

            <a data-ajax-cart-quantity-plus
              href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
              Plus one 
            </a>
          </ajax-cart-quantity>

        <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

The `<ajax-cart-quantity>` custom tag subscribes to the `click` event of the `data-ajax-cart-quantity-minus` and `data-ajax-cart-quantity-plus` elements.
When the event is fired, the `<ajax-cart-quantity>` adjusts the [`data-ajax-cart-quantity-input`](/v2/data-ajax-cart-quantity-input/) input value
and triggers the `change` event on the input, which in turn makes Liquid Ajax Cart perform a Shopify Cart API Ajax request to update the quantity
and re-render the [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) elements.

The `href` attribute isn't necessary for the buttons. It is there to make the buttons work without JavaScript.

## Debounce — 300ms

The `<ajax-cart-quantity>` custom tag doesn't trigger the `change` event 
at the [`data-ajax-cart-quantity-input`](/v2/data-ajax-cart-quantity-input/) element immediately when a button "Plus" or "Minus" is clicked.
When a user clicks the button, the `<ajax-cart-quantity>` just starts a timer for 300 milliseconds.

If the user doesn't click the same button again within the 300 ms, the `<ajax-cart-quantity>` triggers the `change` event.

Otherwise, if the user clicks the same button within these 300 ms, the timer gets restarted, thus the `<ajax-cart-quantity>` will wait for another 300 ms before sending the request.

This approach lets the user change the quantity by more than one
before sending a Shopify Cart API Ajax request and before the cart goes to the "processing requests" mode.
