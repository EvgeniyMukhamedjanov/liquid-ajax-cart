---
title: Request state
layout: docs-v2
disable_anchors: true
---

# Request state
<p class="lead">
A JavaScript object that is created for each Shopify Cart API Ajax request, 
where Liquid Ajax Cart keeps information about the request.
</p>

## Structure

{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
  "requestType": "add",
  "info": {
    "initiator": Element {},
    "cancel": false
  },
  "responseData": {
    "ok": true,
    "status": 200,
    "body": {…}
  },
  "extraResponseData": {
    "ok": true,
    "status": 200,
    "body": {…}
  }
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}

### `endpoint`
A Shopify Cart API endpoint URL for the request.

### `requestBody`
* In case of a `POST` request, the `requestBody` is a JSON or a `FormData` object to send to the Shopify Cart API endpoint.
* In case of a `GET` request, the `requestBody` is `undefined`.

### `info`
An object to keep any additional data that set be a request caller. 
When you make your request, you can add any properties you want.
There are only two reserved properties that you shouldn't use for keeping custom data.
They are `initiator` and `cancel`.

### `info.initiator`
When Liquid Ajax Cart makes a Shopify Cart API Ajax request that is initiated by a user action, 
such as a form submission or cart item quantity input change or a "remove cart item" button click,
Liquid Ajax Cart saves the `HTMLElement` object, that triggered the event, in the `info.initiator` property.

For example, if a user changes a cart item quantity input with the [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input/) attribute,
Liquid Ajax Cart will intercept the event and send a `/cart/change.js` Shopify Cart API Ajax request. 
Along with that Liquid Ajax Cart will attach the input `HTMLElement` object to the `info.initiator` property.

### `info.cancel`
If the `info.cancel` is `true`, then the request won't be performed and the `responseData` property won't exist.
This lets you [cancel a request](/v2/docs/event-request-start/#cancel-a-request) 
in the [`liquid-ajax-cart:request-start`](/v2/docs/event-request-start/) event listener.

### `responseData`
A response from Shopify to the request. 

If the `responseData.ok` is `true`, it means the request was successful (status is in range 200—299).

The `responseData` is `null` if:
* the request was cancelled by the `info.cancel` property;
* the request failed and the response wasn't received, for example because of internet connection; in this case you will find the `fetchError` property.

### `extraResponseData`
Sometimes Liquid Ajax Cart performs an additional Shopify `POST /cart/update.js` request and puts the response to the `extraResponseData` property. 
The additional request happens if:
* there was a `/cart/add.js` request that doesn't return the cart JSON-data — the additional `/cart/update.js` request will bring the updated cart state,
* there was a request with more than 5 sections — the additional `/cart/update.js` request will bring the rest sections HTML.

### `fetchError`
If the request failed and the response wasn't received, for example because of internet connection, you'll find the `fetchError` property:

{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
  "requestType": "add",
  "info": {},
  "fetchError": {
    "message": "Failed to fetch",
    "stack": "TypeError: Failed to fetch\n    at e.fetch (h..."
  }
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}

## Interaction

You can access a Request state object in a [`liquid-ajax-cart:request`](/v2/docs/request-event/) event handler,
adjust the request by mutating the `requestBody` object, 
attach custom data or cancel the request by mutating the `info` object.

While making a Shopify Cart API Ajax request by {% include v2/content/links-to-request-methods.html %},
you can attach custom data by using the `info` option and get the access to the Request state object
in the `firstComplete`, `lastComplete` callback functions.