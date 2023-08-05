---
title: requestErrorText
layout: docs-v2
disable_toc: true
---

# requestErrorText

<p class="lead" markdown="1">
  The configuration parameter sets the error message text that will appear in [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) containers when a Shopify Cart API Ajax request is failed and doesn't have any error description, or if the request is not performed at all due to the Internet connection.
</p>

By default, the text is "There was an error while updating your cart. Please try again.".

Use the [`conf`](/v2/docs/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart) object to set your value:
{%- capture highlight_code -%}
liquidAjaxCart.conf("requestErrorText", "My request error message");
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}