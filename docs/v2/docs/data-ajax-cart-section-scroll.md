---
title: data-ajax-cart-section-scroll
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-section-scroll

<p class="lead" markdown="1">
The attribute keeps the scroll position unchanged of a container when the parent [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) HTML gets updated.
</p>

If you have a scrollable area within a [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) section, 
the scroll position will be reset to top every time when the cart is changed because the section’s HTML will be completely replaced with a new one.

In order to prevent the scroll reset, Liquid Ajax Cart remembers scroll positions of the `data-ajax-cart-section-scroll` elements 
and restore them after the parent `data-ajax-cart-section` section HTML update.

## Single scrollable area

Add the `data-ajax-cart-section-scroll` attribute to a scrollable area and Liquid Ajax Cart will keep the scroll position unchanged.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>
  <div class="my-cart__items" data-ajax-cart-section-scroll>
    <!-- Scrollable area for cart items -->
  </div>

  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Multiple scrollable areas

Add the data-ajax-cart-section-scroll attribute with unique names to scrollable areas so Liquid Ajax Cart can distinguish them after HTML update.

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>
  <div class="my-cart__items" data-ajax-cart-section-scroll="main">
    {% for item in cart.items %}
      <div class="line-item" data-ajax-cart-section-scroll="{{ item.key }}">
        <!-- Despite it sounds crazy, lets imagine that each line-item container is scrollable.
        Thus it needs the data-ajax-cart-section-scroll attribute with a unique name -->
      </div>
    {% endfor %}
  </div>

  <form id="my-ajax-cart-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "My Ajax cart" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

