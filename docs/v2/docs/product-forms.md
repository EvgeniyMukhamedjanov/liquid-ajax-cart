---
title: Product forms
layout: docs-v2
disable_anchors: true
---

# Product forms

<p class="lead" markdown="1">
Liquid Ajax Cart initiates a Shopify "add to cart" Ajax request when a user submits a product form, 
lets you display a loading indicator, re-renders [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements if the request is successful, 
shows an error message if something went wrong.
</p>

## Ajaxify a product form

Liquid Ajax Cart works with valid [Shopify product forms](https://shopify.dev/docs/themes/architecture/templates/product#the-product-form).

Build or find a product form that you want to ajaxify. Typically, it has a structure similar to this:

{%- capture highlight_code -%}
{% raw %}
{% form 'product', product %}
  <!-- form content -->

  <button type="submit" name="add">
      Add to cart
  </button>
{% endform %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code %}

Once you click the "Add to cart" button, it should redirect you to the cart page and add the product to the cart.

To ajaxify the form, wrap it in the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag —
it initiates an "add to cart" Ajax request when a user submits the form. 
If the request is successful, Liquid Ajax Cart re-renders [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements as well.

{%- capture highlight_code -%}
{% raw %}
<ajax-cart-product-form>
  {% form 'product', product %}
    <!-- form content -->
  
    <button type="submit" name="add">
      Add to cart
    </button>
  {% endform %}
</ajax-cart-product-form>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code %}

## Error messages

Shopify may return an error message in response to an "add to cart" request
when a user attempts to add more items to the cart than are available in stock.

To display the error message, add an element with the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) attribute 
within the ajaxified product form. Set the value of the attribute to the string `form`.
if Shopify responds with an error message, Liquid Ajax Cart will insert the error message into the element.

{%- capture highlight_code -%}
{% raw %}
<ajax-cart-product-form>
  {% form 'product', product %}
    <!-- form content -->
  
    <button type="submit" name="add">
      Add to cart
    </button>
    <div data-ajax-cart-errors="form"></div>
  {% endform %}
</ajax-cart-product-form>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code %}

{% include v2/content/form-loading-state-block.html %}

## JavaScript event

To execute your JavaScript code after a product is added to the cart,
you should subscribe to the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event.

This is how you can add a CSS class to the `body` element to open your Ajax-cart when a product is added to the cart:
{% include v2/content/add-to-cart-class-example.html %}

{% include v2/content/lifecycle-reference.html %}