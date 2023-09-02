---
title: The liquidAjaxCart object
layout: docs-v2
---

# The liquidAjaxCart object

<p class="lead" markdown="1">
An object which exposes the methods and properties of the Liquid Ajax Cart library.
The `liquidAjaxCart` object is defined as a property of the `window` object to be accessible from everywhere.
</p>

## Methods and properties

A few of them are available as soon as the library code is loaded:
* [`conf()`](/v2/liquid-ajax-cart-conf/) — sets configuration parameter values;
* [`init`](/v2/liquid-ajax-cart-init/) — initialization status (boolean).

The rest of them are available only after the [initialization](/v2/lifecycle-events-api/#initialization):

* [`get()`](/v2/liquid-ajax-cart-get/) — makes a Shopify Cart API `GET /cart.js` Ajax request;
* [`add()`](/v2/liquid-ajax-cart-add/) — makes a `POST /cart/add.js` request;
* [`change()`](/v2/liquid-ajax-cart-change/) — makes a `POST /cart/change.js` request;
* [`update()`](/v2/liquid-ajax-cart-update/) — makes a `POST /cart/update.js` request;
* [`clear()`](/v2/liquid-ajax-cart-clear/) — makes a `POST /cart/clear.js` request;
* [`cart`](/v2/liquid-ajax-cart-cart/) — current cart state (JSON);
* [`processing`](/v2/liquid-ajax-cart-processing/) — `true` if there is a request in progress now (boolean).

## Access after initialization

Since most of the `liquidAjaxCart` methods and properties are available only after the initialization,
use the [`liquid-ajax-cart:init`](/v2/event-init/) event
along with the [`liquidAjaxCart.init`](/v2/liquid-ajax-cart-init/) property
when your code depends on Liquid Ajax Cart and should be executed as soon as the library is fully available:
{% include v2/content/init-event-example.html %}