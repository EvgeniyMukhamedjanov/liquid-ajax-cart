# cartRequestUpdate

Performs a request to the Shopify Cart API `POST /cart/update.js` endpoint.

Takes the request's body as a first parameter, the options object as the second parameter.

```html
<script type="module">
  import { cartRequestUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  {% include code/request-options-object %}
    
  cartRequestUpdate({
    updates: [3, 2, 1]
  }, options )

</script>
```

{% include code/request-options-text %}