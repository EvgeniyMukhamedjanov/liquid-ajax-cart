---
title: Cart section
layout: docs-v2
---

# Cart section

<p class="lead" markdown="1">
Liquid Ajax Cart re-renders cart HTML after each user action, such as adding a product to the cart or changing cart item quantity. 
It uses Shopify <a href="https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering">Bundled section rendering</a> under the hood, so the cart content **must** be a Shopify section.
</p>

## Build a Shopify section for the cart

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
  
  {% form 'cart', cart, id: 'my-ajax-cart-form' %}
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  {% endform %}
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

In our case we want to enable re-rendering for the whole section content, so add the attribute to the root element — 
the one with the `my-cart` CSS class.

### Scrollable area
If you have an area with a scrollbar, add the [`data-ajax-cart-section-scroll`](/v2/docs/data-ajax-cart-section-scroll/) attribute to it — 
Liquid Ajax Cart will keep the scroll position unchanged while re-rendering.

### Quantity input
Add the [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input/) attribute to the cart item quantity input.

When a user changes the input value, Liquid Ajax Cart initiates a Shopify Cart API "change quantity" request 
and re-render the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers.

### "Plus" and "Minus" buttons 
To bind the "Plus" and "Minus" buttons to the cart item quantity input, 
wrap them all in the [`<ajax-cart-quantity>`](/v2/docs/ajax-cart-quantity/) tag
and add the attributes `data-ajax-cart-quantity-plus` and `data-ajax-cart-quantity-minus` to the buttons.

When a user clicks the button, Liquid Ajax Cart updates the input value,
initiates a Shopify Cart API "change quantity" request
and re-renders the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers.

### "Remove item" button
Add the [`data-ajax-cart-request-button`](/v2/docs/data-ajax-cart-request-button/) attribute to the "Remove item" button —
the one with the `href="{% raw %}{{ line_item.url_to_remove }}{% endraw %}"` attribute.

When a user clicks a link with the `data-ajax-cart-request-button` attribute,
Liquid Ajax Cart initiates a Shopify Cart API Ajax request based on the URL from the `href` parameter
and re-renders the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers 
if the request is successful.

Check out all the supported URLs on the [`data-ajax-cart-request-button`](/v2/docs/data-ajax-cart-request-button/) page.

### Error messages
To display error messages, such as when a user attempts to add more items to the cart than are available in stock, 
add an element with the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) attribute and set the value to the corresponding cart item key.

When Shopify returns an error message in response to an Ajax request related to a cart item, 
Liquid Ajax Cart searches for the element designated for the cart item error messages and inserts the error message into that element.

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
        <ajax-cart-quantity>
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
        </ajax-cart-quantity>
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

  {% form 'cart', cart, id: 'my-ajax-cart-form' %}
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  {% endform %}
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Cart note, cart item property, cart attribute fields

Add the [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) to a cart note field, 
a cart item property field, or a cart attribute field to ajaxify them.

When a user changes the field value, Liquid Ajax Cart sends a Shopify Cart API request to update the value
and re-renders the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers.

The `data-ajax-cart-property-input` attribute supports text inputs, checkboxes, radio buttons, the tags `select` and `textarea`.

Explore examples for all the features on the [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) page.

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

  {% form 'cart', cart, id: 'my-ajax-cart-form' %}
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  {% endform %}
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Loading state

When Liquid Ajax Cart initiates an Ajax request, it appends the [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class to the `html` tag.
Use this class to signify that the cart is being updated.

{% include v2/content/cart-loading-state-css-example.html %}

## Immutable containers for 3rd party apps and scripts

During the re-rendering process, Liquid Ajax Cart replaces all the HTML within the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) element with new content.
If you have third-party scripts or applications injecting their HTML into the cart section, preserving these modifications during re-rendering is crucial.

To keep a specific area within the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) element unchanged, add the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element/) attribute
to the parent element of the area. Liquid Ajax Cart will maintain the inner HTML of this area unchanged while updating the surrounding HTML.

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

  {% form 'cart', cart, id: 'my-ajax-cart-form' %}
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  {% endform %}
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## JavaScript event after re-rendering

Liquid Ajax Cart replaces the HTML content of [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) 
containers after a successful Shopify Cart API Ajax request.
To execute your JavaScript code after this replacement occurs,
you should subscribe to the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event:

{% include v2/content/sections-event-code-example.html %}

{% include v2/content/lifecycle-reference.html %}