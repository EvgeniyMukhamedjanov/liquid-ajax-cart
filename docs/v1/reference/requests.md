---
title: Cart Ajax API requests
layout: page
---

# Cart Ajax API requests

It is highly recommended to use the following functions to make Shopify Cart Ajax API calls so Liquid Ajax Cart will keep the [State](/v1/reference/state/), [cart sections](/v1/reference/sections/), [body CSS classes](/v1/reference/body-css-classes/) and [`data-ajax-cart-bind-state`](/v1/reference/data-ajax-cart-bind-state/) content up to date:

* [`cartRequestGet`](/v1/reference/cartRequestGet/) — sends a request to the `GET /cart.js` endpoint;
* [`cartRequestAdd`](/v1/reference/cartRequestAdd/) — to the `POST /cart/add.js` endpoint;
* [`cartRequestChange`](/v1/reference/cartRequestChange/) — to the `POST /cart/change.js` endpoint;
* [`cartRequestUpdate`](/v1/reference/cartRequestUpdate/) — to the `POST /cart/update.js` endpoint;
* [`cartRequestClear`](/v1/reference/cartRequestClear/) — to the `POST /cart/clear.js` endpoint.

### Subscribe to requests

If you want to run your Javascript before or after a Shopify Cart Ajax API request, mutate or cancel a request before it is started — use the [`subscribeToCartAjaxRequests`](/v1/reference/subscribeToCartAjaxRequests/) function to add your callback.

### Queues of requests

All Shopify Cart API requests don't get performed immediately but get added to [queues](/v1/reference/queues/).