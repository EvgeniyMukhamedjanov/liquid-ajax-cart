---
layout: full
homepage: true
description: A Javascript library for building an AJAX carts using Liquid templates in Shopify
disable_anchors: false
---

# Liquid Ajax Cart


## Create a section for AJAX cart
{:.mt-lg-0}
* Add the [`data-ajax-cart-section`](reference/data-ajax-cart-section) attribute to a root HTML container of a section so that Liquid Ajax Cart ajaxifies the section.
* Add attributes for controls:
  * [`data-ajax-cart-quantity-button`](reference/data-ajax-cart-quantity-button) — for "plus", "minus" and "remove" buttons;
  * [`data-ajax-cart-quantity-input`](reference/data-ajax-cart-quantity-input) — _in_development_ — for quantity text input field.
* If you have a scrollable area within the section, add the [`data-ajax-cart-section-scroll`](reference/data-ajax-cart-section-scroll) attribute to it and Liquid Ajax Cart will keep the scroll position the same after each section's HTML update.

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


## Enhance product forms
{:.mt-lg-0}
Liquid Ajax Cart ajaxifies product forms once it is loaded.

You should:

* Add a container with the [`data-ajax-cart-form-error`](reference/data-ajax-cart-form-error) attribute within product forms to show error messages.
* Show loading indicator or make a submit button visually disabled if a product form has [`js-ajax-cart-form-in-progress`](reference/js-ajax-cart-form-in-progress) CSS class.

{% raw %}
```html
{% form 'product', product %}
 <!-- form content -->

 <input type="submit" value="Add to cart">
 <div class="your-loading-indicator">Adding to cart...</div>
 <div data-ajax-cart-form-error > <!-- Place for error messages --> </div>
{% endform %}

<style>
 form .your-loading-indicator { display: none; }
 form.js-ajax-cart-form-in-progress .your-loading-indicator { display: block; }
</style>
```
{% endraw %}

