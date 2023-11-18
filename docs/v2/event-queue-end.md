---
title: liquid-ajax-cart:queue-end
layout: docs-v2
---

# liquid-ajax-cart:queue-end

<p class="lead" markdown="1">
An event which is fired at the `document` when a Liquid Ajax Cart has executed 
all the Shopify Cart API Ajax requests from the [Queue](/v2/queue-of-requests/) and 
it is switching back to the "idle" mode.
</p>

## How it works

Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately, it adds them to the [Queue](/v2/queue-of-requests/).
When a request is executed, it is removed from the [Queue](/v2/queue-of-requests/).
If there is no other request to perform, Liquid Ajax Cart triggers the `liquid-ajax-cart:queue-end` event.

{% include v2/content/lifecycle-events-reference.html %}

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:queue-end", function() {
  console.log("A queue of requests is finished");
  console.log("The current cart state is: ", window.liquidAjaxCart.cart);
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

## Sending requests from the event listener

If you want to send a Shopify Cart API request from a `liquid-ajax-cart:queue-end` event listener, 
you have a chance to get into infinity loop of requests:

* a queue of requests is finishes and fires the `liquid-ajax-cart:queue-end` event,
* your event listener initiates a request,
* Liquid Ajax Cart creates a new queue of requests and puts the request there
* when the new queue is finishes, it fires the `liquid-ajax-cart:queue-end` event ...

In order to prevent this, make sure that you have a strong condition that won't let the loop happen:
{%- capture highlight_code -%}
let ranOnce = false;

document.addEventListener("liquid-ajax-cart:queue-end", function(event) {
  // condition to prevent infinity loop:
  if (!ranOnce) {
    ranOnce = true;

    // send your request
    window.liquidAjaxCart.add(...);
  }
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}
