# updateOnWindowFocus

There is a chance that a user opens two browser tabs with the same Shopify store, adds a product to the cart in the first tab and then goes to the second one. To keep all [`data-ajax-cart-section`](/reference/data-ajax-cart-section/) containers and the [State](/reference/state/) objects up to date in each tab, Liquid Ajax Cart makes a Cart Ajax API request to get the latest cart state every time when the tab's `window` object gets focus.

This functionality might be annoying if you are working with the Chrome DevTools along with a page's content. In this case the `window` object will get and lose focus all the time and cart sections will be updating constantly. Use the `updateOnWindowFocus` configuration parameter to switch this functionality off.

Using the `data-ajax-cart-configuration` attribute:
{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-configuration >
  {
    "updateOnWindowFocus": false
  }
</script>
```
{% endraw %}

Using the `configureCart` function:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('updateOnWindowFocus', false);
</script>
```
{% endraw %}

You can change the parameter right in the browser's console by typing the following command: 
```javascript
liquidAjaxCart.configureCart('updateOnWindowFocus', false)
```