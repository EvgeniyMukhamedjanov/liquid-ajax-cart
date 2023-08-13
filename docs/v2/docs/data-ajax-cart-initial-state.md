---
title: data-ajax-cart-initial-state
layout: docs-v2
---

# data-ajax-cart-initial-state

<p class="lead" markdown="1">
An attribute which helps Liquid Ajax Cart find the user cart data during initialization.
</p>

## How it works 

Liquid Ajax Cart needs to know user cart state: what products are in the cart, what total price is, what discounts are applied etc.

To provide this data, you should convert the Shopify [`cart`](https://shopify.dev/docs/api/liquid/objects/cart) object to JSON format
and wrap it in the `script` tag with the `data-ajax-cart-initial-state` attribute.

{%- capture highlight_code -%}
{% raw %}
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

If Liquid Ajax Cart doesn't find the `data-ajax-cart-initial-state` script, 
it performs a Shopify Cart API Ajax request to get the cart state.

