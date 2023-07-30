---
title: liquid-ajax-cart:queue-start
layout: docs-v2
disable_toc: true
---

# liquid-ajax-cart:queue-start

<p class="lead" markdown="1">
The `liquid-ajax-cart:queue-start` event is fired at the `document` when the [Queue of requests](/v2/docs/queue-of-requests/)
is empty and a Shopify Cart API Ajax request gets added to the [Queue](/v2/docs/queue-of-requests/).
</p>

## How it works

Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately, it adds them to the [Queue](/v2/docs/queue-of-requests/).

If there is no request performing at the moment (the [Queue](/v2/docs/queue-of-requests/) is empty)
and something initiates a new request (for example user clicked an "Add to cart" button"
or the request is made by {% include v2/content/links-to-request-methods.html %}), 
the request will be added to the [Queue](/v2/docs/queue-of-requests/), Liquid Ajax Cart will dispatch the 
`liquid-ajax-cart:queue-start` event and start performing the request.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:queue-start", function() {
  console.log("A queue of requests is started");
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

