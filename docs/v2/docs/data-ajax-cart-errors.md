---
title: data-ajax-cart-errors
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-errors

<p class="lead" markdown="1">
Liquid Ajax Cart puts the product form and cart item error messages to the containers with the `data-ajax-cart-errors` attribute.  
</p>

## How it works

Shopify might respond with an error message to a Cart API Ajax request sent by Liquid Ajax Cart.
For example — the "All 2 White Shirt are in your cart" message if a user tries to add to cart more items than in stock.

If a Shopify Cart API Ajax request is failed and doesn't have any error description or failed because of the Internet connection,
then Liquid Ajax Cart will populate the error message containers with the generic message: "There was an error while updating your cart. Please try again.".
Use the [`requestErrorText`](/v2/docs/request-error-text/) configuration parameter to change the message.

## Product forms

Put a container with the `data-ajax-cart-errors="form"` attribute inside a product form ajaxified with the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag.

If Shopify responds with an error message to a Cart API Ajax request sent by the `<ajax-cart-product-form>` custom tag,
or if the request fails,
Liquid Ajax Cart will put the error message into the `data-ajax-cart-errors="form"` container.

{%- capture highlight_code -%}
{% raw %}
<ajax-cart-product-form>
  {% form 'product', product %}
    <!-- form content -->
  
    <button type="submit">
      Add to cart
    </button>
    <div data-ajax-cart-errors="form"> 
      <!-- Error messages appear here --> 
    </div>
  
  {% endform %}
</ajax-cart-product-form>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code %}

## Line items

Add a container with the `data-ajax-cart-errors` attribute and the cart item key as the value —
If Shopify responds with an error message to a Cart API `/cart/change.js` Ajax request related to a specific cart item,
or if the request fails,
Liquid Ajax Cart will put the error message into a `data-ajax-cart-errors` container with the corresponding cart item key.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>

  <div class="my-cart__items">
    {% for line_item in cart.items %}
      <div><a href="{{ line_item.url }}">{{ line_item.title }}</a></div>
      <div>Price: {{ line_item.final_price | money }}</div>

      <div data-ajax-cart-errors="{{ line_item.key }}">
        <!-- Errors appear here --> 
      </div>

      <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}