---
title: js-ajax-cart-empty
layout: docs-v2
---

# js-ajax-cart-empty

<p class="lead" markdown="1">
A CSS class which is appended to the `html` tag when the user cart is empty.
</p>

## Example

Hiding the cart quantity number in the header not to show "(0)":

{%- capture highlight_code -%}
{% raw %}
<span class="header__cart-quantity">
  (
  <span data-ajax-cart-bind="item_count">
    {{ cart.item_count }}
  </span>
  )
</span>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/header.liquid" language="liquid" code=highlight_code %}

{%- capture highlight_code -%}
html.js-ajax-cart-empty .header__cart-quantity {
  display: none;
}

{%- endcapture -%}
{% include v2/codeblock.html title="assets/style.css" language="css" code=highlight_code %}