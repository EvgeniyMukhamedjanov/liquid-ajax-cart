# subscribeToCartAjaxRequests()
The `subscribeToCartAjaxRequests` function adds your callback function to the list of functions that will be called each time before another Cart Ajax API request is getting performed.
The callback should be passed as the only parameter.

```javascript
subscribeToCartAjaxRequests( myRequestCallback );
```

Two parameters will be passed to the callback function: 
1. **`requestState`** — the [Request state](/reference/requestState/) object with information about the request. Since the request is not performed yet, not all the Request state's properties will be available:
    ```json
    {
      "endpoint": "/cart/add.js",
      "requestBody": {…},
      "requestType": "add",
      "info": {…}
    }
    ```
    You can mutate the `requestBody` and the `info` objects as they are references to the objects that will be used in the request. But if you assign a new object to them it will not work:
    ```javascript
    // Correct:
    info.my_parameter = 'value';

    // Wrong:
    info = { my_parameter: 'value' }
    ```

2. **`subscribeToResult`** — a function that adds your another callback to the list of functions that will be called after the current request is performed. Takes the result-callback as the only parameter:
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
    The result-callback will be called with the only one parameter — the [Request state](/reference/requestState/) object with information about the request.

##### Use with the state
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
