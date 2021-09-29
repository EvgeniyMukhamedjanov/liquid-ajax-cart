# `subscribeToCartStateUpdate( callback )`
Callback will be called after cart state is changed with the only parameter — updated state.

```html
<script type="module">
  import { subscribeToCartStateUpdate } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  subscribeToCartStateUpdate( state => {
    console.log('Updated state:');
    console.log( state );
  });
</script>

```
