# cartRequestChange

Performs a request to the Shopify Cart API `POST /cart/change.js` endpoint.

Takes the request's body as a first parameter, the options object as the second parameter.

See what parameters Shopify expects from the request's body in the [`/cart/change.js`](https://shopify.dev/api/ajax/reference/cart#post-cart-change-js) documentation.

```html
<script type="module">
  import { cartRequestChange } from {% include code/last-release-file-name.html asset_url=true %}

  {% include code/request-options-object.html %}
    
  cartRequestChange({ 
    id: '40934235668668:719bc4cb60310cbc4dee2ae38d8bf04c',
    quantity: 0
  }, options )

</script>
```

{% include code/request-options-text.html %}