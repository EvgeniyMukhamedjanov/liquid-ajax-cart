# Liquid Ajax Cart — Ajax carts for Shopify

Liquid Ajax Cart — a Javascript library that lets you build Ajax carts using Liquid templates.

No Javascript code needed.

##### 1. Create a theme section for the cart with a `data-ajax-cart-section` container

```liquid
{% comment %} sections/my-cart.liquid {% endcomment %}

<div data-ajax-cart-section >
  <h2>Cart</h2>
  
  {% for item in cart.items %}  
    <a href="{{ item.url }}">{{ item.title }}</a> <br />
    Price: {{ item.final_price | money }} <br />

    Quantity: 
      <a href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity={{ item.quantity | minus: 1 }}" 
      > Minus one </a>
      {{ item.quantity }}
      <a href="{{ routes.cart_change_url }}?id={{ item.key }}&quantity={{ item.quantity | plus: 1 }}" 
      > Plus one </a> <br />

    Total: <strong>{{ item.final_line_price | money }}</strong> <br /> <br />  
  {% endfor %}
  
  <button> Checkout — {{ cart.total_price | money_with_currency }} </button>
</div>

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

:tada: That's it!

Liquid Ajax Cart will ajaxify the `{{ routes.cart_change_url }}` links, all product forms and `data-ajax-cart-section` sections. The links and product forms will update the cart without page reloading and the cart section will get updated each time when the cart is changed.

Liquid Ajax Cart provides Javascript API as well.

Check out all features on the [documentation](https://liquid-ajax-cart.js.org) website.

## The repository content

 * `docs` folder — the [documentation](https://liquid-ajax-cart.js.org) website;
 * `_src` folder — the library sources;
 * `assets`, `config`, `layout`, `locales`, `sections`, `snippets`, `templates` folders — the [demo store](https://liquid-ajax-cart.myshopify.com) theme sources. The password of the store — `liquid-ajax-cart`.
