# `cartRequestAdd( body )`
Performs POST request to the Shopify Cart API `/cart/add.js` endpoint. Accepts request's body as the first parameter.

```html
<script type="module">
  import { cartRequestAdd } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  cartRequestAdd({ 
    items: [
      {
        id: 40934235668668,
        quantity: 1
      }
    ]  
  }).then( data => {
    console.log( data );
  })
</script>
```
