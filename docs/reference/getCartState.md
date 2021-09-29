# `getCartState()`
Returns the current state.
```liquid
<script type="module">
  import { getCartState } from '{{ 'liquid-ajax-cart.js' | asset_url }}'

  const state = getCartState();
  console.log(state);
</script>
```
