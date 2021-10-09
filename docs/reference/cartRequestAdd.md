# cartRequestAdd

Performs a request to the Shopify Cart API `POST /cart/add.js` endpoint.

Takes the request's body as a first parameter.

```html
<script type="module">
  import { cartRequestAdd } from {% include code/last-release-file-name.html asset_url=true %}

  cartRequestAdd({ 
    items: [
      {
        id: 40934235668668,
        quantity: 1
      }
    ]  
  })
</script>
```