# State
State is a Javascript object where Liquid Ajax Cart keeps the information related to user’s cart.

{% include code/state.html %}

State is subscribed to [`Cart Ajax API requests`](/reference/requests/) using [`subscribeToCartAjaxRequests`](/reference/subscribeToCartAjaxRequests/) function and it updates its properties before and after each request.

To make sure that State is up to date, always use the functions from the [`Cart Ajax API requests`](/reference/requests/) reference instead of direct Cart API calls.

### Properties

##### `cart`
Contains JSON versions of the Shopify `cart` liquid object. 

The property data gets loaded from the [`data-ajax-cart-initial-state`](/reference/data-ajax-cart-initial-state/) script.

The property gets updated after each successful [`Cart Ajax API request`](/reference/requests).

##### `status.cartStateSet`

The `status.cartStateSet` is `true` if the `cart` property is loaded. 

The [`.js-ajax-cart-set`](/reference/js-ajax-cart-set/) CSS class will be added to the `body` tag if the property is `true`.

##### `requestInProgress`

The `status.cartStateSet` is `true` if there are one or more [`Cart Ajax API requests`](/reference/requests/) in progress.

If the property is `true`:

	* [controls](/reference/controls/) become inactive,

	* the [`.js-ajax-cart-request-in-progress`](/reference/js-ajax-cart-request-in-progress/) CSS class will be added to the `body` tag.