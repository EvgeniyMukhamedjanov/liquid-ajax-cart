---
title: Product forms
layout: docs-v2
disable_anchors: true
---

# Product forms

<p class="lead" markdown="1">
Liquid Ajax Cart sends a Shopify "add to cart" Ajax request once a user submits a product form, 
lets you show a loading indicator, re-renders [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements if the request is successful, 
shows an error message if something went wrong.
</p>

## Ajaxify a product form

Liquid Ajax Cart works with valid [Shopify product forms](https://shopify.dev/docs/themes/architecture/templates/product#the-product-form).

Build or find a product form that you want to ajaxify. In general, it will look like this:

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

In order to ajaxify the form, wrap it with the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag —
it will send an "Add to cart" Ajax request once a user submits the form. 
If the request is successful, Liquid Ajax Cart will re-render cart sections.

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

Shopify may respond with an error message to an "add to cart" request when, for example,
a user tries to add more items to the cart than exist in stock.

In order to show the error messages, add an element with the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) attribute
and the `form` string as the value inside an ajaxified product form.
if Shopify responds with an error message, Liquid Ajax Cart will put the message text to the element.

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

Once Shopify responds to the request, Liquid Ajax Cart will re-render cart section HTML.

{% include v2/content/form-loading-state-block.html %}