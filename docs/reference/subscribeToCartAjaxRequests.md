# `subscribeToCartAjaxRequests`
The callback will be called before each request gets performed. 

Two parameters will be passed to the callback function: 
- data — object with information about the request
- subscribeToResult — function to subscribe to result of the request. Pass a result-callback function to `subscribeToResult` and the result-callback will be called after the request is performed. One parameter will be passed to the restult-callback — data with information about the performed request.

```html
<script type="module">
  import { subscribeToCartAjaxRequests, getCartState } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  subscribeToCartAjaxRequests(( data, subscribeToResult ) => {
    
    const state = getCartState();
    const itemCountBefore = state.status.cartStateSet ? state.cart.item_count : undefined;

    subscribeToResult( data => {
      const state = getCartState();
      const itemCountAfter = state.status.cartStateSet ? state.cart.item_count : undefined;
      let itemCountDifference = undefined;

      if ( itemCountBefore !== undefined && itemCountAfter !== undefined ) {
        itemCountDifference = itemCountAfter - itemCountBefore;

        if (itemCountDifference > 0) {
          console.log(`Items quantity increased on ${ itemCountDifference } pcs`);
        } else if (itemCountDifference < 0) {
          console.log(`Items quantity decreased on ${ itemCountDifference * (-1) } pcs`);
        }
      }

    })
  })
</script>

```
