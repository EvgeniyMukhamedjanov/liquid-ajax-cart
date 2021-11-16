# lineItemQuantityErrorText

The `lineItemQuantityErrorText` configuration parameter sets the error message text that appears in {% raw %}[`data-ajax-cart-messages="{{ line_item.key }}"`](/reference/data-ajax-cart-messages/){% endraw %} containers when a user tries to set a cart item's quantity higher than the available quantity of the product.

By default the text is "*You can't add more of this item to your cart*".

You can change the message if your store language is not English or the phrase doesn't fit to your store:
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "lineItemQuantityErrorText": "{% raw %}{{ 'sections.cart.cart_quantity_error' | t }}{% endraw %}"
  }
</script>
```
{% endraw %}

You can also use the `configureCart` function:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('lineItemQuantityErrorText': 'My quantity error text');
</script>
```
{% endraw %}