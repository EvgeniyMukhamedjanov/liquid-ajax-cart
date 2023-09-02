---
title: liquidAjaxCart.cart 
layout: docs-v2
---

# liquidAjaxCart.cart

<p class="lead" markdown="1">
A read-only property of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object, which returns the current cart state data. 
</p>

## How it works

After each successful Shopify Cart API Ajax request, 
Liquid Ajax Cart retrieves the cart state data from the response and saves it the in the `liquidAjaxCart.cart` property.
If a request is successful but the response doesn't have the cart state data (the `/cart/add.js` response is the case),
Liquid Ajax Cart performs an additional `/cart/update.js` request to get the data.

Use the `liquidAjaxCart.cart` property to read the latest cart state data.

As the cart state data is updated after a Shopify Cart API Ajax request, 
subscribe to the [`liquid-ajax-cart:request-end`](/v2/event-request-end/) event 
if you want to run your JavaScript code when the cart state is updated.  

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