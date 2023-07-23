---
title: Cart section
layout: docs-v2
---

# Cart section

<p class="lead" markdown="1">
Liquid Ajax Cart re-renders cart HTML after each user action such as adding a product to the cart or changing cart item quantity. 
It uses Shopify <a href="https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering">Bundled section rendering</a> under the hood, so the cart content **must** be a Shopify section.
</p>

## Build a cart section

Create a new Shopify section that works without Ajax. Use any Liquid objects, tags and filters. Styling is up to you as well.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart">
  <h2>Cart ({{ cart.item_count }})</h2>

  <div class="my-cart__items">
    <!-- Loop through cart items -->
    {% for line_item in cart.items %}
      {% assign line_item_index = forloop.index %}

      <div><a href="{{ line_item.url }}">{{ line_item.title | escape }}</a></div>
      <div>Price: {{ line_item.final_price | money }}</div>
  
      <div>
        Quantity:

        <!-- "Minus one" button -->
        <a href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ line_item.quantity | minus: 1 }}" > 
          Minus one 
        </a>
  
        <!-- Item quantity input -->
        <input
          name="updates[]" 
          value="{{ line_item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

        <!-- "Plus one" button -->
        <a href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ line_item.quantity | plus: 1 }}"> 
          Plus one 
        </a>
      </div>
  
      <div>Total: <strong>{{ line_item.final_line_price | money }}</strong></div>

      <!-- "Remove item" button -->
      <a href="{{ line_item.url_to_remove }}">
        Remove
      </a>

      <hr/>
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

Include the section to the `layout/theme.liquid` where you want to show the Ajax cart.

{%- capture highlight_code -%}
{% raw %}
{% section 'my-ajax-cart' %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

The section will appear on the page. The "Plus", "Minus", "Remove" button clicks will update the cart, 
but still with the page refresh.

## Ajaxify the cart section

Use HTML attributes and custom tags to mark elements that should be ajaxified. 

### Container to re-render
Add the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) attribute to an element 
whose content should be re-rendered after each user action, such as adding a product to the cart or changing cart item quantity. 

In our case we want the whole section content to be updatable, so add the attribute to the root element — 
the one with the `my-cart` CSS class.

### Scrollable area
If you have an area with a scrollbar, add the [`data-ajax-cart-section-scroll`](/v2/docs/data-ajax-cart-section-scroll/) attribute to it — 
Liquid Ajax Cart will keep the scroll position unchanged while re-rendering.

### Quantity input
Add the [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input/) attribute to the cart item quantity input.

When a user changes the input value, Liquid Ajax Cart will send a Shopify Cart API "change quantity" request 
and re-render the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers.

### "Plus" and "Minus" buttons 
In order to bind "Plus" and "Minus" buttons to the cart item quantity input, 
wrap them all with the [`<ajax-cart-quantity>`](/v2/docs/ajax-cart-quantity/) tag
and add the `data-ajax-cart-quantity-plus` and `data-ajax-cart-quantity-minus` attributes to the buttons.

When a user clicks on the button, Liquid Ajax Cart will update the input value,
send a Shopify Cart API "change quantity" request
and re-render the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers.

### "Remove item" button
Add the [`data-ajax-cart-request-button`](/v2/docs/data-ajax-cart-request-button/) attribute to the "Remove item" button —
the one with the `href="{% raw %}{{ line_item.url_to_remove }}{% endraw %}"` attribute.

When a user clicks on a link with the `data-ajax-cart-request-button` attribute,
Liquid Ajax Cart sends a Shopify Cart API Ajax request based on the URL from the `href` parameter
and re-renders the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers 
if the request is successful.

Check out all the supported URLs on the [`data-ajax-cart-request-button`](/v2/docs/data-ajax-cart-request-button/) page.

### Error messages
In order to show error messages, for example when a user tries to add more items to the cart than exist in stock, 
add an element with the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) attribute and a cart item key as the value.

When Shopify responds with an error message to an Ajax request related to a cart item, 
Liquid Ajax Cart looks for the cart item error messages element and puts the error text in there.

### Result code

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

        <!-- "Minus one" button -->
        <a data-ajax-cart-quantity-minus
          href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ line_item.quantity | minus: 1 }}" > 
          Minus one 
        </a>
  
        <!-- Item quantity input -->
        <input data-ajax-cart-quantity-input="{{ line_item_index }}"
          name="updates[]" 
          value="{{ line_item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

        <!-- "Plus one" button -->
        <a data-ajax-cart-quantity-plus
          href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ line_item.quantity | plus: 1 }}"> 
          Plus one 
        </a>
      </div>

      <!-- Item error messages -->
      <div data-ajax-cart-errors="{{ line_item.key }}"></div>
  
      <div>Total: <strong>{{ line_item.final_line_price | money }}</strong></div>

      <!-- "Remove item" button -->
      <a data-ajax-cart-request-button href="{{ line_item.url_to_remove }}">
        Remove
      </a>

      <hr/>
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

## Cart note, cart item property, cart attribute fields

Add the [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) to a cart note field, 
a cart item property field or a cart attribute field to ajaxify them.

When a user changes the field value, Liquid Ajax Cart will send a Shopify Cart API request to update the value
and re-render the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers.

The `data-ajax-cart-property-input` attribute supports textual inputs, checkboxes, radio buttons, `select` and `textarea` tags.

Check out examples for all the features on the [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) page.

### Ajaxified cart note example

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    <!-- Cart items code -->
  </div>

  <textarea data-ajax-cart-property-input
    name="note"
    form="my-ajax-cart-form">
    {{ cart.note }}
  </textarea>

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

When Liquid Ajax Cart sends an Ajax request, it adds the [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class to the `html` tag.
Use it to indicate that the cart is updating.

{% include v2/content/cart-loading-state-css-example.html %}

## Immutable containers for 3rd party apps and scripts

When re-rendering, Liquid Ajax Cart replaces all the HTML, that is inside the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) element, with a new one.
If you have a 3-rd party script or an app that injects its HTML into the cart area, you don't want to lose those changes while re-rendering.

In order to keep a specific area unchanged, add the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element/) attribute
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

## JavaScript callback after re-render

Listen to the [`liquid-ajax-cart:sections`](/v2/docs/sections-event/) event 
if you want to run your JavaScript code when the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) element is re-rendered.

For example, you might need to attach event listeners to elements 
inside the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container
each time when it is updated,
because Liquid Ajax Cart replaces its HTML with a new one on each re-render. 

{% include v2/content/sections-event-code-example.html %}