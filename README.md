# Liquid Ajax Cart — for Shopify

Liquid Ajax Cart — a Javascript library that lets you build an AJAX cart using Liquid templates.

##### 1. Create a liquid section for AJAX cart with a `data-ajax-cart-section` container:

```liquid
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div data-ajax-cart-section >
  <h2>Cart</h2>
  
  {% for item in cart.items %}  
    <a href="{{ item.url }}">{{ item.title }}</a> <br />
    Price: {{ item.final_price | money }} <br />

    Quantity: 
      <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | minus: 1 }}"><i>-</i></button>
      {{ item.quantity }}
      <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | plus: 1 }}"><i>+</i></button> <br />

    Total: <strong>{{ item.final_line_price | money }}</strong> <br /> <br />  
  {% endfor %}
  
  <button> Checkout — {{ cart.total_price | money_with_currency }} </button>
</div>

{% schema %} { "name": "Ajax Cart" } {% endschema %}
```

##### 2. Include the section and [liquid-ajax-cart.js](https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/blob/main/_dist/liquid-ajax-cart.js) in your theme.liquid 
```liquid
{% comment %}
  Put this code within <body> tag —
  in a place where you want the ajax-cart section to appear
{% endcomment %}

{% section 'ajax-cart' %}

<script type="module">
  import '{{ 'liquid-ajax-cart.js' | asset_url }}';
</script>
```

Once it is done, Liquid Ajax Cart will ajaxify product forms and update the `ajax-cart` section whenever a user submits a form or clicks `+` or `−` buttons in the `ajax-cart` section.

### Demo
The [liquid-ajax-cart.myshopify.com](https://liquid-ajax-cart.myshopify.com/) development store demonstrates features of Liquid Ajax Cart.

Password — `liquid-ajax-cart`

The store uses "Minimal" theme from Shopify that doesn't have Ajax-cart related functionality out of the box, in order to show how to build that functionality from scratch.

The store's codebase lives in the main branch of this repository — folders `assets`, `config`, `layout`, `locales`, `sections`, `snippets` and `templates`.

## Content

* [Ajaxified Liquid sections](#ajaxified-liquid-sections)
  * [data-ajax-cart-section](#data-ajax-cart-section)
* [Buttons](#buttons)
  * [data-ajax-cart-quantity-button](#data-ajax-cart-quantity-button)
  * [data-ajax-cart-toggle-class-button](#data-ajax-cart-toggle-class-button)
* [Product forms](#product-forms)
  * [data-ajax-cart-form-error](#data-ajax-cart-form-error)
* [Body CSS classes](#body-css-classes)
  * .js-ajax-cart-set
  * .js-ajax-cart-empty
  * .js-ajax-cart-request-in-progress
* [State](#state)
  * [data-ajax-cart-bind-state](#data-ajax-cart-bind-state)
  * [Javascript State Api](#javascript-state-api)
    * getState()
    * `subscribeToCartState( callback )`
* AJAX Cart API requests


## Ajaxified Liquid sections

Before pefroming another AJAX request, Liquid Ajax Cart runs through HTML code of a page looking for Shopify sections that should be updated after the request. 

Then it modifies the request in order to ask Shopify to re-render those section and provide updated HTML for them.

After request is performed, Liquid Ajax Cart pulls out the new HTML from the request response and updates the sections' code.

### data-ajax-cart-section

A container with the `data-ajax-cart-section` attribute within a section is a sign for Liquid Ajax Cart that the section should be updated after another AJAX request.

The container must be a root HTML element in a section.

##### Correct:
```liquid
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div data-ajax-cart-section class="any-class">
  <!-- section content -->
</div>
```

##### Will not work. The [data-ajax-cart-section] container is not a root element:
```liquid
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<section class="any-class">
  <div data-ajax-cart-section>
    <!-- section content -->
  </div>
</section>
```

## Buttons

### data-ajax-cart-quantity-button

Changes quantity of a cart item on a user's click. 

As a parameter it takes a string with a [line item's key](https://shopify.dev/api/liquid/objects/line_item#line_item-key) followed by the vertical bar symbol (**|**) followed by a new quantity value:

```liquid
<button data-ajax-cart-quantity-button=" 17285644550:70ff98a797ed385f6ef25e6e974708ca | 15 " > Change quantity to 15 </button>

{% comment %}
  Mostly these buttons are used within a loop of cart items:
{% endcomment %}

{% for line_item in cart.items %}
  Quantity:
  <button data-ajax-cart-quantity-button=" {{ line_item.key }} | {{ line_item.quantity | minus: 1 }} "> Minus 1 </button>
  {{ line_item.quantity }}
  <button data-ajax-cart-quantity-button=" {{ line_item.key }} | {{ line_item.quantity | plus: 1 }} "> Plus 1 </button>
  
  <a data-ajax-cart-quantity-button=" {{ line_item.key }} | 0 "> Remove </a>
{% endfor %}
```
The button becomes not active if Liquid Ajax Cart is performing any AJAX request. After all requests are finished, the button becomes active again.

If there is an AJAX request in progress, the `body` tag has `js-ajax-cart-request-in-progress` CSS class (see [Body CSS classes](#body-css-classes)). Thus you can make `data-ajax-cart-quantity-button` buttons look disabled when they are not active:

```css
.js-ajax-cart-request-in-progress [data-ajax-cart-quantity-button] {
  opacity: .5;
}
```

The button is used for `+` and `−` buttons on the demo store within the right-side cart.

### data-ajax-cart-toggle-class-button

Takes a CSS class as a parameter and adds the CSS class to the `body` tag on a user's click. If the `body` tag has the CSS class then it will be removed from the `body`.

The usecase is "Show/Hide Cart" button. It is used in the header of the demo store: "Cart" link shows and hides the right-side cart.

```liquid

{% comment %}
  Liquid Ajax Cart will intercept a user's click on the following link
  and instead of redirecting to "/cart" it will add/remove the "js-ajax-cart-opened" <body> class
{% endcomment %}

<a href="/cart" data-ajax-cart-toggle-class-button="js-ajax-cart-opened" > Cart </button>

<div class="mini-cart">
  <!-- Cart content -->
</div>

<style>
  .mini-cart { display: none; }
  .js-ajax-cart-opened .mini-cart { display: block; }
</style>

```

## Product forms

Liquid Ajax Cart ajaxifies product forms once it is loaded. 

When a user submits a product form, Liquid Ajax Cart sends an AJAX "add to cart" request and blocks the form until the request is finished to prevent double submissions. Once the request is sent, Liquid Ajax Cart adds `js-ajax-cart-form-in-progress` CSS class to the form and `js-ajax-cart-button-in-progress` CSS class to the submit button of the form. The classes get removed after the request is finished.

Show a loading indicator and make the button visually disabled if the classes are attached to your product form.

### data-ajax-cart-form-error
Add a container with `data-ajax-cart-form-error` attribute within a product form and Liquid Ajax Cart will put error messages of AJAX requests in it, if happen:
```liquid
{% form 'product', product %}

  <!-- form's code ... -->

  <div data-ajax-cart-form-error ></div>
  
  <!-- ... form's code -->
  
{% endform %}
```
Live example of showing errors is on the [Limited Product](https://liquid-ajax-cart.myshopify.com/products/limited-product) page of the demo store.

## Body CSS classes

Liquid Ajax Cart adds CSS classes to the `body` tag depending on a current state of a user's cart.

- `.js-ajax-cart-set` — if Liquid Ajax Cart has been loaded and got information about a user's cart state;
- `.js-ajax-cart-empty` — if a user's cart is empty;
- `.js-ajax-cart-request-in-progress` — if Liquid Ajax Cart has an AJAX request in progress.

## State

State is a Javascript object where Liquid Ajax Cart keeps the information related to user's cart.

If a cart is empty, the state will looks like this:
```json
{
  "cart":{
    "token":"b7d3743e2c398043f209c5a3a9014f9d",
    "note":null,
    "attributes":{},
    "original_total_price":1000,
    "total_price":1000,
    "total_discount":0,
    "total_weight":0,
    "item_count":1,
    "items":[],
    "requires_shipping":false,
    "currency":"USD",
    "items_subtotal_price":1000,
    "cart_level_discount_applications":[]
  },
  "status":{
    "requestInProgress":false,
    "cartStateSet":true
  }
}
```
The state object gets updated after each AJAX request.

### data-ajax-cart-bind-state

Add the `data-ajax-cart-bind-state` attribute to an HTML element with a path to a state value as a parameter and Liquid Ajax Cart will keep the text content of the element in sync with the state value.

```liquid
{% comment %}
  Liquid expression {{ cart.item_count }} displays amount of items in a cart,
  data-ajax-cart-bind-state updates the HTML of the element when the cart.item_count state value is changed
{% endcomment %}

<div data-ajax-cart-bind-state="cart.item_count" > {{ cart.item_count }} </div>
```

On the demo store it is used to show the amount of cart items next to the "Cart" link in the header.

### Javascript State API

getCartState() — returns the current state

subscribeToCartState( callback ) — callback will be called after cart state is changed


## Perform custom requests

*After each call the cart state will be updated, the ajax-cart sections will be rerendered.*

cartGet() — calls /cart.js

cartAdd( body ) - calls /cart/add.js

cartChange( body ) — calls /cart/change.js

subscribeToAjaxAPI( callback ) — callback will be called before and after each cart request
