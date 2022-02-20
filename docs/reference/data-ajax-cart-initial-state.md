# data-ajax-cart-initial-state

To do its job Liquid Ajax Cart needs to know current Shopify cart state: what products are in the cart, what total price is, what discounts are applied etc. This information is stored in the [`cart`](https://shopify.dev/api/liquid/objects/cart) liquid object.

The shortest way to make the cart state accessible for JavaScript code is to convert the Shopify `cart` object to JSON and include it to the page content within the `script` tag.

In order Liquid Ajax Cart to find the `script` tag with the cart state, it should have the `data-ajax-cart-initial-state` attribute.

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
```
{% endraw %}

It is highly recommended to add the mentioned code to the `layout/theme.liquid` file so that the initial cart state data is accessible on all pages.

If Liquid Ajax Cart doesn't find the `data-ajax-cart-initial-state` script, it will make an extra Shopify Cart API request to get the cart state.