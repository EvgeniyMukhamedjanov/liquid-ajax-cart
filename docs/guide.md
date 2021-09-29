# Guide

## Product forms

Liquid Ajax Cart ajaxifies product forms once it is loaded. 

* Add a container with [`data-ajax-cart-form-error`](data-ajax-cart-form-error) attribute within a product form where you want to show error messages:

{% raw %}
```html
{% form 'product', product %}

  <!-- form's code ... -->

  <div data-ajax-cart-form-error ></div>
  
  <!-- ... form's code -->
  
{% endform %}
```
{% endraw %}
