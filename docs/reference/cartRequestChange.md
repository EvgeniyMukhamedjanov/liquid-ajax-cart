# cartRequestChange

Performs a request to the Shopify Cart API `POST /cart/change.js` endpoint.

Takes the request's body as a first parameter.

```html
<script type="module">
  import { cartRequestChange } from {% include code/last-release-file-name.html asset_url=true %}
    
  cartRequestChange({ 
    id: '40934235668668:719bc4cb60310cbc4dee2ae38d8bf04c',
    quantity: 0
  })

</script>
```