---
title: liquid-ajax-cart:request-start
layout: docs-v2
---

# liquid-ajax-cart:request-start

<p class="lead" markdown="1">
The `liquid-ajax-cart:request-start` event is fired at the `document` a moment before a Shopify Cart API Ajax request is performed.
You can read, modify or cancel the request.
</p>

## Structure

The event's `detail` property contains a [Request state](/v2/request-state/) object 
of the current Shopify Cart API Ajax request.

Since the event is fired before the request is performed, 
the [Request state](/v2/request-state/) object won't have the `responseData`, `extraResponseData` and `fetchError` properties:

{% include v2/content/event-request-start-example.html %}

Result:

{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {…},
  "requestType": "add",
  "info": {…}
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}

The `requestState.requestBody` and `requestState.info` are objects you can mutate to change the request.

## Mutate a request

The `requestState.requestBody` and `requestState.info` properties are references to the objects that will be used in the request.
So you can mutate the objects if you want to change the request before it is performed.
But if you assign a new object to the `requestState.requestBody` and `requestState.info` properties it won't work:

### Correct
{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request-start", function(event) {
  const {requestState} = event.detail;
  if (requestState.requestType === 'change') {
    if (requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams) {
      // Mutating the "requestBody" object is allowed
      requestState.requestBody.set('quantity', 2);
    } else {
      // Mutating the "requestBody" object is allowed
      requestState.requestBody.quantity = 2;
    }
  }

  // Mutating the "requestBody" object is allowed
  requestState.info.myCustomData = 'value';
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code highlight_lines="5,6,8,9,13,14" %}

### Wrong
{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request-start", function(event) {
  const {requestState} = event.detail;
  if (requestState.requestType === 'change') {
    // Assigning another object to the "requestBody" won't work
    requestState.requestBody = newRequestObject;
  }

  // Assigning another object to the "info" won't work
  requestState.info = {myCustomData: 'value'};
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code highlight_lines="4,5,8,9" %}

## Cancel a request

You can cancel the request by mutating the `requestState.info` object and setting the `requestState.info.cancel` to `true`.
The request won't be performed but the [`liquid-ajax-cart:request-end`](/v2/event-request-end/) event will be fired anyway.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request-start", function(event) {
  const {requestState} = event.detail;

  // Cancel the request
  requestState.info.cancel = true;
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code highlight_lines="5" %}