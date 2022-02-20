# updateOnWindowFocus

Liquid Ajax Cart makes a Shopify Cart API request each time when the browser tab loses focus and gets focus back to keep [`data-ajax-cart-section`](/reference/data-ajax-cart-section/) containers and the [State](/reference/state/) object up to date.

It is necessary because a user can open two browser tabs with the same Shopify store, adds a product to the cart in the second tab and then goes back to the first one. The first tab "doesn't know" about the new product in the cart but once the tab gets focus it will get updated.

You might want to disable this functionality during the development process because when you switch from DevTools to a page content and back the `window` object will get and lose focus all the time and cart sections will be updating constantly. Use the `updateOnWindowFocus` configuration parameter to turn this functionality off.

Disable using the `data-ajax-cart-configuration` attribute:
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

Disable using the `configureCart` function:
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