# data-ajax-cart-request-button

Liquid Ajax Cart ajaxifies all the links that lead to [`routes.cart_add_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_add_url), [`routes.cart_change_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_change_url), [`routes.cart_clear_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_clear_url) and [`routes.cart_update_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_update_url). 

It is recommended to make buttons that change the cart state (like "Plus one", "Minus one", "Remove", "Clear cart", etc.) using links with those routes without any `data-ajax-cart-` attribute because they will work even if Liquid Ajax Cart is not loaded.

{% include code/section.html %}

if you can't use links, Liquid Ajax Cart still offers the same functionality for any HTML element. Add the `data-ajax-cart-request-button` attribute to a HTML element, a cart mutation route as a value, and it will work the same way as the ajaxfied links:


{% raw %}
```html
<button data-ajax-cart-request-button="{{ routes.cart_change_url }}?id={{ item.key }}&quantity={{ item.quantity | minus: 1 }}" > 
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
