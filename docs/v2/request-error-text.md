---
title: requestErrorText
layout: docs-v2
---

# requestErrorText

<p class="lead" markdown="1">
A configuration parameter which sets the error message text 
that appears in [`data-ajax-cart-errors`](/v2/data-ajax-cart-errors/) containers 
when a Shopify Cart API Ajax request is failed and doesn't have any error description, 
or when the request is not performed at all due to the Internet connection.
</p>

## Code example

By default, the text is "There was an error while updating your cart. Please try again.".

Use the [`conf`](/v2/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object to set your value:
{%- capture highlight_code -%}
liquidAjaxCart.conf("requestErrorText", "My request error message");
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}