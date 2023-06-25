---
title: Guide
layout: full
disable_anchors: true
---

{% assign last_release_file = blank %}
{% assign last_release_slice = '/releases/last/liquid-ajax-cart-v' %}
{% for file in site.static_files %}
    {% assign file_slice = file.path | slice: 0, last_release_slice.size %}
    {% if last_release_slice == file_slice %}
        {% assign last_release_file = file %}
    {% endif %}
{% endfor %}

{% assign row_classes = 'guide-row' %}
{% assign left_column_classes = 'guide-row__col' %}
{% assign right_column_classes = 'guide-row__col' %}


<div class="{{ row_classes }} guide-row--50">
<div class="guide-row__col lead">
<p>Liquid Ajax Cart turns Shopify “Add to cart” form submissions into Ajax requests and updates cart sections using <a href="https://shopify.dev/api/ajax/reference/cart#bundled-section-rendering" target="_blank">Bundled Section Rendering</a>.</p>
<p>It lets developers build Shopify Ajax carts using plain Liquid templates.</p>
<p>Liquid Ajax Cart doesn't apply any CSS styles.</p>
</div>
<div class="guide-row__col">
  <div class="star-promo">
    <div class="star-promo__text">
      <p>Liquid Ajax Cart is not free.</p>
      <p>It is distributed in exchange for GitHub stars!</p>
      <p>A star must be sent as soon as you like the project. <br/>;-)</p>
    </div>
    <p class="star-promo__name">— Evgeniy Mukhamedjanov, dev <img src="https://github.com/EvgeniyMukhamedjanov.png?size=62" width="26" height="26" alt="Evgeniy Mukhamedjanov's photo" /></p>
    <div>
        <a class="github-button" href="https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/" data-size="large" data-icon="octicon-star" aria-label="Liquid Ajax Cart on GitHub">Give a star</a>
    </div>
  </div>
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="guide-row__col" markdown="1">
### Installation
</div>
</div>

<div class="{{ row_classes }} guide-row--50">
<div class="guide-row__col" markdown="1">
##### Manual
 
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
 
Upload the <a href="{{ last_release_file.path }}" download >{% include code/last-release-file-name.html %}</a> file to your Shopify theme's `asset` folder and include it in the `layout/theme.liquid` template.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/v1/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another Shopify Cart API request to get the cart state.

</div>
<div class="guide-row__col" markdown="1">
<h5>Via npm</h5>
 
<div markdown="1">
```
npm install liquid-ajax-cart
```

```javascript
// Your JavaScript module
import 'liquid-ajax-cart';
```
 
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
```
{% endraw %}

Import the `liquid-ajax-cart` package to a JavaScript module that is going to be processed by Webpack or any other bundler.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/v1/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another Shopify Cart API request to get the cart state.
</div>
 
</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1" style="position: relative;">
 
### Create an Ajax cart section
 
Feel free to use any Liquid tags, objects and filters.

<div class="code-side-note-data-ajax-cart-section"  markdown="1">
Add the [`data-ajax-cart-section`](/v1/reference/data-ajax-cart-section/) attribute to any HTML container — Liquid Ajax Cart reloads HTML of the containers every time when the Shopify cart gets updated.
</div>

<div markdown="1" class="code-side-note" style="top: 716px;">
##### Buttons

Use links to {% raw %}`{{ routes.cart_change_url }}`{% endraw %} for "Plus", "Minus" and "Remove" buttons. Add the [`data-ajax-cart-request-button`](/v1/reference/data-ajax-cart-request-button/) to ajaxify them.
</div>
  
<div markdown="1" class="code-side-note" style="top: 842px;">
##### Quantity inputs
    
Add the [`data-ajax-cart-quantity-input`](/v1/reference/data-ajax-cart-quantity-input/) attribute to an input element that displays a cart item's quantity to ajaxify it.
</div>
  
<div markdown="1" class="code-side-note" style="top: 422px;">
##### Property inputs

Add the [`data-ajax-cart-property-input`](/v1/reference/data-ajax-cart-property-input/) attribute to a line item property input to ajaxify it. The attribute also supports checkboxes, radio buttons, `select` and `textarea` tags.
</div>
<div markdown="1" class="code-side-note code-side-note--p" style="top: 1288px;">
The [`data-ajax-cart-property-input`](/v1/reference/data-ajax-cart-property-input/) attribute works with the Shopify cart note and cart attributes as well.
</div>
  
<div markdown="1" class="code-side-note" style="top: 1115px;">
##### Error messages

Use a container with the [`data-ajax-cart-messages`](/v1/reference/data-ajax-cart-messages/) attribute to show cart item's error messages.
</div>
  
<div markdown="1" class="code-side-note" style="top: 191px;">
##### Scrollable areas

If you have a scrollable area within the section, add the [`data-ajax-cart-section-scroll`](/v1/reference/data-ajax-cart-section-scroll/) attribute to the area — Liquid Ajax Cart keeps the scroll position unchanged while updating sections' HTML.
</div>

<div markdown="1" class="code-side-note" style="top: 1430px;">
##### Immutable containers

If you want to have an immutable HTML element, for example for a third-party app — add the [`data-ajax-cart-static-element`](/v1/reference/data-ajax-cart-static-element/) attribute to this element. HTML of an immutable container will *not* be replaced when its section gets updated.
</div>
 
</div>
<div class="{{ right_column_classes }} code-with-notes" markdown="1">

{% include code/section.html %}
  
</div>
</div>
 
<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Include the section to the place where you want to display the Shopify Ajax cart.

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

Buttons, quantity and property inputs become inactive when the cart is getting updated. 
 
Liquid Ajax Cart adds the [`js-ajax-cart-request-in-progress`](/v1/reference/js-ajax-cart-request-in-progress/) CSS class to the `body` tag during the updating process so you can show a loading indicator or make the controls visually disabled.
 
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

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### JavaScript callback

If you want to run your JavaScript code after a Shopify Ajax cart section is updated — use the [`subscribeToCartSectionsUpdate`](/v1/reference/subscribeToCartSectionsUpdate/) function.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">

```html
<script type="module">
  import { subscribeToCartSectionsUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  subscribeToCartSectionsUpdate( sections => {
    console.log('Sections are updated: ', sections);
    // Place your code here
  });
</script>
```

</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">
 
### Enhance product forms
 
Liquid Ajax Cart ajaxifies all Shopify product forms. <br/> If you want to exclude some of them — use the [`productFormsFilter`](/v1/reference/productFormsFilter/) configuration parameter.

</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### Error messages
 
Add the [`data-ajax-cart-messages`](/v1/reference/data-ajax-cart-messages/) attribute with the `form` value to a container within product forms to show error messages.

</div>
<div class="{{ right_column_classes }}" markdown="1">
  
{% include code/data-ajax-cart-form-error.html %}
 
</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

##### Loading state
 
When a user submits a product form, it becomes and remains inactive until the Ajax "Add to cart" request is finished to prevent accidental double submissions.
  
Liquid Ajax Cart adds the [`js-ajax-cart-form-in-progress`](/v1/reference/js-ajax-cart-form-in-progress/) CSS class to the form if the request is in progress so you can show a loading indicator or make the submit button visually disabled.
  
</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/js-ajax-cart-form-in-progress.html %}

</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Show/hide a cart section on a button click

Write some CSS to show your Shopify Ajax cart section if a specific `body` CSS class exists.

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

Add the [`data-ajax-cart-toggle-class-button`](/v1/reference/data-ajax-cart-toggle-class-button/) attribute with the CSS class as a value to the button that have to show/hide the cart — the button will add/remove the CSS class on a user's click.

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

### Show a cart section after adding a product to the cart

Write some CSS to show your Shopify Ajax cart section if a specific `body` CSS class exists.

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

Use the [`addToCartCssClass`](/v1/reference/addToCartCssClass/) configuration parameter to specify the CSS class that should be attached to the `body` tag after successful adding a product to the cart.

The parameter also lets you define the time after which the class should be removed.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "addToCartCssClass": "js-my-cart-open"
  }
</script>
```
{% endraw %}

</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Display Shopify cart's total price and items counter outside of Ajax cart sections
 
Add the [`data-ajax-cart-bind-state`](/v1/reference/data-ajax-cart-bind-state/) attribute to an HTML element, pass a Cart state property as an attribute's value and Liquid Ajax Cart will display the state property's value within the HTML element and refresh it when cart gets updated.

Explore all the properties on the [State reference](/v1/reference/state/) page.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/data-ajax-cart-bind-state.html %}

</div>
</div>

---

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

### Run your Javascript code before and after each Shopify Cart API request

Use the [`subscribeToCartAjaxRequests`](/v1/reference/subscribeToCartAjaxRequests/) function to add callbacks that will be called before and after Shopify Cart API requests.
 
</div>
<div class="{{ right_column_classes }}" markdown="1">


 ```html
<script type="module">
  import { subscribeToCartAjaxRequests } from {% include code/last-release-file-name.html asset_url=true %}

  subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {    
    // This function will be called before each Shopify Cart API request
    console.log( 'Before: ', requestState );
 
    subscribeToResult( requestState => {   
      // This function will be called after the request is finished
      console.log( 'After: ', requestState );
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
 
Use these function instead of direct Cart API calls and Liquid Ajax Cart will keep the Ajax cart sections, the State object and body CSS classes updated:

* [`cartRequestGet`](/v1/reference/cartRequestGet/) — sends a request to the `GET /cart.js` endpoint;
* [`cartRequestAdd`](/v1/reference/cartRequestAdd/) — to the `POST /cart/add.js` endpoint;
* [`cartRequestChange`](/v1/reference/cartRequestChange/) — to the `POST /cart/change.js` endpoint;
* [`cartRequestUpdate`](/v1/reference/cartRequestUpdate/) — to the `POST /cart/update.js` endpoint;
* [`cartRequestClear`](/v1/reference/cartRequestClear/) — to the `POST /cart/clear.js` endpoint.

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
 
[State](/reference/state/) is a Javascript object where Liquid Ajax Cart keeps the information related to the user's cart.

</div>
<div class="{{ right_column_classes }}" markdown="1">

{% include code/state.html %}
 
</div>
</div>

<div class="{{ row_classes }}">
<div class="{{ left_column_classes }}" markdown="1">

Use the [`getCartState`](/reference/getCartState/) function to get the current state.

If you want to run your JavaScript code every time when the state is changed — use the [`subscribeToCartStateUpdate`](/reference/subscribeToCartStateUpdate/) function to subscribe to state updates.

</div>
<div class="{{ right_column_classes }}" markdown="1">

 ```html
<script type="module">
  import { getCartState, subscribeToCartStateUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  const initialState = getCartState();
  console.log('Initial state: ', initialState);

  subscribeToCartStateUpdate( state => {
    console.log('Updated state: ', state);
  });
</script>
```
 
</div>
</div>
