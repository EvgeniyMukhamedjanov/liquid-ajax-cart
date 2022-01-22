# State
State is a Javascript object where Liquid Ajax Cart keeps the information related to user’s cart.

{% include code/state.html %}

State gets updated after each [Cart Ajax API request](/reference/requests/).

Always use the functions from the [Cart Ajax API requests](/reference/requests/) reference instead of direct Cart API calls and Liquid Ajax Cart will make sure that the State is up to date.

## Properties

##### `cart`
Contains JSON versions of the Shopify [`cart`](https://shopify.dev/api/liquid/objects/cart) liquid object. 

The property data is getting loaded from the [`data-ajax-cart-initial-state`](/reference/data-ajax-cart-initial-state/) script.

The property gets updated after each successful [Cart Ajax API request](/reference/requests/).

##### `status.cartStateSet`

The `status.cartStateSet` is `true` if the `cart` property is loaded. 

The [`js-ajax-cart-set`](/reference/js-ajax-cart-set/) CSS class will be added to the `body` tag if the property is `true`.

##### `requestInProgress`

The `status.requestInProgress` is `true` if there are one or more [Cart Ajax API requests](/reference/requests/) in progress.

If the property is `true`:
  * some [controls](/reference/controls/) become inactive,
  * the [`js-ajax-cart-request-in-progress`](/reference/js-ajax-cart-request-in-progress/) CSS class will be added to the `body` tag.

## Interactions

Use the [`getCartState`](/reference/getCartState/) function to get the current state.

If you want to run your Javascript code after the state is updated — use the [`subscribeToCartStateUpdate`](/reference/subscribeToCartStateUpdate/) function.
