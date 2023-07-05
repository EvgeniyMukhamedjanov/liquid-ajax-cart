---
title: The data-ajax-cart-section attribute
layout: docs-v2
---

# data-ajax-cart-section

<p class="lead" markdown="1">
Liquid Ajax Cart updates HTML code of elements with the `data-ajax-cart-section` attribute after each Shopify Cart API Ajax request. 
It uses Shopify <a href="https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering">Bundled section rendering</a> under the hood, 
so the `data-ajax-cart-section` must be used in a Shopify section.
</p>

## Make a container of a section updatable

Apply the `data-ajax-cart-section` to the element that you want to be updatable when the Shopify cart is changed.

In the following example only the `.my-cart__wrapper` element's HTML will be replaced with a new one 
when the cart is changed after a Shopify Cart API Ajax request:

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

### Immutable elements inside

If you want to have an immutable HTML element within a `data-ajax-cart-section` container — 
add the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element/) attribute to this element. 
HTML code of an immutable container will not be replaced when the parent `data-ajax-cart-section` gets updated.

## Make multiple containers of a section updatable

If you want multiple containers to be updatable within a Shopify section — apply the `data-ajax-cart-section` to them.

In the following example the `.my-cart__wrapper` and `.my-cart__footer` containers HTML will be replaced with a new one after the Shopify cart is changed.

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

It is useful when you have HTML nodes that must be immutable and they are placed between updatable containers. If you want to have an immutable node right within a `data-ajax-cart-section` — use the [`data-ajax-cart-static-element`](/v2/docs/data-ajax-cart-static-element/) attribute with it.

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