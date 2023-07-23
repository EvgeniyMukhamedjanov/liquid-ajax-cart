---
title: Lifecycle, events, API
layout: docs-v2
---

# Lifecycle, events, API

<p class="lead" markdown="1">
Liquid Ajax Cart provides methods to perform Shopify Cart API Ajax requests, 
properties and events to extend its functionality. 
</p>

## Import the library

In order to install Liquid Ajax Cart, you should include the library code to the page, 
as it was explained in the "[Installation](/v2/docs/)" guide. 
Once the library is included, Liquid Ajax Cart defines the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object
as a `window` object's property to be accessible from everywhere.

At this point the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object has: 
* the [`init`](/v2/docs/liquid-ajax-cart-init/) property — reflects the initialization status of the library, which is `false` at the moment. 
* the [`conf()`](/v2/docs/liquid-ajax-cart-conf/) method — lets you set configuration parameters.

{%- capture highlight_code -%}
<script type="module">
  import {% include v2/last-release-file-name.html asset_url=true %};

  // Is Liquid Ajax Cart initialized: false
  console.log("Is Liquid Ajax Cart initialized: ",  window.liquidAjaxCart.init);

  // Configuration function is available right after import
  window.liquidAjaxCart.conf('updateOnWindowFocus', false);
</script>
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

## Initialization

The Liquid Ajax Cart initialization process starts automatically once the library is imported.

### Obtaining cart state
During the initialization process, Liquid Ajax Cart obtains the user cart state data 
which is necessary for the library to work. Firstly, Liquid Ajax Cart tries to pull the cart data from the first found 
`script` element with the [`data-ajax-cart-initial-state`](/v2/docs/data-ajax-cart-initial-state/) attribute, 
which is supposed to contain the cart data in the JSON format, as it was shown in the "[Installation](/v2/docs/)" guide.
If there is no such element found, Liquid Ajax Cart performs a Shopify Cart API Ajax request to pull the cart state data.

### Populating `liquidAjaxCart` object

When the cart state data is received, Liquid Ajax Cart populates the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object
with the following methods and properties:
* [`get()`](/v2/docs/liquid-ajax-cart-get/) — makes a Shopify Cart API `GET /cart.js` Ajax request;
* [`add()`](/v2/docs/liquid-ajax-cart-add/) — makes a `POST /cart/add.js` request;
* [`change()`](/v2/docs/liquid-ajax-cart-change/) — makes a `POST /cart/change.js` request;
* [`update()`](/v2/docs/liquid-ajax-cart-update/) — makes a `POST /cart/update.js` request;
* [`clear()`](/v2/docs/liquid-ajax-cart-clear/) — makes a `POST /cart/clear.js` request;
* [`cart`](/v2/docs/liquid-ajax-cart-cart/) — keeps the current cart state data;
* [`processing`](/v2/docs/liquid-ajax-cart-processing/) — `true` if there is a request in progress now.

Once the initialization is finished, 
the [`liquidAjaxCart.init`](/v2/docs/liquid-ajax-cart-init/) property becomes `true`,
Liquid Ajax Cart adds the [`js-ajax-cart-init`](/v2/docs/js-ajax-cart-init/) CSS class to the `html` tag
and fires the [`liquid-ajax-cart:init`](/v2/docs/event-init/) event.

### Firing `liquid-ajax-cart:init` event

Most of the Liquid Ajax Cart methods are available after the initialization.
If you have some code that depends on Liquid Ajax Cart and should be run as soon as possible once the library is available, 
use the [`liquid-ajax-cart:init`](/v2/docs/event-init/) event 
along with the [`liquidAjaxCart.init`](/v2/docs/liquid-ajax-cart-init/) property:
{% include v2/content/init-event-example.html %}

## Shopify Cart API requests

Liquid Ajax Cart uses {% include v2/content/links-to-request-methods.html %} to perform Shopify Cart API Ajax requests.

For example, when a user clicks an "Add to cart" button in a product form, 
wrapped with the [`ajax-cart-product-form`](/v2/docs/ajax-cart-product-form/) custom tag,
Liquid Ajax Cart performs a Shopify Cart API `/cart/add.js` Ajax request
using the [`liquidAjaxCart.add()`](/v2/docs/liquid-ajax-cart-add/) method.

### `liquid-ajax-cart:request-start` event

Before executing a Shopify Cart API Ajax request, Liquid Ajax Cart creates a [Request state](/v2/docs/request-state/) object,
with all the information about the request, and triggers the [`liquid-ajax-cart:request-start`](/v2/docs/event-request-start/) event:

{% include v2/content/event-request-start-example.html %}

As the request is still not performed, you can mutate or cancel the request 
in the [`liquid-ajax-cart:request-start`](/v2/docs/event-request-start/) event listener.

### `liquid-ajax-cart:request-end` event

Apart from just sending a Shopify Cart API request, {% include v2/content/links-to-request-methods.html %}
do tons of things: re-render cart-related HTML on the page, update cart state data, toggles CSS classes.
That is why you should **always** use {% include v2/content/links-to-request-methods.html %}
when you want to perform your own Shopify Cart API Ajax requests.

### Queue of requests

When one of {% include v2/content/links-to-request-methods.html %} is called,
Liquid Ajax Cart doesn't perform a Shopify Cart API Ajax request immediately.
The request will be added to the [Queue of requests](/v2/docs/queue-of-requests/).

Once the [Queue](/v2/docs/queue-of-requests/) isn't empty, Liquid Ajax Cart begins executing requests according to their order.

If the [Queue of requests](/v2/docs/queue-of-requests/) isn't empty (that means a Shopify Cart API Ajax request is processing now)
the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property will be `true`.

## Processing lifecycle

In order to overview how Liquid Ajax Cart works, 
let's say, we have a Shopify product form, 
ajaxified using the [`<ajax-cart-product-form>`](/v2/ajax-cart-product-form/) custom tag:

{%- capture highlight_code -%}
{% raw %}
<ajax-cart-product-form>
  {% form 'product', product %}
    <!-- form content -->

    <button type="submit" name="add">
      Add to cart
    </button>
  {% endform %}
</ajax-cart-product-form>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/main-product.liquid" language="liquid" code=highlight_code %}

Let's also imagine, that Liquid Ajax Cart isn't executing any other requests right now, 
so the [Queue of requests](/v2/docs/queue-of-requests/) is empty.

This is what happens when a user clicks the "Add to cart" button:

### 1. Adding the request to the Queue

1. The [`<ajax-cart-product-form>`](/v2/ajax-cart-product-form/) custom tag collects the product form data and calls the [`liquidAjaxCart.add()`](/v2/liquid-ajax-cart-add/) method;
2. Liquid Ajax Cart puts the request to the [Queue of requests](/v2//docs/queue-of-requests/);
3. As the [Queue of requests](/v2//docs/queue-of-requests/) has a request to execute, the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property becomes `true`;
4. The [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class is added to the `html` tag;
5. **Liquid Ajax Cart triggers the [`liquid-ajax-cart:queue-start`](/v2/docs/event-queue-start/) event**.

### 2. Preparing the request

1. As the request is the only request in the [Queue](/v2/docs/queue-of-requests/), it is chosen to be executed;
2. A [Request state](/v2/docs/request-state/) object get created for this request;
3. Liquid Ajax Cart finds all the Shopify sections on the page, that contain the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements, and collects the IDs of the Shopify sections found;
4. Liquid Ajax Cart modifies the request by adding the `section` property to the request body to make Shopify respond with the updated HTML of the Shopify sections found ([Bundled section rendering](https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering)).
5. The [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) element, related to the product form, gets cleaned.
6. **Liquid Ajax Cart triggers the [`liquid-ajax-cart:request-start`](/v2/docs/event-request-start/) event**; you still can modify or cancel the request in the event listener;

### 3. Executing the request

1. If the request isn't cancelled (`info.cancel` property of the [Request state](/v2/docs/request-state/) object isn't `true`), then the request gets executed;
2. Liquid Ajax Cart populates the [Request state](/v2/docs/request-state/) object according to the result of the request (the `responseData`, `extraResponseData`, `fetchError` properties);
3. If the request is successful, Liquid Ajax Cart pulls the HTML for the cart-related sections from the response and updates the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements;
4. If the request is failed, Liquid Ajax Cart puts an error message to the related [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) element;
5. If the request is successful, Liquid Ajax Cart pulls the cart state data from the response and saves it in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property;
6. The [`data-ajax-cart-bind`](/v2/docs/data-ajax-cart-bind/) elements HTML gets updated according to the cart state data;
7. The [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input/) and [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) input values get updated according to the cart state data;
8. The [`js-ajax-cart-empty`](/v2/docs/js-ajax-cart-empty/), [`js-ajax-cart-not-empty`](/v2/docs/js-ajax-cart-not-empty/) CSS classes get updated according to the cart state data;
9. **Liquid Ajax Cart triggers the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event**;
10. The `lastComplete` request's callback is called, if defined;
11. The request gets removed from the [Queue of requests](/v2//docs/queue-of-requests/);

### 4. Finishing the Queue

If there is no request in the [Queue of requests](/v2//docs/queue-of-requests/), it will be finished: 

1. The [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property becomes `false`;
2. The [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class is removed from the `html` tag;
3. **Liquid Ajax Cart triggers the [`liquid-ajax-cart:queue-end`](/v2/docs/event-queue-end/) event**.