# data-ajax-cart-section

Liquid Ajax Cart reloads HTML code of containers with the `data-ajax-cart-section` attribute every time when the Shopify cart is changed. 

The attribute is applicable only within Shopify sections.

### Make a container of a section updatable

Apply the `data-ajax-cart-section` to the container that you want to be updatable when the Shopify cart is changed.

{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<div class="my-cart">
  <div class="my-cart__wrapper" data-ajax-cart-section >
    <!-- cart content -->
  </div>
</div> 

<div class="overlay"></div>

{% style %}
  .my-cart {
    background-color: {{ section.settings.background_color }}
  }
{% endstyle %}

{% schema %} ... {% endschema %}
```
{% endraw %}

In the above example the `.my-cart__wrapper` container will be replaced with the new one after the Shopify cart is changed. 

If want to have an immutable HTML element within a `data-ajax-cart-section` container — apply the [data-ajax-cart-static-element](/reference/data-ajax-cart-static-element/) to it.

### Make multiple containers of a section updatable

If you want multiple containers to be updatable — apply the `data-ajax-cart-section` to them.

{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<div class="my-cart">
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" data-ajax-cart-section >
    <!-- Cart items container is updatable
    because of the data-ajax-cart-section attribute -->
  </div>
  <div class="my-cart__immutable-content">
    <!-- Another content that is not updatable 
    because there is no parent data-ajax-cart-section -->
  </div>
  <div class="my-cart__footer" data-ajax-cart-section >
    <!-- Cart footer container is updatable 
    because of the data-ajax-cart-section attribute -->
  </div>
</div> 

<div class="overlay"></div>

{% style %}
  .my-cart {
    background-color: {{ section.settings.background_color }}
  }
{% endstyle %}

{% schema %} ... {% endschema %}
```
{% endraw %}

In the above example the `.my-cart__wrapper` and `.my-cart__footer` containers will be replaced with the new ones after the Shopify cart is changed. 

It is useful when you have HTML nodes that must be immutable and they are placed between updatable containers. If you want to have an immutable node right within a `data-ajax-cart-section` — use the [data-ajax-cart-static-element](/reference/data-ajax-cart-static-element/) attribute with it.

If you have multiple `data-ajax-cart-section` containers, make sure that your section always renders the constant number of the `data-ajax-cart-section` containers in the same order. If the amount varies, it is considered as an exception situation and the section's HTML will be replaced completely with the new HTML to try to resolve it. 

###### Wrong! The second `data-ajax-cart-section` container sometimes appears, sometimes — doesn't: 
{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<div class="my-cart">
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" data-ajax-cart-section >
    <!-- Cart items -->
  </div>
  <div class="my-cart__immutable-content">
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

<div class="overlay"></div>

{% style %}
  .my-cart {
    background-color: {{ section.settings.background_color }}
  }
{% endstyle %}

{% schema %} ... {% endschema %}
```
{% endraw %}

###### Correct. All the `data-ajax-cart-section` containers always appear: 
{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<div class="my-cart">
  <div class="my-cart__header">Cart</div>
  <div class="my-cart__items" data-ajax-cart-section >
    <!-- Cart items -->
  </div>
  <div class="my-cart__immutable-content">
    <!-- Another content that is not updatable -->
  </div>
  <div class="my-cart__footer" data-ajax-cart-section >
    {% if cart.item_count > 0 %}
      <!-- Footer content -->
    {% endif %}
  </div>
</div> 

<div class="overlay"></div>

{% style %}
  .my-cart {
    background-color: {{ section.settings.background_color }}
  }
{% endstyle %}

{% schema %} ... {% endschema %}
```
{% endraw %}
