---
title: Cart state
layout: docs-v2
disable_anchors: true
---

# Cart state
<p class="lead">
Cart state is a JavaScript object where Liquid Ajax Cart keeps the current user cart data and current state of the library.
</p>

Cart state gets updated after each Shopify Cart API Ajax request.

Always use {% include v2/content/links-to-request-methods.html %}
to make Shopify Cart API Ajax requests rather than direct `fetch` calls. 
In addition to sending Ajax requests, those `liquidAjaxCart` methods update the Cart state object and
re-render [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section) elements after each request.

## Structure

{% include v2/content/cart-state-json-example.html %}

### `cart`
Contains JSON versions of the Shopify [`cart`](https://shopify.dev/api/liquid/objects/cart) Liquid object.

The property gets updated after each successful Shopify Cart API Ajax request.

### `previousCart`

Contains a JSON object that was in the `cart` property before the latest successful Shopify Cart API Ajax request.

If the latest Shopify Cart API Ajax request didn't make any changed in the cart,
for example a `GET /cart.js` or an empty `/cart/update.js` request,
then the content of the `cart` and the `previousCart` objects will be identical.

### `status.cartStateSet`

The property is `true` if the `cart` property is loaded.

### `status.requestInProgress`

The property is `true` if there are one or more Shopify Cart API Ajax requests in [Queues](/v2/docs/queues-of-requests/).

## Interaction

Use the [`state`](/v2/docs/liquid-ajax-cart-state/) property of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object to get the current state.

If you want to run your Javascript code each time when the state is updated — 
listen to the [`liquid-ajax-cart:state`](/v2/docs/state-event/) event at the `document`.