---
title: liquidAjaxCart.previousCart 
layout: docs-v2
---

# liquidAjaxCart.previousCart

<p class="lead" markdown="1">
A read-only property that keeps the value that had been in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property 
before the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property was updated by the response of the latest successful Shopify Cart API Ajax request. 
</p>

## How it works

If a Shopify Cart API Ajax request is successful, Liquid Ajax Cart moves the current [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property value
to the `liquidAjaxCart.previousCart` property,
pulls out the updated cart JSON from the request response and saves it in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property.

## Structure

{%- capture highlight_code -%}

console.log(liquidAjaxCart.previousCart);

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