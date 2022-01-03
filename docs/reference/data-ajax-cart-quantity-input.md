# data-ajax-cart-quantity-input

Add the `data-ajax-cart-quantity-input` attribute with a cart item's index or a cart item's key as the value to an input element to ajaxify the input field: once a user changes the input's value, Liquid Ajax Cart will send an [Cart Ajax API request](/reference/requests/) to update the quantity.

The request will be sent on input's `change` event and if a user presses the `Enter` key within the input field.

If a user presses the `Esc` key within the input, its value will be reset to the current item's quantity according to the [State](/reference/state/) object.

The `data-ajax-cart-quantity-input` input fields become `readonly` when there is a Cart Ajax API request in progress (if the [State](/reference/state/)’s `status.requestInProgress` property is `true`)

Using a line item's index:
{% raw %}
```html
{% for item in cart.items %}
  <input data-ajax-cart-quantity-input="{{ forloop.index }}" value="{{ item.quantity }}" type="number" />
{% endfor %}
```
{% endraw %}

Using a line item's key is supported also, but there were found unexpected behaviour of the `/add/change.js` endpoint handler in some cases. Test it carefully with your store before going live:
{% raw %}
```html
{% for item in cart.items %}
  <input data-ajax-cart-quantity-input="{{ item.key }}" value="{{ item.quantity }}" type="number" />
{% endfor %}
```
{% endraw %}