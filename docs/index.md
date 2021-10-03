---
layout: full
homepage: true
description: A Javascript library for building an AJAX carts using Liquid templates in Shopify
disable_anchors: true
title: Liquid Ajax Cart
---

{% assign row_classes = 'row mb-4 mt-4' %}
{% assign left_column_classes = 'col-lg-5' %}
{% assign right_column_classes = 'col-lg-7' %}

<div class="row">
<div class="col-lg-8">
<p class="lead" markdown="1">
Add the `data-ajax-cart-section` attribute to your cart liquid section and Liquid Ajax Cart will update the section's HTML on a page every time when the cart is changed.
</p>
<p class="lead" markdown="1">No javascript coded needed.</p>
<p class="lead" markdown="1">Check out all the features on the Demo store.</p>
</div>
<div class="col-lg-4" markdown="1">
> For building custom storefronts using React, Liquid Ajax Cart offers Ajax Requests API and the State — enriched cart object.
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="col-lg-6" markdown="1">
### Installation
{:.mt-0}
</div>
</div>

<div class="{{ row_classes }}">
<div class="col-lg-6" markdown="1">
##### Manual
{:.mt-0}
 
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}
 
<script type="application/json" data-ajax-cart-initial-state >{{ cart | json }}</script>
<script type="module">
  import '{{ 'liquid-ajax-cart.js' | asset_url }}';
</script>
```
{% endraw %}
 
Upload the [liquid-ajax-cart.js](https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/blob/main/_dist/liquid-ajax-cart.js) file to your theme's `asset` folder and include it in the `layout/theme.liquid` template.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](reference/data-ajax-cart-initial-state) attribute. If not — Liquid Ajax Cart will make another AJAX request to get the cart state.

</div>
<div class="col-lg-6" markdown="1">
##### Via npm
{:.mt-0}
 
<div class="soon-blurred" markdown="1">
```npm
npm install liquid-ajax-cart
```

```javascript
import 'liquid-ajax-cart/dom-binder';
import 'liquid-ajax-cart/sections';
import 'liquid-ajax-cart/controls';
import 'liquid-ajax-cart/product-forms';
import 'liquid-ajax-cart/global-classes';
```
 
{% raw %}
```html
<script type="application/json" data-ajax-cart-initial-state >{{ cart | json }}</script>
```
{% endraw %}

Import all the needed modules and provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](reference/data-ajax-cart-initial-state) attribute. If not — Liquid Ajax Cart will make another AJAX request to get the cart state.
</div>
 
</div>
</div>

---

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
{% section 'my-cart' %}
```
{% endraw %}

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### Loading state
{:.mt-0}

[Quantity button](reference/data-ajax-cart-quantity-button) and [Quantity input](reference/data-ajax-cart-quantity-input) become inactive when user's cart is getting updated. 
 
Liquid Ajax Cart adds `js-ajax-cart-in-progress` CSS class to the `body` tag during the updating process so that you show a loading indicator or make the controls visually disabled.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">

```css
.my-cart__items { 
  opacity: 1;
  transition: opacity .2s;
}
 
/* Make the area with controls visually disabled */
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
{:.mt-0}
 
Liquid Ajax Cart ajaxifies product forms once it is loaded.

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### Error messages
{:.mt-0}
 
Add a container with the [`data-ajax-cart-form-error`](reference/data-ajax-cart-form-error) attribute within product forms to show error messages.

</div>
<div class="{{ right_column_classes }}" markdown="1">
  
{% raw %}
```html
{% form 'product', product %}
  <!-- form content -->

  <input type="submit" value="Add to cart">
  <div data-ajax-cart-form-error > 
    <!-- Error messages appear here --> 
  </div>
{% endform %}
```
{% endraw %}
 
</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### Loading state
{:.mt-0}
 
When a user submits a product form, it becomes inactive until the AJAX "Add to cart" request is finished to prevent accidental double submissions.
  
Liquid Ajax Cart adds [`js-ajax-cart-form-in-progress`](reference/js-ajax-cart-form-in-progress) CSS class to the form if the request is in progress so that you show a loading indicator or make the submit button visually disabled.
  
</div>
<div class="{{ right_column_classes }}" markdown="1">

```css
/* Make the submit button visually disabled */
form.js-ajax-cart-form-in-progress [type="submit"] {
  opacity: .7;  
}

/* Show a loading indicator */
form.js-ajax-cart-form-in-progress:after { 
  content: 'Adding to cart…'
  display: block; 
}
```
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Show/hide a cart section on a button click
{:.mt-0}

Write some CSS to show your cart section if a specific `body` CSS class exists.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% raw %}
```html
<!-- Floating cart -->
<div class="my-floating-cart"> {% section 'my-cart' %} </div>

<style>
  .my-floating-cart { display: none; }

  /* Show the floating cart if a 'js-my-cart-open' CSS class exists */
  .js-my-cart-open .my-floating-cart { display: block; }
</style>
```
{% endraw %}

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Add the [`data-ajax-cart-toggle-class-button`](data-ajax-cart-toggle-class-button) attribute with the CSS class as a parameter to a button that have to show/hide the cart — it will add/remove the CSS class on a user's click.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% raw %}
```html
<!-- Button to open/close the floating cart -->
<a href="{{ routes.cart_url }}"
  data-ajax-cart-toggle-class-button="js-my-cart-open">
  My Cart
</a>
```
{% endraw %}

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

If you want the button to only add or only remove the CSS class — specify the additional parameter.

</div>
<div class="{{ right_column_classes }}" markdown="1">

```html
<button data-ajax-cart-toggle-class-button="js-my-cart-open | add">
  Open cart
</button>

<button data-ajax-cart-toggle-class-button="js-my-cart-open | remove">
  Close cart
</button>
```

</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Display the cart object's attributes outside of AJAX sections
{:.mt-0}
 
Add the [`data-ajax-cart-bind-state`](reference/data-ajax-cart-bind-state) attribute to an HTML element, pass a Cart state property as an attribute's value and Liquid Ajax Cart will display the state property's value within the HTML element and refresh it when cart gets updated.

Explore all the properties on the [State reference](#) page

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% raw %}
```html
<div data-ajax-cart-bind-state="cart.item_count" > 
  <!-- Cart item count appears here --> 
</div>

<!-- The best practice is to use [data-ajax-cart-bind-state] on top of Liquid expressions.
The liquid expression {{ cart.item_count }} displays the amount 
even if Liquid Ajax Cart is not loaded: -->
<div data-ajax-cart-bind-state="cart.item_count" >
  {{ cart.item_count }}
</div>
```
{% endraw %}

</div>
</div>
