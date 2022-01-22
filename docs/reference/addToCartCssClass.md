# addToCartCssClass

The `addToCartCssClass` configuration parameter lets you specify a CSS class that will be attached to the `body` tag after successful adding a product to the cart.

The usecase — opening a cart drawer after a user clicks an "Add to cart" button.

Using the `data-ajax-cart-configuration` attribute:
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "addToCartCssClass": "js-my-cart-open"
  }
</script>
```
{% endraw %}

Using the `configureCart` function:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('addToCartCssClass', 'js-my-cart-open');
</script>
```
{% endraw %}

You can also specify the time in milliseconds after which the class should be removed from the `body` tag.

The usecase — opening a mini-cart popup for 3 seconds.

Using the `data-ajax-cart-configuration` attribute:
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "addToCartCssClass": [ "js-my-mini-cart-open", 3000 ]
  }
</script>
```
{% endraw %}

Using the `configureCart` function:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('addToCartCssClass', [ 'js-my-mini-cart-open', 3000 ]);
</script>
```
{% endraw %}