# data-ajax-cart-request-button

Add the `data-ajax-cart-request-button` to links that lead to [`routes.cart_add_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_add_url), [`routes.cart_change_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_change_url), [`routes.cart_clear_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_clear_url), [`routes.cart_update_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_update_url) and [`line_item.url_to_remove`](https://shopify.dev/api/liquid/objects/line_item#line_item-url_to_remove) to ajaxify them.

The most popular usecases are "Plus", "Minus" and "Remove" buttons for a cart line item:
{% raw %}
``` html
<form action="{{ routes.cart_url }}" method="post">
  <div data-ajax-cart-section>
    <h2>Cart</h2>
    
    <div class="my-cart__items">
      {% for item in cart.items %}
        {% assign item_index = forloop.index %}
        <div><a href="{{ item.url }}">{{ item.title }}</a></div>

        <div>
          Quantity:

          <!-- Ajaxified "Minus one" button -->
          <a data-ajax-cart-request-button
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
            Minus one 
          </a>

          {{ item.quantity }}

          <!-- Ajaxified "Plus one" button -->
          <a data-ajax-cart-request-button 
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
            Plus one 
          </a>
        </div>

        <div>Total: <strong>{{ item.final_line_price | money }}</strong></div>

        <!-- Ajaxified "Remove" button -->
        <a data-ajax-cart-request-button href="{{ item.url_to_remove }}">
          Remove
        </a>
      {% endfor %}
    </div>
    
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </div>
</form>
```
{% endraw %}

An "Add to cart" button without a form:
{% raw %}
```html
<!-- "id" parameter is a variant id -->
<a href="{{ routes.cart_add_url }}?id=40875540775100&quantity=1" data-ajax-cart-request-button>Add to cart</a>
```
{% endraw %}

A "Clear cart" button:
{% raw %}
```html
<a href="{{ routes.cart_clear_url }}" data-ajax-cart-request-button>Clear cart</a>
```
{% endraw %}

### Not only for links

It is a good practice to use `routes.cart_*_url` links for those buttons because they will work even without JavaScript.

But if you can't use the `a` tag with the `href` parameter, Liquid Ajax Cart still offers the same functionality for any HTML element: add the `data-ajax-cart-request-button` attribute to an HTML element and provide a `routes.cart_*_url` route as an attribute's value:

{% raw %}
```html
<button data-ajax-cart-request-button="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" >
  Minus one 
</button>

<div data-ajax-cart-request-button="{{ routes.cart_change_url }}?id={{ item.key }}&quantity=0" > 
  Remove
</div>

<span data-ajax-cart-request-button="{{ routes.cart_clear_url }}" > 
  Clear cart
</div>
``` 
{% endraw %}

### Inactive state

The `data-ajax-cart-request-button` elements become inactive when there is a [Cart Ajax API request](/reference/requests/) in progress.

Liquid Ajax Cart adds the [`js-ajax-cart-request-in-progress`](/reference/js-ajax-cart-request-in-progress/) CSS class to the body tag so you can show a loading indicator or make the controls visually disabled.
