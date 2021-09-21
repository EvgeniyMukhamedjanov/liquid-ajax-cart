# Liquid Ajax Cart — for Shopify

Liquid Ajax Cart — a Javascript library that lets you build an Ajax cart using Liquid templates.

##### 1. Create a liquid section for Ajax-cart with a `data-ajax-cart-section` container:

```liquid
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div style="padding: 2em;" data-ajax-cart-section >
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

## Demo
The [liquid-ajax-cart.myshopify.com](https://liquid-ajax-cart.myshopify.com/) development store demonstrates features of Liquid Ajax Cart.

Password — `liquid-ajax-cart`

The store uses "Minimal" theme from Shopify that doesn't have Ajax-cart related functionality out of the box, in order to show how to build that functionality from scratch.

The store's codebase lives in the main branch of this repository — folders `assets`, `config`, `layout`, `locales`, `sections`, `snippets` and `templates`.

## Documentation ( in process )

*in process - in process - in process*

### Product forms
Liquid Ajax Cart ajaxifies product forms once it is loaded. 

When a user submits a product form, Liquid Ajax Cart sends an Ajax "add to cart" request and blocks the form until the request is finished to prevent double submissions. Once the request is sent, Liquid Ajax Cart adds `js-ajax-cart-form-in-progress` CSS class to the form and `js-ajax-cart-button-in-progress` CSS class to the submit button of the form. The classes get removed after the request is finished.

Show a loading indicator and make the button visually disabled if the classes are attached to your product form.

#### data-ajax-cart-form-error
Add a container with `data-ajax-cart-form-error` attribute within a product form and Liquid Ajax Cart will put error messages of Ajax requests in it, if happen:
```liquid
{% form 'product', product %}

  <!-- form's code ... -->

  <div data-ajax-cart-form-error ></div>
  
  <!-- ... form's code -->
  
{% endform %}
```

### HTML attributes

data-ajax-cart-section

data-ajax-cart-quantity-button

data-ajax-cart-section-toggle-class-button

data-ajax-cart-form-error

data-ajax-cart-bind-state

### Css Body classes

.js-ajax-cart-set

.js-ajax-cart-empty

.js-ajax-cart-request-in-progress

### Css Form classes

.js-ajax-cart-form-in-progress

.js-ajax-cart-button-in-progress


### Javascript Ajax API
*After each call the cart state will be updated, the ajax-cart sections will be rerendered.*

cartGet() — calls /cart.js

cartAdd( body ) - calls /cart/add.js

cartChange( body ) — calls /cart/change.js

subscribeToAjaxAPI( callback ) — callback will be called before and after each cart request

### Javascript Cart State API

getCartState() — returns the current state

subscribeToCartState( callback ) — callback will be called after cart state is changed
