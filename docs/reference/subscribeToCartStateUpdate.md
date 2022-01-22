# subscribeToCartStateUpdate()

The `subscribeToCartStateUpdate` function adds your callback function to the list of functions that will be called each time after the [State object](/reference/state/) is changed. The callback should be passed as the only parameter.

```javascript
subscribeToCartStateUpdate( myCallback );
```

```html
<script type="module">
  import { subscribeToCartStateUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  subscribeToCartStateUpdate( state => {
    console.log('State is updated: ', state);
  });
</script>
```

Your callback will be called with the [State object](/reference/state/) object as the only parameter when the State is updated. 

In addition to the default `cart` and `status` State properties you can receive the `previousCart` property. 

If the `previousCart` property exists, it means that Liquid Ajax Cart has just received new cart JSON-data from Shopify after the previous Cart Ajax API request and the new cart state is available in the `cart` property. Accordingly the previous cart state will be in the `previousCart` property.

The `cart` and the `previousCart` properties are not always different. If the previous request didn't make any changes in the cart but just returned Shopify cart JSON data, most likely the `cart` and the `previousCart` will be 100% same.

If you don't receive the `previousCart` property, it means that only `status` State property is changed.