---
title: ajax-cart-quantity
layout: docs-v2
disable_anchors: true
---

# ajax-cart-quantity

<p class="lead" markdown="1">
The element lets you add "Plus" and "Minus" buttons to a cart item quantity input 
with the [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input) attribute.  
</p>

## Setup

Let's say you have a cart item quantity input, ajaxified with the `data-ajax-cart-quantity-input` attribute:

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

In order to attach "Plus" and "Minus" buttons — add HTML elements for them next to the input field with the
`data-ajax-cart-quantity-plus` and `data-ajax-cart-quantity-minus` attributes
and wrap them all in the `ajax-cart-quantity` tag:

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
        <ajax-cart-quantity>
          <a data-ajax-cart-quantity-minus
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
            Minus one 
          </a>

          <input data-ajax-cart-quantity-input="{{ item_index }}"
            name="updates[]" 
            value="{{ item.quantity }}" 
            type="number" 
            form="my-ajax-cart-form" />

          <a data-ajax-cart-quantity-plus
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
            Plus one 
          </a>
        </ajax-cart-quantity>
      </div>

      <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

The `ajax-cart-quantity` custom element listens to the `click` event at the `data-ajax-cart-quantity-minus` and `data-ajax-cart-quantity-plus` elements.
When the event is fired, the `ajax-cart-quantity` adjusts the `data-ajax-cart-quantity-input` input value
and triggers the `change` event for the input, which in turn will make Liquid Ajax Cart send a Shopify Cart API Ajax request to update the quantity
and re-render all the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section) elements.

The `href` attribute isn't necessary for the buttons. It is there to make the section work without JavaScript.

## Debounce — 300ms

The `ajax-cart-quantity` custom element doesn't trigger the `change` event at the `data-ajax-cart-quantity-input` element immediately.
When a user clicks the "Plus" or "Minus" button, the `ajax-cart-quantity` just starts a timer for 300 milliseconds.

If the user doesn't click the same button again within the 300 ms, the `ajax-cart-quantity` triggers the `change` event.

Otherwise, if the user clicks the same button within these 300 ms, the timer gets restarted, thus the `ajax-cart-quantity` will wait for another 300 ms before sending the request.

This approach lets the user change the quantity by more than one
before sending a Shopify Cart API Ajax request and before the cart goes to the "loading" state.
