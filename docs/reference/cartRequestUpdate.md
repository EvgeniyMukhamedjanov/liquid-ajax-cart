# cartRequestUpdate

Performs a request to the Shopify Cart API `POST /cart/update.js` endpoint.

Takes the request's body as a first parameter.

```html
<script type="module">
  import { cartRequestUpdate } from {% include code/last-release-file-name.html asset_url=true %}
    
  cartRequestUpdate({
    updates: [3, 2, 1]
  })

</script>
```