# data-ajax-cart-section-scroll

If you have a scrollable area within a [`data-ajax-cart-section`](/reference/data-ajax-cart-section/) section, the scroll position will be reset to top every time when the cart is changed because the section’s HTML will be completely replaced with a new one. 

Add the `data-ajax-cart-section-scroll` attribute to the scrollable area and Liquid Ajax Cart will keep the scroll position unchanged.

```html
{% raw %} <div data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    
    {% comment %}
        Scrollable area
    {% endcomment %}
    
  </div>

</div> {% endraw %}
```

If you have several scrollable areas, add the `data-ajax-cart-section-scroll` attribute with unique parameters so Liquid Ajax Cart can distinguish them after HTML update.

```html
{% raw %} <div data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="items" data-ajax-cart-section-scroll="main">

    {% for item in cart.items %}
      <div class="line-item" data-ajax-cart-section-scroll="{{ item.key }}">
        {% comment %}
          Despite it sounds crazy, lets imagine that each line-item is scrollable.
          Thus it needs the data-ajax-cart-section-scroll attribute with a unique parameter
        {% endcomment %}
      </div>
    {% endfor %}

  </div>

</div> {% endraw %}
```
