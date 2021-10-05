---
layout: reference
---

# `cartRequestChange( body )`
Performs POST request to the Shopify Cart API `/cart/change.js` endpoint. Accepts request's body as the first parameter.

```html
<script type="module">
  import { cartRequestChange, getCartState } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  const state = getCartState();

  if ( state.status.cartStateSet && state.cart.item_count > 0 ) {
    const firstItemKey = state.cart.items[0].key;
    const firstItemQuantity = state.cart.items[0].quantity;
    
    cartRequestChange({ 
      id: firstItemKey,
      quantity: firstItemQuantity - 1
    }).then( data => {
      console.log( data );
    })
  }

</script>
```
