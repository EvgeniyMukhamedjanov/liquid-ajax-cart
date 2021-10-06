# data-ajax-cart-initial-state

To do its job Liquid Ajax Cart needs to know current cart state: what products are in the cart, what total price is, what discounts are applied etc. This information is stored in the [`cart`](https://shopify.dev/api/liquid/objects/cart) liquid object.

The shortest way to make the cart state accesible for Javascript code is to convert the `cart` object to JSON and include it to the page content within the `script` tag.

In order Liquid Ajax Cart to find the `script` tag with the cart state, it should have the `data-ajax-cart-initial-state` attribute.

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
```
{% endraw %}

It is recommended to put the mentioned code to the `layout/theme.liquid` file so that the cart state data is accesible on all pages.

If Liquid Ajax Cart doesn't find the `data-ajax-cart-initial-state` script, it will make a call to Ajax Cart API using [`cartRequestGet`](/reference/cartRequestGet) function.