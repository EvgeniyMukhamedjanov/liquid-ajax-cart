---
title: data-ajax-cart-section-scroll
layout: docs-v2
---

# data-ajax-cart-section-scroll

<p class="lead" markdown="1">
An attribute which keeps the scroll position of an element unchanged
when the parent [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) container is re-rendered.
</p>

## How it works

When you have a scrollable area inside a [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) container, 
the scroll position of them will be reset to top every time when the `data-ajax-cart-section` container is re-rendered.
It happens because the HTML of a `data-ajax-cart-section` container is completely replaced with a new one during re-rendering.

In order to prevent the scroll reset, Liquid Ajax Cart remembers scroll positions of the `data-ajax-cart-section-scroll` elements 
and restores them after the HTML of the parent `data-ajax-cart-section` container is replaced.

## Single scrollable area

Add the `data-ajax-cart-section-scroll` attribute to a scrollable element so that Liquid Ajax Cart keeps the scroll position unchanged.

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

Add the `data-ajax-cart-section-scroll` attribute with unique names to scrollable elements so that Liquid Ajax Cart can distinguish them after re-rendering.

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

