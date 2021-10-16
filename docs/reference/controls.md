# Controls

### [`data-ajax-cart-request-button`](/reference/data-ajax-cart-request-button/)

HTML elements with the `data-ajax-cart-request-button` attribute as well as links with the `routes.cart_*_url` URLs send an [Ajax Cart API request](/reference/requests/) on user's click.

The elements become inactive when there is a Cart Ajax API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).

Usecases: all the buttons that change the cart state: increace quantity of a cart item, decreace quantity of a cart item, remove a cart item, clear cart, etc.


### [`data-ajax-cart-toggle-class-button`](/reference/data-ajax-cart-toggle-class-button/)

An HTML element with the `data-ajax-cart-toggle-class-button` attribute adds/removes the `body` CSS class on user's click.

The usecase — show/hide a floating cart section on button click.

### [`data-ajax-cart-quantity-input`](/reference/data-ajax-cart-quantity-input/)

An HTML input element with the `data-ajax-cart-quantity-input` attribute will send an [Ajax Cart API request](/reference/requests/) if its value is changed or the `Enter` key is pressed within the input.

The value will be reset if a user presses the `Esc` button.

The input element becomes `readonly` when there is a Cart Ajax API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).

The usecase — input field for a cart item's quantity value.
