# Liquid Ajax Cart — Ajax carts for Shopify :fire:
 
Liquid Ajax Cart is a JavaScript asset for Shopify.

Ajaxifies Shopify cart sections and product forms like a :dark_sunglasses:boss.

No JavaScript code needed. 

JavaScript API is provided for customization. 

##### 1. Create a theme section for the cart with a `data-ajax-cart-section` container

```liquid
{% comment %} sections/my-cart.liquid {% endcomment %}

<form action="{{ routes.cart_url }}" method="post" class="my-cart">
  
  <!-- Add the data-ajax-cart-section attribute 
  to a container that must be re-rendered 
  when the user's cart gets changed -->
  <div data-ajax-cart-section>
    <h2>Cart</h2>
    
    <div class="my-cart__items" data-ajax-cart-section-scroll>
      {% for item in cart.items %}
        {% assign item_index = forloop.index %}
        <hr />  
        <div><a href="{{ item.url }}">{{ item.title }}</a></div>
        <div>Price: {{ item.final_price | money }}</div>

        <div>
          Quantity:
          
          <!-- Use routes.cart_change_url for "Plus", "Minus", "Remove" buttons,
          add the data-ajax-cart-request-button attribute to ajaxify them -->
          <a data-ajax-cart-request-button
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
            Minus one 
          </a>
          
          <!-- Add the data-ajax-cart-quantity-input attribute to quantity input fields -->
          <input data-ajax-cart-quantity-input="{{ item_index }}" name="updates[]" value="{{ item.quantity }}" type="number" />

          <a data-ajax-cart-request-button 
            href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
            Plus one 
          </a>
        </div>
        
        <!-- Place a data-ajax-cart-messages container for error messages -->
        <div data-ajax-cart-messages="{{ item.key }}"></div>

        <div>Total: <strong>{{ item.final_line_price | money }}</strong></div>
      {% endfor %}
    </div>
    
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </div>
</form>

{% schema %} { "name": "My Cart" } {% endschema %}
```

##### 2. Include the section and `liquid-ajax-cart.js` in your theme.liquid 
```liquid
{% comment %}
  Put this code within <body> tag —
  in a place where you want the ajax-cart section to appear
{% endcomment %}

{% section 'my-cart' %}

<script type="application/json" data-ajax-cart-initial-state >{{ cart | json }}</script>
<script type="module">
  import '{{ 'liquid-ajax-cart.js' | asset_url }}';
</script>
```

:tada: That's it! Product forms will be ajaxified automatically.

Check out all features on the [documentation](https://liquid-ajax-cart.js.org) website.

## The repository content

 * `docs` folder — the [documentation](https://liquid-ajax-cart.js.org) website;
 * `_src` folder — the library sources;
 * `assets`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates` folders — the [demo store](https://liquid-ajax-cart.myshopify.com) theme sources. The password of the store — `liquid-ajax-cart`.
