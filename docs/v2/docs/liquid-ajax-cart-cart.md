---
title: liquidAjaxCart.cart 
layout: docs-v2
---

# liquidAjaxCart.cart

<p class="lead" markdown="1">
A read-only property that keeps the current cart state data. 
</p>

## How it works

After each successful Shopify Cart API Ajax request, Liquid Ajax Cart pulls the cart state data from the response and remembers the data.
If a request is successful but the response doesn't have the cart state data (the `/cart/add.js` response is the case),
Liquid Ajax Cart performs an additional `/cart/update.js` request to get the data.

Use the `liquidAjaxCart.cart` property to read the latest cart state data.

As the `liquidAjaxCart.cart` is updated after a Shopify Cart API Ajax request, 
listen to the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event 
if you need to run your JavaScript when the cart state is updated.  

## Structure

{%- capture highlight_code -%}

console.log(window.liquidAjaxCart.cart);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Result:

{%- capture highlight_code -%}
{
  "token":"b7d3743e2c398043f209c5a3a9014f9d",
  "note":null,
  "attributes":{},
  "original_total_price":1000,
  "total_price":1000,
  "total_discount":0,
  "total_weight":0,
  "item_count":1,
  "items":[{…}],
  "requires_shipping":false,
  "currency":"USD",
  "items_subtotal_price":1000,
  "cart_level_discount_applications":[]
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}