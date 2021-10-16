# data-ajax-cart-quantity-input

Add the `data-ajax-cart-quantity-input` attribute and a cart item's key as a value to an input element that displays the cart item's quantity to ajaxify the input field: once a user changes the input's value, Liquid Ajax Cart will send an [Cart Ajax API request](/reference/requests/) to update the quantity.

The request will be send on input's `change` event and if a user presses `Enter` key within the input field.

If user presses `Esc` key within the input, its value will be reset to the current item's quantity according to the [State](/reference/state/) object.

The `data-ajax-cart-quantity-input` input fields become `readonly` when there is a Cart Ajax API request in progress (if the [State](/reference/state/)’s `status.requestInProgress` property is `true`)

{% raw %}
```html
{% for item in cart.items %}
  <input type="number" value="{{ item.quantity }}" data-ajax-cart-quantity-input="{{ item.key }}" />
{% endfor %}
```
{% endraw %}
