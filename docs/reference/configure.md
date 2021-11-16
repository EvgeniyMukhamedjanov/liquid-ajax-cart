# Configuration

## data-ajax-cart-configuration
Add a `script` tag with the `data-ajax-cart-configuration` attribute and a JSON object with configuration parameters inside to set initial configuration of Liquid Ajax Cart:

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "requestErrorText": "{% raw %}{{ 'general.request_error' | t }}{% endraw %}",
    "updateOnWindowFocus": true
  }
</script>
```
{% endraw %}

It is highly recommended to add the `script` to the `layout/theme.liquid` file to make the configuration accessible on all pages.

This method doesn't support the [`productFormsFilter`](/reference/productFormsFilter/) and the [`messageBuilder`](/reference/messageBuilder/) parameters. To set them up use the `configureCart` function that supports all the parameters.


## configureCart()

The function takes a configuration parameter and its new value:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('requestErrorText', 'My request error text');
  configureCart('productFormsFilter', formNode => formNode.hasAttribute('data-my-product-form'));
</script>
```
{% endraw %}