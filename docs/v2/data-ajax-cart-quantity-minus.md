---
title: data-ajax-cart-quantity-minus
layout: docs-v2
---

# data-ajax-cart-quantity-minus

<p class="lead" markdown="1">
An attribute which identifies a "Minus" button inside a [`<ajax-cart-quantity>`](/v2/ajax-cart-quantity/) custom tag.
</p>

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart ({{ cart.item_count }})</h2>

    <div class="my-cart__items" data-ajax-cart-section-scroll>
      {% for line_item in cart.items %}
        {% assign line_item_index = forloop.index %}
  
        <div><a href="{{ line_item.url }}">{{ line_item.title | escape }}</a></div>
        <div>Price: {{ line_item.final_price | money }}</div>

        <div>
          Quantity:
          <ajax-cart-quantity>
            <a data-ajax-cart-quantity-minus
              href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
              Minus one 
            </a>

            <!-- Item quantity input ajaxified by the "data-ajax-cart-quantity-input" attribute -->
            <input data-ajax-cart-quantity-input="{{ line_item_index }}"
              name="updates[]" 
              value="{{ item.quantity }}" 
              type="number" 
              form="my-ajax-cart-form" />

            <a data-ajax-cart-quantity-plus
              href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
              Plus one 
            </a>
          </ajax-cart-quantity>

        <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code highlight_lines="14" %}

Find more details on the [`<ajax-cart-quantity>`](/v2/ajax-cart-quantity/) page.