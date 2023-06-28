---
title: data-ajax-cart-initial-state
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-initial-state

<p class="lead" markdown="1">
The attribute helps Liquid Ajax Cart find user cart data during initial loading
</p>

Liquid Ajax Cart needs to know user cart state: what products are in the cart, what total price is, what discounts are applied etc.

In order to provide this data, convert the Shopify [`cart`](https://shopify.dev/docs/api/liquid/objects/cart) object to JSON
and wrap it to the `script` tag with the `data-ajax-cart-initial-state` attribute.

{%- capture highlight_code -%}
{% raw %}
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

If Liquid Ajax Cart doesn't find the `data-ajax-cart-initial-state` script, it will make a Shopify Cart API request to get the cart state.

