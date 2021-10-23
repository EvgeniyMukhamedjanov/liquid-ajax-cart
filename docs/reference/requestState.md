# Request state

Liquid Ajax Cart keeps the information about each [Cart Ajax API request](/reference/requests/) in Javascript objects that are called "Request state".

The objects usually passed as a parameter to the callbacks that you define using the [Cart Ajax API requests](/reference/requests/) functions.

```json
{
  "endpoint": "/cart/add.js",
  "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
  "requestType": "add",
  "info": {
    "initiator": {}
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
* `requestBody` is `undefined` for `GET` requests, JSON or [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object for `POST` requests;
* `info` — additional data that set by the request caller. [Product forms](/reference/product-forms/) and [Controls](/reference/controls/) that attach the `initiator` property to the `info` parameter. The `initiator` keeps the `HTMLElement` object of the form or control.
* `responseData` — the response on the request. `ok` is `true` if the response was successful (status in the range 200-299);
* for `/cart/add.js` requests Liquid Ajax Cart performs an extra `GET` request to the `/cart.js` endpoint to get the updated cart state. `extraResponseData` object contains the response of the extra request.
* If the request couldn't be performed and response wasn't received because, for example, internet was disconnected — the `responseData` will not exist but `fetchError` will be there instead:
  ```json
  {
    "endpoint": "/cart/add.js",
    "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
    "requestType": "add",
    "fetchError": {
      "message": "Failed to fetch",
      "stack": "TypeError: Failed to fetch\n    at e.fetch (h..."
    }
  }
  ```