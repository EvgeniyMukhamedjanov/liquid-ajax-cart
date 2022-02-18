# subscribeToCartStateUpdate()

The `subscribeToCartStateUpdate` function adds your callback function to the list of functions that will be called each time after the [State object](/reference/state/) is changed. The callback should be passed as the only parameter.

```javascript
subscribeToCartStateUpdate( myCallback );
```

```html
<script type="module">
  import { subscribeToCartStateUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  subscribeToCartStateUpdate(( state, isCartUpdated ) => {
    console.log('State is updated: ', state);
    console.log('Cart state is updated: ', isCartUpdated);
  });
</script>
```

Your callback will be called with the [State object](/reference/state/) and the `isCartUpdated` boolean parameter. 

If the `isCartUpdated` is `true`, it means that Liquid Ajax Cart has just received new cart JSON-data from Shopify from the last Shopify [Cart Ajax API request](/reference/requests/) and the new cart state is available in the `cart` property.

If the `isCartUpdated` is `false`, it means that only `status` State property is changed.