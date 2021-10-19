---
layout: full
homepage: true
description: A Javascript library for building Ajax carts using Liquid templates in Shopify
disable_anchors: true
title: Liquid Ajax Cart — Ajax Cart for Shopify
---

{% assign last_release_file = blank %}
{% assign last_release_slice = '/releases/last/liquid-ajax-cart-v' %}
{% for file in site.static_files %}
    {% assign file_slice = file.path | slice: 0, last_release_slice.size %}
    {% if last_release_slice == file_slice %}
        {% assign last_release_file = file %}
    {% endif %}
{% endfor %}

{% assign row_classes = 'row mb-4 mt-4' %}
{% assign left_column_classes = 'col-lg-5' %}
{% assign right_column_classes = 'col-lg-7' %}

<div class="row">
<div class="col-lg-8">
<p class="lead" markdown="1">
Add the `data-ajax-cart-section` attribute to your cart liquid section and Liquid Ajax Cart will update the section's HTML on a page every time when the cart is changed.
</p>
<p class="lead" markdown="1">No Javascript code needed.</p>

<p class="lead" markdown="1">Check out the <a href="https://liquid-ajax-cart.myshopify.com/" target="_blank">demo store</a> where all AJAX-cart functionality was built from scratch using Liquid Ajax Cart. Password — `liquid-ajax-cart`.</p>
</div>
<div class="col-lg-4">
<blockquote>
<h4 class="mt-0">{% include svg-icon.html icon="react" %} React integration</h4>
<p markdown="1">For building custom storefronts using React or Preact, Liquid Ajax Cart offers [Ajax Cart API requests](/reference/requests/) and the [State](/reference/state/) — enriched cart object. The "How to" guide will be ready soon.</p>
</blockquote>
</div>
</div>

---

<div style="display: none" class="video mx-n5 py-4 px-5 mb-5">
	<div>
		<h2 class="video__title">How to create Ajax-carts in Shopify using "Liquid Ajax Cart" Javascript library</h2>
		<div class="mb-5"><a href="https://youtu.be/5Dl9Wsmq130" class="site-masthead__button video__btn">Watch video</a></div>
	</div>
	<div class="video__subtitle">Complete Ajax-cart from scratch in 10 minutes.</div>
</div>

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
 
<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
 
<script type="module">
  import {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};
</script>
```
{% endraw %}
 
Upload the <a href="{{ last_release_file.path }}" download >{% include code/last-release-file-name.html %}</a> file to your theme's `asset` folder and include it in the `layout/theme.liquid` template.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another AJAX request to get the cart state.

</div>
<div class="col-lg-6" markdown="1">
<h5 class="mt-0">Via npm <span class="badge badge-secondary">soon</span></h5>
 
<div class="soon-blurred" markdown="1">
```
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
<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
```
{% endraw %}

Import all the needed modules and provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another AJAX request to get the cart state.
</div>
 
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">
 
### Create a section for AJAX cart
{:.mt-0}
 
Feel free to use any Liquid tags, objects and filters.

Add the [`data-ajax-cart-section`](/reference/data-ajax-cart-section/) attribute to a root HTML container — Liquid Ajax Cart reloads sections with this attribute every time when a cart gets updated.

If you have a scrollable area within the section, add the [`data-ajax-cart-section-scroll`](/reference/data-ajax-cart-section-scroll/) attribute to the area — Liquid Ajax Cart keeps the scroll position unchanged while updating sections' HTML.
    
##### Buttons

Use links to {% raw %}`{{ routes.cart_change_url }}`{% endraw %} for "plus", "minus" and "remove" buttons. They will be ajaxified automatically. 

The `routes.cart_add_url`, `routes.cart_clear_url`, `routes.cart_update_url` are supported as well. See the [`data-ajax-cart-request-button`](/reference/data-ajax-cart-request-button/) reference for details.
    
<h5>Quantity inputs <span class="badge badge-success">new in v1.1.0</span></h5>
    
Add the [`data-ajax-cart-quantity-input`](/reference/data-ajax-cart-quantity-input/) attribute to an input element that displays a cart item's quantity to ajaxify it.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/section.html %}
  
</div>
</div>
 
<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Include the section to the place where you want to display the AJAX cart

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

Buttons become inactive when the cart is getting updated. 
 
Liquid Ajax Cart adds the [`js-ajax-cart-request-in-progress`](/reference/js-ajax-cart-request-in-progress/) CSS class to the `body` tag during the updating process so you can show a loading indicator or make the controls visually disabled.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">

```css
.my-cart__items { 
  opacity: 1;
  transition: opacity .2s;
}
 
/* Make the area with controls visually disabled */
body.js-ajax-cart-request-in-progress .my-cart__items {
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
 
Add a container with the [`data-ajax-cart-form-error`](/reference/data-ajax-cart-form-error/) attribute within product forms to show error messages.

</div>
<div class="{{ right_column_classes }}" markdown="1">
  
{% include code/data-ajax-cart-form-error.html %}
 
</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### Loading state
{:.mt-0}
 
When a user submits a product form, it becomes and remains inactive until the Ajax "Add to cart" request is finished to prevent accidental double submissions.
  
Liquid Ajax Cart adds the [`js-ajax-cart-form-in-progress`](/reference/js-ajax-cart-form-in-progress/) CSS class to the form if the request is in progress so you can show a loading indicator or make the submit button visually disabled.
  
</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/js-ajax-cart-form-in-progress.html %}

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

  /* Show the floating cart if the 'js-my-cart-open' CSS class exists */
  .js-my-cart-open .my-floating-cart { display: block; }
</style>
```
{% endraw %}

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Add the [`data-ajax-cart-toggle-class-button`](/reference/data-ajax-cart-toggle-class-button/) attribute with the CSS class as a value to the button that have to show/hide the cart — the button will add/remove the CSS class on a user's click.

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
 
Add the [`data-ajax-cart-bind-state`](/reference/data-ajax-cart-bind-state/) attribute to an HTML element, pass a Cart state property as an attribute's value and Liquid Ajax Cart will display the state property's value within the HTML element and refresh it when cart gets updated.

Explore all the properties on the [State reference](/reference/state/) page.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/data-ajax-cart-bind-state.html %}

</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Run your Javascript code before and after each Ajax Cart API request
{:.mt-0}

Use the [`subscribeToCartAjaxRequests`](/reference/subscribeToCartAjaxRequests/) function to add callbacks that will be called before and after Ajax Cart API requests.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">


 ```html
<script type="module">
  import { subscribeToCartAjaxRequests, getCartState } from {% include code/last-release-file-name.html asset_url=true %}

  subscribeToCartAjaxRequests(( data, subscribeToResult ) => {    
    // This function will be called before each Ajax Cart API request
    console.log( 'Before: ', data );
 
    subscribeToResult( data => {   
      // This function will be called after the request is finished
      console.log( 'After: ', data );
    })
  })
</script>
 ```
 
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Make your own calls to Shopify Ajax Cart API
{:.mt-0}
 
Use these function instead of direct Cart API calls and Liquid Ajax Cart will keep the Ajax cart sections, the State object and body CSS classes updated:

* [`cartRequestGet`](/reference/cartRequestGet/) — sends a request to the `GET /cart.js` endpoint;
* [`cartRequestAdd`](/reference/cartRequestAdd/) — to the `POST /cart/add.js` endpoint;
* [`cartRequestChange`](/reference/cartRequestChange/) — to the `POST /cart/change.js` endpoint;
* [`cartRequestUpdate`](/reference/cartRequestUpdate/) — to the `POST /cart/update.js` endpoint;
* [`cartRequestClear`](/reference/cartRequestClear/) — to the `POST /cart/clear.js` endpoint.

</div>
<div class="{{ right_column_classes }}" markdown="1">

 ```html
<script type="module">
  import { cartRequestAdd } from {% include code/last-release-file-name.html asset_url=true %}

  cartRequestAdd({ 
    items: [
      {
        id: 40934235668668,
        quantity: 1
      }
    ]  
  });
</script>
 ```
 
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Get Cart State JSON
{:.mt-0}
 
State is a Javascript object where Liquid Ajax Cart keeps the information related to user's cart.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/state.html %}
 
</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Use the [`getCartState`](/reference/getCartState/) function to get the current state.

If you want to run your Javascript code every time when the state is changed — use the [`subscribeToCartStateUpdate`](/reference/subscribeToCartStateUpdate/) function to subscribe to state updates.

</div>
<div class="{{ right_column_classes }}" markdown="1">

 ```html
<script type="module">
  import { getCartState, subscribeToCartStateUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  const initialState = getCartState();
  console.log('Initial state: ', InitialState);

  subscribeToCartStateUpdate( state => {
    console.log('Updated state: ', state);
  });
</script>
```
 
</div>
</div>
