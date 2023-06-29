---
title: Cart section
layout: docs-v2
disable_anchors: true
---

# Cart section

<p class="lead">
Liquid Ajax Cart re-renders cart HTML after each user action such as adding a product to the cart or changing cart item quantity. 
It uses Shopify <a href="https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering">Bundled section rendering</a> under the hood, so the cart content must be a Shopify section.
</p>

## Building a cart section

Create a new Shopify section that works without Ajax. Use any Liquid objects, tags and filters. Styling is up to you as well.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart">
  <h2>Cart</h2>

  <div class="my-cart__items">
    {% for item in cart.items %}
      {% assign item_index = forloop.index %}
      <hr />  
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>
  
      <div>
        Quantity:
        <!-- data-ajax-cart-request-button ajaxifies the "Minus one" button -->
        <a
          href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
          Minus one 
        </a>
  
        <!-- data-ajax-cart-quantity-input ajaxifies the line item quantity input -->
        <input
          name="updates[]" 
          value="{{ item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />
  
        <!-- data-ajax-cart-request-button ajaxifies the "Plus one" button -->
        <a
          href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
          Plus one 
        </a>
      </div>
  
      <div>Total: <strong>{{ item.final_line_price | money }}</strong></div>

      <a href="{{ item.url_to_remove }}">
        Remove
      </a>
    {% endfor %}
  </div>
  
  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

Include the section to the place in `theme.liquid` where you want to show the Ajax cart.

{%- capture highlight_code -%}
{% raw %}
{% section 'my-ajax-cart' %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

At this point the section should appear on all the pages and a click on the "Plus", "Minus", "Remove" buttons should work, but still with page refresh.

## Ajaxifing the cart section

Add the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section) attribute to the root element — 
it will let Liquid Ajax Cart know that the content inside should be updated after each user action. 

If you have an area with a scrollbar, add the [`data-ajax-cart-section-scroll`](/v2/docs/data-ajax-cart-section-scroll) attribute to it — 
Liquid Ajax Cart will keep the scroll position unchanged while updating sections’ HTML.

Add the [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input) attribute to the line-item quantity input —
Liquid Ajax Cart will listen to the `change` event, send an Ajax request to change the quantity when the event is triggered
and update the content of the container with the `data-ajax-cart-section` attribute.

In order to bind "Plus" and "Minus" buttons to the line-item quantity input, wrap them all into the [`ajax-cart-quantity`](/v2/docs/ajax-cart-quantity) tag
and add the `data-ajax-cart-quantity-plus` and `data-ajax-cart-quantity-minus` attributes to the buttons.
Liquid Ajax Cart will listen to the `click` event on the buttons and triggers the `change` event on the quantity input when they are clicked.

Add the [`data-ajax-cart-request-button`](/v2/docs/data-ajax-cart-request-button) attribute to the "Remove" button —
Liquid Ajax Cart will listen to the `click` event, send an Ajax request according to the URL from the `href` attribute when the event is triggered,
then it will update the content of the container with the `data-ajax-cart-section` attribute.

In order to show error messages, for example when a user tries to add more items than in stock, 
add an element with the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors) — 
if Shopify responds with an error message to an Ajax request, Liquid Ajax Cart will put the message text to the element. 

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    {% for item in cart.items %}
      {% assign item_index = forloop.index %}
      <hr />  
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      <div>
        Quantity:
        <!-- data-ajax-cart-request-button ajaxifies the "Minus one" button -->
        <ajax-cart-quantity>
          <a data-ajax-cart-quantity-minus
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
            Minus one 
          </a>
    
          <!-- data-ajax-cart-quantity-input ajaxifies the line item quantity input -->
          <input data-ajax-cart-quantity-input="{{ item_index }}"
            name="updates[]" 
            value="{{ item.quantity }}" 
            type="number" 
            form="my-ajax-cart-form" />
    
          <!-- data-ajax-cart-request-button ajaxifies the "Plus one" button -->
          <a data-ajax-cart-quantity-plus
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
            Plus one 
          </a>
        </ajax-cart-quantity>
      </div>
  
      <div>Total: <strong>{{ item.final_line_price | money }}</strong></div>

      <a data-ajax-cart-request-button href="{{ item.url_to_remove }}">
        Remove
      </a>

      <div data-ajax-cart-errors="{{ item.key }}"></div>
    {% endfor %}
  </div>

  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Loading state

When Liquid Ajax Cart sends an Ajax request, it adds the [`js-ajax-cart-in-progress`](/v2/docs/js-ajax-cart-in-progress) CSS class to the `html` tag.
Use it to indicate that the cart is updating.

{% include v2/content/cart-loading-state-css-example.html %}

## Line item properties, cart note and attributes

Add the [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input) to a line-item property field, a cart note field or a cart attribute field —
Liquid Ajax Cart will listen to the `change` event, send an Ajax request to update the value when the event is triggered
and update the content of the container with the `data-ajax-cart-section` attribute. The attribute also supports checkboxes, radio buttons, `select` and `textarea` tags.

See more examples in the Reference section.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items">
    {% for item in cart.items %}
      {% assign item_index = forloop.index %}
      <hr />  
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      {% for property in item.properties %}
        <div>
          {{ property.first }}:
          {% if property.first == 'Engraving' %}
            <!-- data-ajax-cart-property-input ajaxifies the line item property input -->
            <input type="text"
              value="{{ property.last }}"
              data-ajax-cart-property-input="{{ item_index }}[{{ property.first }}]"/>
          {% else %}
            {{ property.last }}
          {% endif %}
        </div>
      {% endfor %}

      <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Immutable containers for 3rd party apps and scripts

Liquid Ajax Cart replaces all the HTML that is inside the `data-ajax-cart-section` element with a new one after each user action.
But if you have a 3-rd party script or an app that injects its HTML into the cart area on page load, you don't want to lose those changes.

In order to keep a specific area unchanged, add the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element) attribute
to the parent element of the area — Liquid Ajax Cart will keep this element's inner HTML unchanged when the surrounding HTML gets updated.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items">
    <!-- Cart items HTML -->
  </div>

  <div data-ajax-cart-static-element class="my-cart__third-party-upsell-app-wrapper">
    <!-- Liquid Ajax Cart will never change the HTML within data-ajax-cart-static-element -->
  </div>

  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## JavaScript callback when section is re-rendered

Listen to the [`liquid-ajax-cart:sections`](/v2/docs/sections-event) event 
if you need to run JavaScript code when `data-ajax-cart-section` elements get updated.

For example, you might need to attach event listeners to the Ajax cart section each time when the section gets updates,
because Liquid Ajax Cart replaces its HTML with a new one on each update. 

{% include v2/content/sections-event-code-example.html %}