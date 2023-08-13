---
title: data-ajax-cart-errors
layout: docs-v2
---

# data-ajax-cart-errors

<p class="lead" markdown="1">
Liquid Ajax Cart inserts the product form and cart item error messages into the containers with the `data-ajax-cart-errors` attribute.  
</p>

## How it works

Shopify might return an error message in response to a Cart API Ajax request.
For example, it returns the message "All 2 White Shirt are in your cart" 
when a user attempts to add to cart more items than are available in stock.

If a Shopify Cart API Ajax request is failed and doesn't have any error description or is failed because of the Internet connection,
Liquid Ajax Cart populates the error message containers with the generic message "There was an error while updating your cart. Please try again.".
Use the [`requestErrorText`](/v2/docs/request-error-text/) configuration parameter to change the generic message.

## Product forms

Add a container with the `data-ajax-cart-errors="form"` attribute inside a product form 
ajaxified with the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag.

If Shopify returns an error message in response to a Cart API Ajax request sent by the `<ajax-cart-product-form>` custom tag,
or if the request fails,
Liquid Ajax Cart puts the error message into the `data-ajax-cart-errors="form"` container.

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

Add a container with the `data-ajax-cart-errors` attribute and set its value to the key of a cart item.
If Shopify returns an error message in response to a Cart API `/cart/change.js` Ajax request related to a specific cart item,
or if the request fails,
Liquid Ajax Cart searches for the `data-ajax-cart-errors="cart_item_key"` element
and inserts the error message into that element.

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