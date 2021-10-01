---
layout: full
homepage: true
description: A Javascript library for building an AJAX carts using Liquid templates in Shopify
disable_anchors: true
title: Liquid Ajax Cart
---

{% assign row_classes = 'row' %}
{% assign left_column_classes = 'col-lg-5' %}
{% assign right_column_classes = 'col-lg-7' %}


<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">
 
### Create a section for AJAX cart
{:.mt-0}
 
* Create a new Shopify section 

* Add the [`data-ajax-cart-section`](reference/data-ajax-cart-section) attribute to a root HTML container — Liquid Ajax Cart reloads sections with this attribute every time when a cart gets updated.

* If you have a scrollable area within the section, add the [`data-ajax-cart-section-scroll`](reference/data-ajax-cart-section-scroll) attribute to the area — Liquid Ajax Cart keeps the scroll position unchanged while updating sections' HTML.

* Add Controls attributes:

  * [`data-ajax-cart-quantity-button`](reference/data-ajax-cart-quantity-button) — for "plus", "minus" and "remove" buttons;
  * [`data-ajax-cart-quantity-input`](reference/data-ajax-cart-quantity-input) — for quantity text input field.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">

{% raw %}
```html
{% comment %} sections/my-cart.liquid {% endcomment %}

<div data-ajax-cart-section >
  <h2>Cart</h2>
  
  <div class="my-cart__items" data-ajax-cart-section-scroll >
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
  </div>
  
  <a href="/checkout"> Checkout — {{ cart.total_price | money_with_currency }} </button>
</div>

{% schema %} { "name": "Ajax Cart" } {% endschema %}
```
{% endraw %}
  
</div>
</div>
 
<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

* Include the section to the place where you want to display the AJAX cart

</div>
<div class="{{ right_column_classes }}" markdown="1">
 
{% raw %}
```liquid
{% comment %} Most likely somewhere in theme.liquid {% endcomment %}
{% section 'ajax-cart' %}
```
{% endraw %}

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Controls become inactive when user's cart is getting updated. Liquid Ajax Cart adds `js-ajax-cart-in-progress` CSS class to the `body` tag during the updating process in order you to show a loading indicator or make the controls visually disabled.
 
</div>
<div class="{{ left_column_classes }}" markdown="1">
```css
.my-cart__items { 
  opacity: 1;
  transition: opacity .2s;
}
 
/* Makes the area with controls visually disabled */
.js-ajax-cart-in-progress .my-cart__items {
  opacity: .7;
}
```
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">
 
### Enhance product forms
{:mt-0}

Liquid Ajax Cart ajaxifies product forms once it is loaded.

You should:

* Add a container with the [`data-ajax-cart-form-error`](reference/data-ajax-cart-form-error) attribute within product forms to show error messages.
* Show loading indicator or make a submit button visually disabled if a product form has [`js-ajax-cart-form-in-progress`](reference/js-ajax-cart-form-in-progress) CSS class.

 </div>
 <div class="{{ right_column_classes }}" markdown="1">
  
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
 
</div>
</div>

