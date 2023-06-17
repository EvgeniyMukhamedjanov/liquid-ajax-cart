---
title: subscribeToCartAjaxRequests()
layout: page
---

# subscribeToCartAjaxRequests()
The `subscribeToCartAjaxRequests` function adds your callback function to the list of functions that will be called each time before another Shopify Cart API request is getting performed.
The callback should be passed as the only parameter.

```javascript
subscribeToCartAjaxRequests( myRequestCallback );
```

Two parameters will be passed to the callback function: `requestState` and `subscribeToResult`.
```javascript
function myRequestCallback ( requestState, subscribeToResult ) {
  // callback code
}
subscribeToCartAjaxRequests( myRequestCallback );
```

### `requestState`

The `requestState` parameter is the [Request state](/reference/requestState/) object with information about the request. Since the request is not performed yet, not all the Request state properties will be available:
```json
{
  "endpoint": "/cart/add.js",
  "requestBody": {…},
  "requestType": "add",
  "info": {…}
}
```
###### Mutate the request
You can mutate the `requestBody` and the `info` objects as they are references to the objects that will be used in the request. But if you assign a new object to them it will not work:
```javascript
function myRequestCallback ( requestState, subscribeToResult ) {
  
  // Correct:
  if ( requestState.requestType === 'change' ) {
    if (requestState.requestBody instanceof FormData || requestState.requestBody instanceof URLSearchParams) {
      requestState.requestBody.set('quantity', 2); // Mutating the "requestBody" object is allowed
    } else {
      requestState.requestBody.quantity = 2; // Mutating the "requestBody" object is allowed
    }
  }

  // Wrong:
  if ( requestState.requestType === 'change' ) {
    requestState.requestBody = newRequestObject; // Assigning another object to the "requestBody" doesn't work
  }

  // Correct:
  requestState.info.my_parameter = 'value'; // Mutating the "info" object is allowed

  // Wrong:
  requestState.info = { my_parameter: 'value' }; // Assigning another object to the "info" doesn't work
}
```

###### Cancel the request
You can cancel the request by setting the `info.cancel` to `true`. The request will not be performed but all the request result subscribers will be called anyway.
```javascript
function myRequestCallback ( requestState, subscribeToResult ) {
  requestState.info.cancel = true;
}
```

### `subscribeToResult`

The `subscribeToResult` parameter is a function that adds your another callback to the list of functions that will be called after the current request is performed. Takes the result-callback as the only parameter:
```javascript
function myRequestCallback ( requestState, subscribeToResult ) {
  console.log( 'Before request', requestState );
  
  const myResultCallback = function ( requestState ) {
    console.log( 'After request', requestState );
  }
  
  subscribeToResult( myResultCallback );
}
subscribeToCartAjaxRequests( myRequestCallback );
```
The result-callback will be called with the only parameter — the [Request state](/reference/requestState/) object with information about the request.

### Use with the state
The [getCartState](/reference/getCartState/) might be used within your callbacks:

```html
<script type="module">
  import { subscribeToCartAjaxRequests, getCartState } from {% include code/last-release-file-name.html asset_url=true %}

  // Calculate how cart item count has been changed after an "Add to cart" request
  
  subscribeToCartAjaxRequests(( data, subscribeToResult ) => {
    
    // calculate only for "Add to cart" requests
    if ( data.requestType === "add" ) {
  
      const state = getCartState();
      const itemCountBefore = state.status.cartStateSet ? state.cart.item_count : undefined;

      subscribeToResult( data => {
        if ( data.responseBody?.ok )
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
