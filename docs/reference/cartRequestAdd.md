# cartRequestAdd

Performs a request to the Shopify Cart API `POST /cart/add.js` endpoint.

Takes the request's body as a first parameter, the options object as the second parameter.

```html
<script type="module">
  import { cartRequestAdd } from {% include code/last-release-file-name.html asset_url=true %}

  {% include code/request-options-object.html %}

  cartRequestAdd({ 
    items: [
      {
        id: 40934235668668,
        quantity: 1
      }
    ]  
  }, options )
</script>
```

{% include code/request-options-text.html %}