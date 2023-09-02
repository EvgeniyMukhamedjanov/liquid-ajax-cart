---
layout: docs-v2
homepage: true
description: A Javascript library for building Shopify Ajax-carts using Liquid templates
title: Liquid Ajax Cart — Ajax Cart for Shopify
---

# Welcome

## Ajax "Add to cart"

{%- capture highlight_code -%}
{% raw %}
<ajax-cart-product-form>
  {% form 'product', product %}
    <!-- form content -->

    <button type="submit" name="add">
      Add to cart
    </button>
    <div data-ajax-cart-errors="form"></div>
  {% endform %}
</ajax-cart-product-form>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code %}

## Re-render Ajax-cart content

{%- capture highlight_code -%}
<div class="my-cart" data-ajax-cart-section>
  <!-- Cart content -->
</div>
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Cart item quantity control

{%- capture highlight_code -%}
{% raw %}
<ajax-cart-quantity>
  <a data-ajax-cart-quantity-minus href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ line_item.quantity | minus: 1 }}" >
    Minus one
  </a>

  <input data-ajax-cart-quantity-input="{{ line_item_index }}"
    name="updates[]" 
    value="{{ line_item.quantity }}" 
    type="number" />

  <a data-ajax-cart-quantity-plus href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ line_item.quantity | plus: 1 }}"> 
    Plus one 
  </a>
</ajax-cart-quantity>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

## Cart totals in header

{%- capture highlight_code -%}
{% raw %}
<span data-ajax-cart-bind="item_count" class="header__cart-quantity">
  {{ cart.item_count }}
</span>
<span data-ajax-cart-bind="total_price | money_with_currency" class="header__cart-total">
  {{ cart.total_price | money_with_currency }}
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

## CSS classes

## Events and JavaScript API

{% include v2/content/add-to-cart-class-example.html %}

## No styles