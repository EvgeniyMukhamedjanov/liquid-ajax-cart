---
layout: reference
title: data-ajax-cart-form-error (Liquid Ajax Cart)
---

# data-ajax-cart-section

A container with the `data-ajax-cart-section` attribute within a section is a sign for Liquid Ajax Cart that the section should be updated after another AJAX request.

The container must be a root HTML element in a section.

##### Correct:
{% raw %}
```html
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div data-ajax-cart-section class="any-class">
  <!-- section content -->
</div> 
```
{% endraw %}

##### Will not work. The [data-ajax-cart-section] container is not a root element:
{% raw %}
```html
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<section class="any-class">
  <div data-ajax-cart-section>
    <!-- section content -->
  </div>
</section> 
```
{% endraw %}
