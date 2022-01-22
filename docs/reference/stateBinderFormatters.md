# stateBinderFormatters

The `stateBinderFormatters` configuration parameter lets you define custom formatters that you can use with the [`data-ajax-cart-bind-state`](/reference/data-ajax-cart-bind-state/) attribute.

For example, if you use the `option_selection.js` Shopify asset and its `Shopify.formatMoney` function you can specify your own formatter for money related values: 

{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('stateBinderFormatters', {
    'my_formatter': value => {

      // Don't change anything if the value is not a number
      if ( typeof value !== 'number' && !(value instanceof Number)) {
        return value;
      }

      // Apply formatMoney function if exists
      if ( window.Shopify?.formatMoney ) {
        return Shopify.formatMoney(value);
      }

      // Fallback to the "100 USD" format if there is no Shopify.formatMoney
      const state = getCartState();
      return `${ value.toFixed(2) } ${ state.cart.currency }`;
    }
  });
</script>

<!-- Applying the formatter -->
<span data-ajax-cart-bind-state="cart.total_price | my_formatter">{{ cart.total_price | money_with_currency }}</span>
```
{% endraw %}