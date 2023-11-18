---
title: quantityTagDebounce
layout: docs-v2
---

# quantityTagDebounce

<p class="lead" markdown="1">
A configuration parameter which sets the debounce time in milliseconds for 
the quantity controls built using the [`<ajax-cart-quantity>`](/v2/ajax-cart-quantity/) custom tag.
</p>

## Code example

By default, the debounce time is 300 milliseconds. 
Use the [`conf`](/v2/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object to set
another value.

For example if you want the [`<ajax-cart-quantity>`](/v2/ajax-cart-quantity/) custom tag to start updating 
the quantity without any delay, set the value to 0:

{%- capture highlight_code -%}
liquidAjaxCart.conf("quantityTagDebounce", 0);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}