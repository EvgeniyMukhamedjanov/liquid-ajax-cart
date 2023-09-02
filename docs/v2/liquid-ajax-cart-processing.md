---
title: liquidAjaxCart.processing
layout: docs-v2
---

# liquidAjaxCart.processing

<p class="lead" markdown="1">
A boolean read-only property of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object, 
which is `true` there is a Shopify Cart API Ajax request in progress.
</p>

## How it works

The `liquidAjaxCart.processing` property returns `true` when the [Queue of requests](/v2/queue-of-requests/) is not empty,
which means that Liquid Ajax Cart is currently executing Shopify Cart API Ajax requests
until the [Queue of requests](/v2/queue-of-requests/) is empty. 

## Use case

Check this property when you are building a custom control,
and you want to initiate a Shopify Cart API Ajax request only when 
there is no any other request in progress:

{%- capture highlight_code -%}
document.querySelector("#my-control").addEventListener("click", function() {
  if (!window.liquidAjaxCart?.init)
    return;

  // Ignore the click if Liquid Ajax Cart is processing a request
  if (window.liquidAjaxCart.processing)
    return;

  // Run the custom request is there is no other request in progress
  window.liquidAjaxCart.add({…});
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}