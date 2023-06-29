---
title: js-ajax-cart-set
layout: docs-v2
disable_anchors: true
---

# js-ajax-cart-set

<p class="lead" markdown="1">
Liquid Ajax Cart adds the `js-ajax-cart-set` CSS class to the `html` tag when it is successfully loaded.
</p>

Hiding the "Update" button on the cart page, as all the elements are ajaxified and no need to apply the changes manually:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart-page" data-ajax-cart-section>
  <h2>Cart page</h2>

  <div class="my-cart-page__items">
    <!-- Cart items -->
  </div>

  <form id="my-cart-page-form" action="{{ routes.cart_url }}" method="post">
    <button type="submit" name="update" class="my-cart-page__update-button">
      Update
    </button>
    <button type="submit" name="checkout">
      Checkout — {{ cart.total_price | money_with_currency }}
    </button> 
  </form>
</div>

{% schema %} { "name": "Cart page" } {% endschema %}
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-cart.liquid" language="liquid" code=highlight_code %}

{%- capture highlight_code -%}
html.js-ajax-cart-set .my-cart-page__update-button {
  display: none;
}
{%- endcapture -%}
{% include v2/codeblock.html title="assets/style.css" language="css" code=highlight_code %}



