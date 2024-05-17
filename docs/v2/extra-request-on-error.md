---
title: extraRequestOnError
layout: docs-v2
---

# extraRequestOnError

<p class="lead" markdown="1">
A configuration parameter which makes Liquid Ajax Cart send an additional request
when the current request has returned an error.
</p>

## Why it is needed

Sometimes Shopify responds with an error to a Shopify Cart API Ajax request but actually makes changes in the cart.
In order to get the updated cart state and HTML, Liquid Ajax Cart performs an additional `/cart/update.js` request.

If your Shopify store doesn't have this bug, you should switch this feature off to avoid sending redundant requests.

## Use cases

Let's say your Shopify store has a product with 5 items in stock. 
A user with the empty cart tries adding more items than in stock to the cart (for example 10).
All Shopify stores respond with an error message to such requests
but some of them also modify the user's cart by adding all available stock (5 items) to it.

A video example of this behavior is attached to the [corresponding GitHub issue](https://github.com/Shopify/dawn/issues/2994).

If the `extraRequestOnError` is `true`, Liquid Ajax Cart sends an additional request 
to get the updated cart state and HTML in order to fix this unexpected behavior.

The same behavior is noticed when a user has some items in the cart
and tries to change the quantity to add more items than available in stock.

If your Shopify store doesn't have this behavior 
you should consider set this configuration parameter to `false`
to avoid sending redundant requests.

Use the [`conf`](/v2/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object 
to switch the extra request off:
{%- capture highlight_code -%}
liquidAjaxCart.conf("extraRequestOnError", false);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}
