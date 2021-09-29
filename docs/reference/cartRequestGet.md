# `cartRequestGet()` 
Performs GET request to Shopify Cart API 

```liquid
<script type="module">
  import { cartRequestGet } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  cartRequestGet().then( data => {
    console.log( data );
  });
</script>
```
