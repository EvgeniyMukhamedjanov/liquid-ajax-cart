---
title: <ajax-cart-product-form>
layout: docs-v2
---

# ajax-cart-product-form

<p class="lead" markdown="1">
A custom tag which performs a Shopify Cart API `/cart/add.js` Ajax request once a user submits a product form. 
</p>

## How it works
Once loaded, an `<ajax-cart-product-form>` element searches for 
a valid [Shopify product form](https://shopify.dev/docs/themes/architecture/templates/product#the-product-form) inside itself
and subscribes to the form `submit` event. Once the event is fired, the `<ajax-cart-product-form>` element
collects the form data and sends it as a Shopify Cart API `/cart/add.js` Ajax request in order to add the product to the cart.

The `<ajax-cart-product-form>` element must contain only one Shopify product form inside:
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
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code highlight_lines="1,9" %}

{% include v2/content/form-loading-state-block.html %}