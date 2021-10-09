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
