---
title: Request state
layout: page
---

# Request state

Liquid Ajax Cart keeps the information about each Shopify Cart Ajax API request in Javascript objects that are called "Request state".

The objects usually passed as a parameter to the callbacks that you define using the [Cart Ajax API requests](/v1/reference/requests/) functions.

The object looks like this:
```json
{
  "endpoint": "/cart/add.js",
  "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
  "requestType": "add",
  "info": {
    "initiator": Element {}
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
```
* `requestBody` is JSON or `FormData` object for `POST` requests and `undefined` for `GET` requests.
* `info` — additional data that set by a request caller. 
  * [Product forms](/v1/reference/product-forms/) and [Controls](/v1/reference/controls/) attach the `initiator` property to the `info` parameter. The `initiator` keeps the `HTMLElement` object of the form or control.
  * If there is a `cancel` property of the `info` parameter and `cancel` property is `true`, then the request will not be performed and the `responseData` will not exist.
* `responseData` — the response on the request. `ok` is `true` if the response was successful (status in the range 200-299).
* for `/cart/add.js` requests Liquid Ajax Cart performs an extra `POST` request to the `/cart/update.js` endpoint to get the updated cart state. `extraResponseData` object contains the response of the extra request.
* Sometimes Liquid Ajax Cart performs an additional Shopify `POST /cart/update.js` request and saves the response in the `extraResponseData` object. The additional request happens if:
  * there were a `/cart/add.js` request that doesn't return the cart JSON-data — the additional `/cart/update.js` request will bring the updated cart state,
  * there were a request with more than 5 sections — the additional `/cart/update.js` request will bring the rest sections' HTML.
* If the request couldn't be performed and response wasn't received because, for example, internet was disconnected — the `responseData` will not exist but `fetchError` will be there instead:
  
  ```json
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
  ```