# data-ajax-cart-section

Liquid Ajax Cart reloads HTML code of the theme sections that marked with the `data-ajax-cart-section` attribute every time when the Shopify cart is changed.

The `data-ajax-cart-section` must be applied to a root container of a theme section

##### Correct:
{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<div data-ajax-cart-section class="my-cart">
  <!-- section content -->
</div> 
```
{% endraw %}

##### Will not work. The `data-ajax-cart-section` container is not a root element:
{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<section class="my-cart">
  <div data-ajax-cart-section>
    <!-- section content -->
  </div>
</section> 
```
{% endraw %}
