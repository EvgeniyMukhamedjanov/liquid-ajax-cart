---
title: Cart Ajax API requests
layout: page
---

# Cart Ajax API requests

It is highly recommended to use the following functions to make Shopify Cart Ajax API calls so Liquid Ajax Cart will keep the [State](/reference/state/), [cart sections](/reference/sections/), [body CSS classes](/reference/body-css-classes/) and [`data-ajax-cart-bind-state`](/reference/data-ajax-cart-bind-state/) content up to date:

* [`cartRequestGet`](/reference/cartRequestGet/) — sends a request to the `GET /cart.js` endpoint;
* [`cartRequestAdd`](/reference/cartRequestAdd/) — to the `POST /cart/add.js` endpoint;
* [`cartRequestChange`](/reference/cartRequestChange/) — to the `POST /cart/change.js` endpoint;
* [`cartRequestUpdate`](/reference/cartRequestUpdate/) — to the `POST /cart/update.js` endpoint;
* [`cartRequestClear`](/reference/cartRequestClear/) — to the `POST /cart/clear.js` endpoint.

### Subscribe to requests

If you want to run your Javascript before or after a Shopify Cart Ajax API request, mutate or cancel a request before it is started — use the [`subscribeToCartAjaxRequests`](/reference/subscribeToCartAjaxRequests/) function to add your callback.

### Queues of requests

All Shopify Cart API requests don't get performed immediately but get added to [queues](/reference/queues/).