# Controls

### [`data-ajax-cart-request-button`](/reference/data-ajax-cart-request-button/)

HTML elements with the `data-ajax-cart-request-button` attribute as well as links with the `routes.cart_*_url` URLs send an [Ajax Cart API request](/reference/requests/) on user's click.

The elements become inactive when there is Cart Ajax API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).

Usecases: all the buttons that change the cart state: increace quantity of a cart item, decreace quantity of a cart item, remove a cart item, clear cart, etc.


### [`data-ajax-cart-toggle-class-button`](/reference/data-ajax-cart-toggle-class-button/)

An HTML element with the `data-ajax-cart-toggle-class-button` attribute adds/removes the `body` CSS class on user's click.

The usecase: show/hide a floating cart section on button click.

### [`data-ajax-cart-quantity-input`](/reference/data-ajax-cart-quantity-input/)

An HTML input element with the `data-ajax-cart-quantity-input` attribute will send an [Ajax Cart API request](/reference/requests/) if user changes its value or presses the `Enter` key within the input.

The value will be reset if a user presses the `Esc` button.

The input element become `readonly` when there is Cart Ajax API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).
