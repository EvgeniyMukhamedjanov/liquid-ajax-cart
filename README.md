# Liquid Ajax Cart — for Shopify


Liquid Ajax Cart — Javascript library that lets you build an Ajax cart using Liquid templates.

## Quick test with your theme

Before you start, ensure that you don't have any scripts which call `stopPropagation` method for `submit` events. Otherwise Liquid Ajax Cart will not be able to handle "Add to Cart" user's actions.

##### 1. Create a liquid section for Ajax-cart with a `data-ajax-cart-section` container:

```liquid
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div data-ajax-cart-section>
  <h2>Cart</h2>
  
  <div>
    {% for item in cart.items %}
      <div>
      	<p>
      	  <a class="h3" href="{{ item.url }}">{{ item.product.title }}</a> <br/>
          {% unless item.product.has_only_default_variant %}
            <small>{{ item.variant.title }}</small> <br/>
          {% endunless %}
          <small> Price: {{ item.final_price | money }} </small>
        </p>

        <div>
          Quantity: 
          <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | minus: 1 }}"><i>-</i></button>
          {{ item.quantity }}
          <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | plus: 1 }}"><i>+</i></button>
        </div>

        <div> Total: <strong>{{ item.final_line_price | money }}</strong> </div>
        <div><a href="javascript:;" data-ajax-cart-quantity-button="{{ item.key }} | 0"><small>Remove</small></a></div>
      </div>
    {% endfor %}
  </div>
  <div> <a href="#checkout-route">Checkout — {{ cart.total_price | money_with_currency }}</a> </div>
</div>

{% schema %}
{
  "name": "Ajax Cart"
}
{% endschema %}
```

##### 2. Include the section and [liquid-ajax-cart.js](https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/blob/main/_dist/liquid-ajax-cart.js) in your theme.liquid 
```liquid
{% section 'ajax-cart' %}

<script type="module">
  import '{{ 'liquid-ajax-cart.js' | asset_url }}';
</script>
```
 
##### 3. Specify a place for product forms error messages
```liquid
{% form 'product', product %}
  
  <!-- product form's code ... -->
  
  <div data-ajax-cart-form-error></div>
  
  <!-- ... product form's code -->
  
{% endform %}
```

That's it. 

Liquid Ajax Cart requests new HTML for all the sections with a `data-ajax-cart-section` container after user's cart state is changed. 

Also Liquid Ajax Cart intercepts all product forms submitions and sends ajax requests instead.

## Demo
The [liquid-ajax-cart.myshopify.com](https://liquid-ajax-cart.myshopify.com/) development store demonstrates features of Liquid Ajax Cart and how to build Ajax-cart functionality from scratch.

Password — `liquid-ajax-cart`

The store uses "Minimal" theme from Shopify that doesn't have Ajax-cart related functionality out of the box.

The store's codebase lives in the main branch of this repository: folders `assets`, `config`, `layout`, `locales`, `sections`, `snippets` and `templates`.

## Documentation ( in process )

*in process - in process - in process*

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
