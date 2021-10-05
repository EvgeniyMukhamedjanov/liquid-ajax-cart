# data-ajax-cart-bind-state

Add the `data-ajax-cart-bind-state` attribute to an HTML element with a path to a state value as a parameter and Liquid Ajax Cart will keep the text content of the element in sync with the state value.

```liquid
{% comment %}
  Liquid expression {{ cart.item_count }} displays amount of items in a cart,
  data-ajax-cart-bind-state updates the HTML of the element when the cart.item_count state value is changed
{% endcomment %}

<div data-ajax-cart-bind-state="cart.item_count" > {{ cart.item_count }} </div>
```

On the demo store it is used to show the amount of cart items next to the "Cart" link in the header.
