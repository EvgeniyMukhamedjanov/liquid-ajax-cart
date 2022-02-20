# Controls

### [`data-ajax-cart-request-button`](/reference/data-ajax-cart-request-button/)

The `data-ajax-cart-request-button` attribute ajaxifies HTML links that lead to `routes.cart_*_url` URLs. Supports not only `a` HTML elements.

An HTML element with the `data-ajax-cart-request-button` attribute becomes inactive when there is a Shopify Cart API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).

Usecases: "Plus" cart item, "Minus" cart item, "Remove" cart item buttons, "Clear cart" button, "Add to cart" button outside of a product form.


### [`data-ajax-cart-toggle-class-button`](/reference/data-ajax-cart-toggle-class-button/)

An HTML element with the `data-ajax-cart-toggle-class-button` attribute adds/removes the `body` CSS class that is passed as the value on a user's click.

A usecase — show/hide a floating cart section on a button click.

### [`data-ajax-cart-quantity-input`](/reference/data-ajax-cart-quantity-input/)

The `data-ajax-cart-quantity-input` attribute ajaxifies an `input` HTML element for a cart line item's quantity.

If the value of the `input` element is changed or the `Enter` key is pressed within, Liquid Ajax Cart will send a Shopify Cart API request to update the cart.

The `input`'s value will be reset if a user presses the `Esc` button.

The input element becomes `disabled` when there is a Shopify Cart API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).

### [`data-ajax-cart-property-input`](/reference/data-ajax-cart-property-input/)

The `data-ajax-cart-property-input` attribute ajaxifies an `input`, `select` or `textarea` HTML element for a cart line item's property, a cart attribute or the cart note.

If the value of the element is changed or the `Enter` key is pressed within (`Ctrl` + `Enter` for a `textarea`), Liquid Ajax Cart will send a Shopify Cart API request to update the cart.

The element's value will be reset if a user presses the `Esc` button.

The element becomes `disabled` when there is a Shopify Cart API request in progress (if the [State](/reference/state/)'s `status.requestInProgress` property is `true`).