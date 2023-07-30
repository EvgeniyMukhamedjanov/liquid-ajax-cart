---
title: liquid-ajax-cart:queue-end
layout: docs-v2
---

# liquid-ajax-cart:queue-end

<p class="lead" markdown="1">
The `liquid-ajax-cart:queue-end` event is fired at the `document` when a Shopify Cart API Ajax request 
is finished and removed from the [Queue of requests](/v2/docs/queue-of-requests/) and there is no other
request in the [Queue](/v2/docs/queue-of-requests/) to perform.
</p>

## How it works

Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately, it adds them to the [Queue](/v2/docs/queue-of-requests/).
After a request is finished, it gets removed from the [Queue](/v2/docs/queue-of-requests/).
If there is no other request to perform, Liquid Ajax Cart will fire the `liquid-ajax-cart:queue-end` event.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:queue-start", function() {
  console.log("A queue of requests is started");
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

## Use case

If you need to adjust the cart content based on your custom rules 
(for example adding a free product depending on the updated cart total
or removing the product B if the product A is removed), 
this is the right place to do it.
