# Guide

## Create a section for AJAX cart
Add [`data-ajax-cart-section`](data-ajax-cart-section) attribute to a root HTML container so that Liquid Ajax Cart knows that this section should be updated once cart is updated.

{% raw %}
```html
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div data-ajax-cart-section >
  <h2>Cart</h2>
  
  {% for item in cart.items %}  
    <a href="{{ item.url }}">{{ item.title }}</a> <br />
    Price: {{ item.final_price | money }} <br />

    Quantity:
    <a 
       href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity={{ item.quantity | minus: 1 }}" 
       data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | minus: 1 }}"
    > Minus one </a>
    <span>{{ item.quantity }}</span>
    <a 
       href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity={{ item.quantity | plus: 1 }}" 
       data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | plus: 1 }}"
    > Plus one </a>

    Total: <strong>{{ item.final_line_price | money }}</strong> <br /> <br />  
  {% endfor %}
  
  <a href="/checkout"> Checkout — {{ cart.total_price | money_with_currency }} </button>
</div>

{% schema %} { "name": "Ajax Cart" } {% endschema %}
```
{% endraw %}

Include the section:
{% raw %}
```liquid
{% comment %} Most likely somewhere in theme.liquid {% endcomment %}
{% section 'ajax-cart' %}
```
{% endraw %}


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
  form .loading-indicator { display: none; }  
  form.js-ajax-cart-form-in-progress .loading-indicator { display: block; }
</style>
```
{% endraw %}
