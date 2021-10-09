# subscribeToCartAjaxRequests()
The `subscribeToCartAjaxRequests` function adds your callback function to the list of functions that will be called each time before another Cart Ajax API request is getting performed.
The callback should be passed as the only parameter.

```javascript
subscribeToCartAjaxRequests( myRequestCallback );
```

Two parameters will be passed to the callback function: 
- `data` — an object with information about the request:
  ```json
  {
    "endpoint": "/cart/add.js",
    "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
    "requestType": "add"
  }
  ```
  - `requestBody` is `undefined` for `GET` requests, JSON or [FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData) object for `POST` requests;
  - since the callback is called before the request is performed, you can mutate the `requestBody` object and the request will be run with the updated parameters.
- `subscribeToResult` — a function that adds your another callback to the list of functions that will be called after the current request is performed. Takes the result-callback as the only parameter:
  ```javascript
  function myRequestCallback ( data, subscribeToResult ) {
    console.log( 'Before request', data );
    
    const myResultCallback = function ( data ) {
      console.log( 'After request', data );
    }
    
    subscribeToResult( myResultCallback );
  }
  subscribeToCartAjaxRequests( myRequestCallback );
  ```
  The result-callback will be called with the only one parameter — `data` object with information about the request:
  ```json
  {
    "endpoint": "/cart/add.js",
    "requestBody": {items: [{id: 40934235668668, quantity: 1}], sections: "my-cart"},
    "requestType": "add"
    "responseData": {
      "ok": true, 
      "status": 200, 
      "body": {…}
    }
    "extraResponseData": {
      "ok": true, 
      "status": 200, 
      "body": {…}
    }
  }
  ```
  - `responseData` — the response on the request. `ok` is `true` if the response was successful (status in the range 200-299);
  - for `/cart/add.js` requests Liquid Ajax Cart performs an extra `GET` request to the `/cart.js` endpoint to get the updated cart state. `extraResponseData` object contains the response of the extra request.
  - If the request could be performed and response wasn't received because, for example, internet was disconnected — the `responseData` will not exist but `fetchError` will be there instead:
    ```json
    {
      "endpoint": "/cart/add.js",
      "requestBody": {"items": [{"id": 40934235668668, "quantity": 1}], "sections": "my-cart"},
      "requestType": "add",
      "fetchError": {
        "message": "Failed to fetch"
        "stack": "TypeError: Failed to fetch\n    at e.fetch (h..."
      }
    }
    ```

The [getCartState](/reference/getCartState) might be used within your callbacks:
```html
<script type="module">
  import { subscribeToCartAjaxRequests, getCartState } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  // Calculate how cart item count has been changed after an "Add to cart" request
  
  subscribeToCartAjaxRequests(( data, subscribeToResult ) => {
    
    // calculate only for "Add to cart" requests
    if ( data.requestType === "add" ) {
  
      const state = getCartState();
      const itemCountBefore = state.status.cartStateSet ? state.cart.item_count : undefined;

      subscribeToResult( data => {
        if ( "responseBody" in data && data.responseBody.ok )
          const state = getCartState();
          const itemCountAfter = state.status.cartStateSet ? state.cart.item_count : undefined;
          // to get itemCountAfter after "Add to cart" request you can also use data.extraResponseData.body.item_count 

          if ( itemCountBefore !== undefined && itemCountAfter !== undefined ) {
            console.log(`Items quantity increased by ${ itemCountAfter - itemCountBefore } pcs`);
          }
        }
      })
    }
  })
</script>

```
