# data-ajax-cart-section-scroll

If you have a scrollable area within a `data-ajax-cart-section` section, add the `data-ajax-cart-section-scroll` attribute to it and Liquid Ajax Cart will restore the scroll position every time when HTML of the section is updated.

```html
{% raw %} <div data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="items" data-ajax-cart-section-scroll>
    {% for item in cart.items %}  
      
      {% comment %}
        Scrollable area
      {% endcomment %}

    {% endfor %}
  </div>

</div> {% endraw %}
```

If you have several scrollable areas, add the `data-ajax-cart-section-scroll` attribute with unique parameters so that Liquid Ajax Cart could distinguish them after HTML update.

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
