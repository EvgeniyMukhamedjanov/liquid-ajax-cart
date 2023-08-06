---
title: liquid-ajax-cart:request
layout: docs-v2
disable_anchors: true
---

# liquid-ajax-cart:request

<p class="lead" markdown="1">
The `liquid-ajax-cart:request` event is fired at the `document` a moment before a Shopify Cart API Ajax request is performed.
</p>

## Structure

The event's `detail` property contains an object with two properties:
* `requestState` — a [Request state](/v2/docs/request-state/) object;
* `onResult` — a function that lets you subscribe to the request's result.

## The `requestState` property
The `requestState` property is a [Request state](/v2/docs/request-state/) object. 
Since the event is fired before the request is performed, the Request state object won't have properties related to the response:
{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request", function(event) {
  const {requestState} = event.detail;

  // Print the requestState before the request is performed
  console.log(requestState);
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

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

### Mutate a request

The `requestState.requestBody` and `requestState.info` properties are references to the objects that will be used in the request. 
So you can mutate the objects if you want to change the request before it is performed.
But if you assign a new object to the `requestState.requestBody` and `requestState.info` properties it won't work: 

Correct:
{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request", function(event) {
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
  requestState.info.myCustomDate = 'value';
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Wrong:
{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request", function(event) {
  const {requestState} = event.detail;
  if (requestState.requestType === 'change') {
    // Assigning another object to the "requestBody" won't work
    requestState.requestBody = newRequestObject; 
  }

  // Assigning another object to the "info" won't work
  requestState.info = {myCustomDate: 'value'}; 
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### Cancel a request

You can cancel the request by mutating the object from the `requestState.info` property and setting the `requestState.info.cancel` to `true`. 
The request won't be performed but all the request result subscribers will be called anyway.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request", function(event) {
  const {requestState} = event.detail;

  // Cancel the request
  requestState.info.cancel = true;
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

## The `onResult` property

The `onResult` property is a function that adds your callback function to the list of functions 
that will be called after the current request is performed.

Your callback function will be called with the only parameter — 
a [Request state](/v2/docs/request-state/) object with the updated information about the request,
that will include Shopify response or an error message, if the request wasn't cancelled.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request", function(event) {
  const {onResult} = event.detail;
  
  onResult(function(requestState) {
    // Print the requestState after the request is performed
    console.log(requestState);
  });
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Result:
{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {…},
  "requestType": "add",
  "info": {…},
  "responseData": {
    "ok": true,
    "status": 200,
    "body": {…}
  }
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}
