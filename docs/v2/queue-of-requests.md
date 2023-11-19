---
title: Queue of requests
layout: docs-v2
---

# Queue of requests

<p class="lead">
Liquid Ajax Cart doesn't perform Shopify Cart API Ajax requests immediately; instead, it enqueues them for processing.
</p>

## How it works 

Let's say a user changes the value of a cart item quantity input, thus 
Liquid Ajax Cart has to perform a Shopify Cart API `/cart/change.js` Ajax request to update the quantity.

Rather than executing the request immediately, Liquid Ajax Cart adds the request to the Queue of requests.
If there are no other requests in the Queue, the `/cart/change.js` request becomes the first in the Queue:

{%- capture highlight_code -%}
#1: [/cart/change.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

As the Queue isn't empty anymore, Liquid Ajax Cart switches to the "processing requests" mode
and executes requests according to their order.

As the `/cart/change.js` is the first in the Queue, it is going to be executed right away.

{%- capture highlight_code -%}
#1: [/cart/change.js — executing]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

Imagine, while the `/cart/change.js` is executing, the user submits a product form.
Thus, Liquid Ajax Cart needs to perform a Shopify Cart API `/cart/add.js` Ajax requests to add the product to the cart.
As the Queue is not empty, the request goes to the end of the Queue:

{%- capture highlight_code -%}
#1: [/cart/change.js — executing]
#2: [/cart/add.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code highlight_lines="2" %}

Once the `/cart/change.js` is completed, it gets removed from the Queue, 
then the `/cart/add.js` request becomes the first in the Queue:

{%- capture highlight_code -%}
DEL [/cart/change.js — completed]
---------------------------------
#1: [/cart/add.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

Then Liquid Ajax Cart starts executing the current first request in the Queue:
{%- capture highlight_code -%}
#1: [/cart/add.js — executing]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

The process is being repeated until the Queue is empty.

## The `important` requests

When you make a Shopify Cart API Ajax request using {% include v2/content/links-to-request-methods.html %},
it also goes to the end of the Queue by default, if the Queue isn't empty.

{%- capture highlight_code -%}
const button = document.querySelector('#custom-add-to-cart-button');
button.addEventListener('click', () => {
  // The /cart/add.js request will go to the end of the Queue if it isn't empty
  liquidAjaxCart.add({
    items: [
      {
        id: 40934235668668,
        quantity: 1
      }
    ]  
  });
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

But sometimes you need to perform your requests right now, out of queue, before any other request in the Queue.
You can do that by setting the `important` option to `true` in {% include v2/content/links-to-request-methods.html %}.
If a request is "important", Liquid Ajax Cart always puts it at the beginning of the Queue.

### Use case

For example, you have a button that runs a `/cart/add.js` request,
and when the `/cart/add.js` request is completed, you want to run a `/cart/change.js` request right away, 
based on the `/cart/add.js` result. You also want to make sure that there will be no other requests executed
between the `/cart/add.js` and `/cart/change.js`:

{%- capture highlight_code -%}
const button = document.querySelector('#custom-add-to-cart-button');
button.addEventListener('click', () => {
  // The /cart/add.js request will go to the end of the Queue if it isn't empty
  liquidAjaxCart.add({
    items: [
      {
        id: 40934235668668,
        quantity: 1
      }
    ]  
  }, {
    // The lastCallback callback function will be run 
    // after the /cart/add.js request is finished
    lastCallback: function(requestState) {
      if (/* condition based on the /cart/add.js requestState */) {

        // Run the /cart/change.js request with the "important" option,
        // so that it will be put at the beginning of the Queue and run right away 
        // even if other requests were added to the Queue
        // while the /cart/add.js request was executing
        liquidAjaxCart.change({…}, { important: true });
      }
    }
  });
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

If a user clicks the button and, while the button's `/cart/add.js` request is executing, they update a cart note field,
Liquid Ajax Cart will add a `/cart/update.js` request to update the cart note. The Queue will look like this:
{%- capture highlight_code -%}
#1: [/cart/add.js — executing]
#2: [/cart/update.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

When the `/cart/add.js` request is just finished, the `lastCallback` callback gets called,
and the `/cart/change.js` request gets added to the first position in the Queue rather than to the end,
because the `important` option is set to `true` for that request:
{%- capture highlight_code -%}
#1: [/cart/add.js — just finished] [/cart/change.js]
#2: [/cart/update.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

As the `/cart/add.js` is finished, it gets removed from the Queue.
Now it is the `/cart/change.js` request's turn to work:
{%- capture highlight_code -%}
#1: [/cart/change.js — executing]
#2: [/cart/update.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

### Multiple `important` requests

If you make a few "important" requests in a row, they will all be added to the first position of the Queue
and will be executed in order of creation:

{%- capture highlight_code -%}
liquidAjaxCart.add({…}, { important: true });
liquidAjaxCart.change({…}, { important: true });
liquidAjaxCart.udpate({…}, { important: true });
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

{%- capture highlight_code -%}
#1: [/cart/add.js — executing] [/cart/change.js] [/cart/update.js]
#2: ...
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}