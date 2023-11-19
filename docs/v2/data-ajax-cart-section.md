---
title: The data-ajax-cart-section attribute
layout: docs-v2
---

# data-ajax-cart-section

<p class="lead" markdown="1">
Liquid Ajax Cart re-renders elements with the `data-ajax-cart-section` attribute after each Shopify Cart API Ajax request. 
It uses Shopify <a href="https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering">Bundled section rendering</a> under the hood, 
so the `data-ajax-cart-section` **must** be used inside a Shopify section.
</p>

## How it works

Before sending a Shopify Ajax Cart API Ajax request, which are initiated by user cart-related actions
(such as adding a product to the cart or changing item quantity) or by a developer (using 
{% include v2/content/links-to-request-methods.html %}), Liquid Ajax Cart does the following:
* finds all the Shopify sections on the page that contain the `data-ajax-cart-section` elements;
* collects the IDs of the Shopify sections found;
* modifies the original request by adding the `sections` property to the body of the request so that Shopify returns the re-rendered HTML of the Shopify sections found ([Bundled section rendering](https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering)).

{%- capture highlight_code -%}
POST /cart/add.js
"Content-Type": "application/json"

{
  "items": [
    {
      "id": 40934235668668,
      "quantity": 1
    }
  ]  
}
{%- endcapture -%}
{% include v2/codeblock.html title="Original request" language="plain" code=highlight_code %}

{%- capture highlight_code -%}
POST /cart/add.js
"Content-Type": "application/json"

{
  "items": [
    {
      "id": 40934235668668,
      "quantity": 1
    }
  ],
  "sections": "my-ajax-cart"
}
{%- endcapture -%}
{% include v2/codeblock.html title="Modified final request" language="plain" code=highlight_code highlight_lines="11" %}

If the request is successful, Shopify retrieves the re-rendered HTML for the `data-ajax-cart-section` elements from the response.
It then replaces the current data-ajax-cart-section elements' outer HTML
with the new one.

## Single container to re-render

Apply the `data-ajax-cart-section` to the element whose content should be re-rendered
when the cart is changed after a Shopify Cart API Ajax request.

In the following example the re-rendering is only enabled for the `.my-cart__wrapper` element:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart">
  <h2>Cart</h2>
  <div class="my-cart__wrapper" data-ajax-cart-section>
    <!-- Cart content -->
  </div>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="3" %}

### Immutable element inside

If you want to have an immutable HTML element inside a `data-ajax-cart-section` container — 
add the [`data-ajax-cart-static-element`](/v2/data-ajax-cart-static-element/) attribute to this element. 
HTML code of an immutable container will not be replaced when the parent `data-ajax-cart-section` element is updated.

## Multiple containers to re-render

If you want multiple containers whose content should be re-rendered inside a Shopify section — apply the `data-ajax-cart-section` to them.

In the following example the re-rendering is enabled for the `.my-cart__wrapper` and `.my-cart__footer` elements:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart">
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" data-ajax-cart-section>
    <!-- Cart items container is updatable
    because of the data-ajax-cart-section attribute -->
  </div>
  <div class="my-cart__another-content">
    <!-- Another content that is not updatable 
    because there is no parent data-ajax-cart-section attribute -->
  </div>
  <div class="my-cart__footer" data-ajax-cart-section>
    <!-- Cart footer container is updatable 
    because of the data-ajax-cart-section attribute -->
  </div>
</div> 

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="3-6,11-14" %}

It is useful when you have HTML elements (like the `.my-cart__another-content` in the example above) 
that must be immutable and when they are placed between containers requiring re-rendering. 
If you want to have an immutable element **within** a `data-ajax-cart-section` element — use the [`data-ajax-cart-static-element`](/v2/data-ajax-cart-static-element/) attribute with it.

When you have multiple `data-ajax-cart-section` containers, 
make sure that your Shopify section always returns 
the constant number of the `data-ajax-cart-section` containers in the same order. 
If the amount varies, it is considered as an exception
and the whole HTML of the section will be replaced completely with the new HTML.

### Wrong example

The second `data-ajax-cart-section` container sometimes appears, sometimes — doesn't:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart">
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" data-ajax-cart-section >
    <!-- Cart items -->
  </div>
  <div class="my-cart__another-content">
    <!-- Another content that is not updatable -->
  </div>
  {% if cart.item_count > 0 %}

    {% comment %} 
      Wrong, because a [data-ajax-cart-section] container
      must not depend on any condition
    {% endcomment %}
    <div class="my-cart__footer" data-ajax-cart-section >
      <!-- Cart footer -->
    </div>
  {% endif %}
</div> 

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="9-18" %}

### Correct example

All the `data-ajax-cart-section` containers always appear:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart">
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" data-ajax-cart-section >
    <!-- Cart items -->
  </div>
  <div class="my-cart__another-content">
    <!-- Another content that is not updatable -->
  </div>
  <div class="my-cart__footer" data-ajax-cart-section >
    {% if cart.item_count > 0 %}
      <!-- Footer content -->
    {% endif %}
  </div>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}