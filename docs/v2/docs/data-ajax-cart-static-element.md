---
title: data-ajax-cart-static-element
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-static-element

<p class="lead" markdown="1">
The `data-ajax-cart-static-element` attribute lets you have an immutable element inside a [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container. 
HTML of the immutable elements **won't** be touched when the parent `data-ajax-cart-section` container gets re-rendered. 
</p>

It is useful when you have third-party apps or JavaScript libraries that generate its own HTML 
and put it inside a [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container. 
Thus, you don't want to lose this changes during a [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container re-render.

## How it works 

While updating [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers Liquid Ajax Cart does the following:
1. remembers all `data-ajax-cart-static-element` DOM nodes before updating the parent [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container;
2. updates the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container HTML;
3. puts the remembered `data-ajax-cart-static-element` nodes to their places back.

If there are attached event listeners to elements inside a `data-ajax-cart-static-element` element — they will be kept as well, 
as Liquid Ajax Cart remembers `data-ajax-cart-static-element` elements as DOM node objects.

## Single immutable element

If you want to have an immutable element inside a [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) container — add the `data-ajax-cart-static-element` attribute to this element.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" >
    <!-- Cart items -->
  </div>
  <div class="my-cart__app-container" data-ajax-cart-static-element>
    <!-- Container with HTML code generated by an app
    and it must not be updated -->
  </div>
  <div class="my-cart__footer">
      <!-- Footer content -->
  </div>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Multiple immutable elements

If you have a few `data-ajax-cart-static-element` elements — give them different names 
so that Liquid Ajax Cart can distinguish them after HTML update:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__app-container-1" data-ajax-cart-static-element="app-1">
    <!-- Container with HTML code generated by an app
    and it must not be updated -->
  </div>
  <div class="my-cart__items" >
    <!-- cart items -->
  </div>
  <div class="my-cart__app-container-2" data-ajax-cart-static-element="app-2">
    <!-- Container with HTML code generated by an app
    and it must not be updated -->
  </div>
  <div class="my-cart__footer">
      <!-- Footer content -->
  </div>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}
