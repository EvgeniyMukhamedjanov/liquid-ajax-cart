---
title: quantityTagAllowZero
layout: docs-v2
---

# quantityTagAllowZero

<p class="lead" markdown="1">
A configuration parameter which allows a user to remove a product from the cart by 
clicking the `data-ajax-cart-quantity-minus` button and reaching the "0" value in a 
quantity control built using the [`<ajax-cart-quantity>`](/v2/ajax-cart-quantity/) custom tag.
</p>

## Code example

By default, the minimum value, that a user can reach by clicking a `data-ajax-cart-quantity-minus` button, 
is "1". Thus, a user can't remove an item from the cart by this way.

Use the [`conf`](/v2/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart) object to set 
the `quantityTagAllowZero` to `true` that lets a user reach the "0" value:
{%- capture highlight_code -%}
liquidAjaxCart.conf("quantityTagAllowZero", true);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}