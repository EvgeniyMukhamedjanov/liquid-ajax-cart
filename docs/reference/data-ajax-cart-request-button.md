# data-ajax-cart-request-button

Add the `data-ajax-cart-request-button` to links that lead to [`routes.cart_add_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_add_url), [`routes.cart_change_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_change_url), [`routes.cart_clear_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_clear_url) and [`routes.cart_update_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_update_url) ajaxify them.

The most popular usecase is "Plus", "Minus" and "Remove" buttons for a cart line item.

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
          <a data-ajax-cart-request-button
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
            Minus one 
          </a>

          {{ item.quantity }}

          <a data-ajax-cart-request-button 
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
            Plus one 
          </a>
        </div>

        <div>Total: <strong>{{ item.final_line_price | money }}</strong></div>
      {% endfor %}
    </div>
    
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </div>
</form>
```
{% endraw %}

If you can't use links, Liquid Ajax Cart still offers the same functionality for any HTML element. Add the `data-ajax-cart-request-button` attribute to an HTML element, a `{{ routes.cart_*_url }}` as a value, and it will work the same way:

{% raw %}
```html
<button data-ajax-cart-request-button="{{ routes.cart_change_url }}?line={{ forloop.index }}&quantity={{ item.quantity | minus: 1 }}" > 
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

## Inactive state

The `data-ajax-cart-request-button` elements become inactive when there is a [Cart Ajax API request](/reference/requests/) in progress.

Liquid Ajax Cart adds the [`js-ajax-cart-request-in-progress`](/reference/js-ajax-cart-request-in-progress/) CSS class to the body tag so you can show a loading indicator or make the controls visually disabled.
