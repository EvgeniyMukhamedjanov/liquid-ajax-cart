# data-ajax-cart-messages

A container with the `data-ajax-cart-messages` attribute gets populated with errors and messages that come after each Shopify [Cart API request](/reference/requests/).

What messages will appear in a `data-ajax-cart-messages` container depends on the attribute value.

You can completely change the HTML layout of the messages using the [`messageBuilder`](/reference/messageBuilder/) configuration parameter.

## Values

### `form`

Add a container with the `data-ajax-cart-messages="form"` attribute within a Shopify product form and Liquid Ajax Cart will put all form related messages in it:

{% include code/data-ajax-cart-form-error.html %}

###### Messages
* *"All 3 T-shirt are in your cart."* or *"You can't add more T-shirt to the cart."* — error messages that come with the Shopify response on an "Add to cart" request.
* *"Required parameter missing or invalid: items"* — comes with the Shopify response on an "Add to cart" request if the request or a product form don't have the `id` parameter.
* *"There was an error while updating your cart. Please try again."* — appears when a Cart Ajax API request is not successful and doesn't have any error description, or if the request is not performed at all due to internet connection, for example. You can change the message using the [`requestErrorText`](/reference/requestErrorText/) configuration parameter if your store language is not English.

### `line_item.key`

Add the `data-ajax-cart-messages` attribute with a cart item's key to a container and Liquid Ajax Cart will populate the container with errors and messages related to the cart item.

{% raw %}
```html
{% for item in cart.items %}
  <div data-ajax-cart-messages="{{ item.key }}">
  	<!-- Errors and messages appear here --> 
  </div>
{% endfor %}
```
{% endraw %}

###### Messages
* *"All 3 T-shirt are in your cart."* — error messages that come with the Shopify response on a [`/cart/change.js`](https://shopify.dev/api/ajax/reference/cart#post-locale-cart-change-js) request.
* *"There was an error while updating your cart. Please try again."* — appears when a Cart Ajax API request is not successful and doesn't have any error description, or if the request is not performed at all due to internet connection, for example. You can change the message using the [`requestErrorText`](/reference/requestErrorText/) configuration parameter if your store language is not English or the phrase doesn't fit to your store.
