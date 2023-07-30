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
* modifies the original request by adding the `section` property to the request body to ask Shopify to respond with the updated HTML of the Shopify sections found ([Bundled section rendering](https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering)).

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
{% include v2/codeblock.html title="Modified final request" language="plain" code=highlight_code %}

If the request is successful, Shopify will add the re-rendered HTML for the requested sections to the response,
then Liquid Ajax Cart will pull the HTML for the `data-ajax-cart-section` elements from the response 
and update the `data-ajax-cart-section` elements on the page.

If the request is successful, Liquid Ajax Cart pulls the updated HTML of the `data-ajax-cart-section` elements 
from the re-rendered Shopify sections HTML that came along with response to the request,
and replaces the `data-ajax-cart-section` elements HTML with the new one.

## Single container to re-render

Apply the `data-ajax-cart-section` to the element whose content should be re-rendered
when the cart is changed after a Shopify Cart API Ajax request.

In the following example only the `.my-cart__wrapper` element's HTML will be updatable:

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
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

### Immutable element inside

If you want to have an immutable HTML element inside a `data-ajax-cart-section` container — 
add the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element/) attribute to this element. 
HTML code of an immutable container will not be replaced when the parent `data-ajax-cart-section` element gets updated.

## Multiple containers to re-render

If you want multiple containers whose content should be re-rendered inside a Shopify section — apply the `data-ajax-cart-section` to them.

In the following example the `.my-cart__wrapper` and `.my-cart__footer` containers HTML will be updatable:

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
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

It is useful when you have HTML nodes that must be immutable and they are placed between updatable containers. If you want to have an immutable node right within a `data-ajax-cart-section` element — use the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element/) attribute with it.

If you have multiple `data-ajax-cart-section` containers, make sure that your section always renders the constant number of the `data-ajax-cart-section` containers in the same order. If the amount varies, it is considered as an exception situation and the section's HTML will be replaced completely with the new HTML to try to resolve it.

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
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

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