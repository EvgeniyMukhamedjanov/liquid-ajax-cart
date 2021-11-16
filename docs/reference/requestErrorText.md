# requestErrorText

The `requestErrorText` configuration parameter sets the error message text that will appear in [`data-ajax-cart-messages`](/reference/data-ajax-cart-messages/) containers when a Cart Ajax API request is not successful and doesn't have any error description, or if the request is not performed at all due to internet connection, for example.

By default the text is "*There was an error while updating your cart. Please try again.*".

You can change the message if your store language is not English or the phrase doesn't fit to your store:
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "requestErrorText": "{% raw %}{{ 'general.request_error' | t }}{% endraw %}"
  }
</script>
```
{% endraw %}

You can also use the `configureCart` function:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('requestErrorText': 'My request error text');
</script>
```
{% endraw %}