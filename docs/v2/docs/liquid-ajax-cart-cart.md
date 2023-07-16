---
title: liquidAjaxCart.cart 
layout: docs-v2
---

# liquidAjaxCart.cart

<p class="lead" markdown="1">
A read-only property that keeps the cart JSON from the latest Shopify Cart API Ajax response. 
</p>

## How it works

If a Shopify Cart API Ajax request is successful, Liquid Ajax Cart moves the current `liquidAjaxCart.cart` property value
to the [`liquidAjaxCart.previousCart`](/v2/docs/liquid-ajax-cart-previous-cart/) property,
pulls out the updated cart JSON from the request response and saves it in the `liquidAjaxCart.cart` property.

## Structure

{%- capture highlight_code -%}

console.log(liquidAjaxCart.cart);

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