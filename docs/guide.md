# Guide

## Product forms

Liquid Ajax Cart ajaxifies product forms once it is loaded. 

Add a container with [`data-ajax-cart-form-error`](data-ajax-cart-form-error) attribute within a product form where you want to show error messages:

{% raw %}
```html
{% form 'product', product %}

  <!-- form's code ... -->

  <div data-ajax-cart-form-error ></div>
  
  <!-- ... form's code -->
  
{% endform %}
```
{% endraw %}

Show loading indicators or make a submit button visually disabled when adding to cart using Form CSS classes:

{% raw %}
```html
{% form 'product', product %}

  <!-- form's code ... -->

  <div data-ajax-cart-form-error ></div>
  
  <!-- ... form's code -->
  
{% endform %}

<style>
  form .loading-indicator {
    display: none;
  }
  
  form.js-ajax-cart-form-in-progress .loading-indicator {
    display: block;
  }
</style>
```
{% endraw %}
