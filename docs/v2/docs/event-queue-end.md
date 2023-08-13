---
title: liquid-ajax-cart:queue-end
layout: docs-v2
---

# liquid-ajax-cart:queue-end

<p class="lead" markdown="1">
An event which is fired at the `document` when a Liquid Ajax Cart has executed 
all the Shopify Cart API Ajax requests from the [Queue](/v2/docs/queue-of-requests/) and 
it is switching back to the "idle" mode.
</p>

## How it works

Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately, it adds them to the [Queue](/v2/docs/queue-of-requests/).
When a request is executed, it is removed from the [Queue](/v2/docs/queue-of-requests/).
If there is no other request to perform, Liquid Ajax Cart triggers the `liquid-ajax-cart:queue-end` event.

{% include v2/content/lifecycle-events-reference.html %}

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:queue-end", function() {
  console.log("A queue of requests is finished");
  console.log("The current cart state is: ", window.liquidAjaxCart.cart);
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

## Use cases

{% include v2/content/queue-end-use-cases.html %}


