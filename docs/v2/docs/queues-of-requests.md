---
title: Queues of requests
layout: docs-v2
disable_anchors: true
---

# Queues of requests

<p class="lead">
Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately, it adds them to queues.
</p>

## How it works 

The queues of requests might look like this:

{%- capture highlight_code -%}
Queue #1: [/cart/add.js] [/cart/change.js]
Queue #2: [/cart/add.js]
Queue #3: [/cart/add.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

While the first queue contains requests, they will be performed in order: `/cart/add.js`, then `/cart/change.js`.

When the requests from the first queue are finished — the queue gets removed, 
the second queue becomes first and the process repeats until there are no queues left.

## The `newQueue` property

When you make a Shopify Cart API Ajax request using one of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object methods, such as
[`get`](/v2/docs/liquid-ajax-cart-get),
[`add`](/v2/docs/liquid-ajax-cart-add),
[`change`](/v2/docs/liquid-ajax-cart-change),
[`update`](/v2/docs/liquid-ajax-cart-update),
[`clear`](/v2/docs/liquid-ajax-cart-clear),
you can set the `newQueue` option to `true` of `false` which will determine if the request will be performed in a separate queue,
or it will be added to the end of the first queue.

### If `newQueue` is `true`

If the `newQueue` property is `true` then a new queue will be created and the request will be added to the new queue.

Use this option when you want your request to be performed according to the callstack order. 
Your request will be performed only after all the previously added requests are finished.

The use case is requests that get performed on a user action, such as a button click or a form submission.

For example, you want to create a button that performs `/cart/add.js` request. 
If there are other requests in progress when a user clicks the button, 
you want your button's request to be performed after all those requests are finished.

You should set `newQueue` option to `true` to achieve this: 

{%- capture highlight_code -%}
const button = document.querySelector('[data-my-button]');
button.addEventListener('click', () => {
  // Adding a /cart/add.js request to a new queue by setting "newQueue" to "true"
  liquidAjaxCart.add({…}, { newQueue: true });
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

If a user clicks the button twice in a row (`click #1`, `click #2`) and there is one request currently in progress, then the queues will look like this:
{%- capture highlight_code -%}
Queue #1: [request in progress]
Queue #2: [/cart/add.js — click #1]
Queue #3: [/cart/add.js — click #2]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

When the request from the first queue is finished, the queue #1 will be removed, 
and the queue with your "click #1" request will become the first.

Now it the `click #1` request's turn to work:
{%- capture highlight_code -%}
Queue #1: [/cart/add.js — click #1]
Queue #2: [/cart/add.js — click #2]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

### If `newQueue` is not `true`

If the `newQueue` property of request options is not defined or `false`, 
the request will be added to the end of the first queue 
and gets performed right after the moment when previous requests from the first queue are finished
and before the moment when second queue's requests are started. 

Use it when you want to run your request right after the current one and before the requests from the next queues.

The use case — when you subscribe to the request "A" using the `liquid-ajax-cart:request` event or the `firstComplete`, `lastComplete` callbacks,
and you want to run another request "B" right after the request "A" is finished, but before the requests from the next queue are started.

For example, you want to create a button that performs `/cart/add.js` request,
and when the `/cart/add.js` request is finished, you want to run another `/cart/change.js` request right away
and before the requests from the next queue.

You should set `newQueue` option to `false` for the `/cart/change.js` request to achieve this:

{%- capture highlight_code -%}
const button = document.querySelector('[data-my-button]');
button.addEventListener('click', () => {

  // Adding a /cart/add.js request to a new queue by setting "newQueue" to "true"
  liquidAjaxCart.add({…}, { newQueue: true, lastComplete: ( requestState ) => {
    // If the "lastComplete" callback is called,
    // means the /cart/add.js is just finished, thus it is in the first queue right now.
    
    // Add /cart/change.js to the end of the first queue by setting "newQueue" to "false"
    // to perform it right now and before the requests from the next queues are started
    liquidAjaxCart.change({…}, { newQueue: false });
  }});
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

If a user clicks the button twice in a row (`click #1`, `click #2`) and there were no other requests in progress, 
the queues will look like this:
{%- capture highlight_code -%}
Queue #1: [/cart/add.js — click #1]
Queue #2: [/cart/add.js — click #2]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

When the `click #1` request is just finished, the `lastComplete` callback gets called,
and the `/cart/change.js` request gets added to the end of the first queue 
by the `liquidAjaxCart.change({…}, { newQueue: false });` line of code:
{%- capture highlight_code -%}
Queue #1: [/cart/add.js — click #1] [/cart/change.js — from the "lastComplete" callback]
Queue #2: [/cart/add.js — click #2]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

As the `click #1` is finished, it gets removed from the first queue.
Now it is the `/cart/change.js` from the `lastComplete` callback request's turn to work:
{%- capture highlight_code -%}
Queue #1: [/cart/change.js — from the "lastComplete" callback]
Queue #2: [/cart/add.js — click #2]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

