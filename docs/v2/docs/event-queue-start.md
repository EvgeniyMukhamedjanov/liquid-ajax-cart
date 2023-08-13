---
title: liquid-ajax-cart:queue-start
layout: docs-v2
---

# liquid-ajax-cart:queue-start

<p class="lead" markdown="1">
An event which is fired at the `document` when a Shopify Cart API Ajax request 
has been just added to the empty [Queue of requests](/v2/docs/queue-of-requests/).
</p>

## How it works

Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately, it adds them to the [Queue](/v2/docs/queue-of-requests/).

If there is no request performing at the moment (the [Queue](/v2/docs/queue-of-requests/) is empty)
and something initiates a new request (a user clicked an "Add to cart" button"
or the request is made by a direct call of {% include v2/content/links-to-request-methods.html %}), 
the request will be added to the [Queue](/v2/docs/queue-of-requests/), the Liquid Ajax Cart dispatches the 
`liquid-ajax-cart:queue-start` event and starts performing the request.

{% include v2/content/lifecycle-events-reference.html %}

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:queue-start", function() {
  console.log("A queue of requests is started");
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

