---
title: Lifecycle, events, API
layout: docs-v2
---

# Lifecycle, events, API

<p class="lead" markdown="1">
Liquid Ajax Cart provides methods to perform Shopify Cart API Ajax requests, 
properties and events to extend its functionality. 
</p>

## Initialization

In order to install Liquid Ajax Cart, you should include the library code to the page, 
as it was explained in the "[Installation](/v2/docs/)" guide.

Once the library is included, Liquid Ajax Cart does the following:

<ul class="steps-list">
<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Creates the <code>liquidAjaxCart</code> object</div>
<div class="steps-list__content" markdown="1">
The [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object is defined
as a `window` object's property to be accessible from everywhere.
At this point it has:
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

</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Gets the cart state</div>
<div class="steps-list__content" markdown="1">
Firstly, Liquid Ajax Cart tries to pull the cart data from the first found 
`script` element with the [`data-ajax-cart-initial-state`](/v2/docs/data-ajax-cart-initial-state/) attribute, 
which is supposed to contain the cart data in the JSON format, as it was shown in the "[Installation](/v2/docs/)" guide.
If there is no such element found, Liquid Ajax Cart performs a Shopify Cart API Ajax request to pull the cart state data.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Updates the <code>liquidAjaxCart</code> object</div>
<div class="steps-list__content" markdown="1">
When the cart state data is received, the [`init`](/v2/docs/liquid-ajax-cart-init/) property becomes `true`. 
Also, Liquid Ajax Cart populates the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object
with the following methods and properties:
* [`get()`](/v2/docs/liquid-ajax-cart-get/) — makes a Shopify Cart API `GET /cart.js` Ajax request;
* [`add()`](/v2/docs/liquid-ajax-cart-add/) — makes a `POST /cart/add.js` request;
* [`change()`](/v2/docs/liquid-ajax-cart-change/) — makes a `POST /cart/change.js` request;
* [`update()`](/v2/docs/liquid-ajax-cart-update/) — makes a `POST /cart/update.js` request;
* [`clear()`](/v2/docs/liquid-ajax-cart-clear/) — makes a `POST /cart/clear.js` request;
* [`cart`](/v2/docs/liquid-ajax-cart-cart/) — keeps the current cart state data;
* [`processing`](/v2/docs/liquid-ajax-cart-processing/) — `true` if there is a request in progress now.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Adds the <code>js-ajax-cart-init</code> CSS class</div>
<div class="steps-list__content" markdown="1">
The [`js-ajax-cart-init`](/v2/docs/js-ajax-cart-init/) CSS class is added to the `html` tag.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--event">Event</span></div>
<div class="steps-list__title"><h3 id="liquid-ajax-cart-init">Triggers the <code>liquid-ajax-cart:init</code> event</h3></div>
<div class="steps-list__content" markdown="1">
Since most of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) methods and properties are available after the initialization, 
use the [`liquid-ajax-cart:init`](/v2/docs/event-init/) event 
along with the [`liquidAjaxCart.init`](/v2/docs/liquid-ajax-cart-init/) property
when your code depends on Liquid Ajax Cart and should be run as soon as the library is available:
{% include v2/content/init-event-example.html %}
</div>
</li>
</ul>

## Shopify Cart API requests

Liquid Ajax Cart uses {% include v2/content/links-to-request-methods.html %} to perform Shopify Cart API Ajax requests.

For example, when a user clicks an "Add to cart" button in a product form, 
wrapped with the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag,
Liquid Ajax Cart calls the [`liquidAjaxCart.add()`](/v2/docs/liquid-ajax-cart-add/) method 
in order to performs a Shopify Cart API `/cart/add.js` Ajax request.

When you need to send a Shopify Cart API Ajax request in your JavaScript code, 
use {% include v2/content/links-to-request-methods.html %} rather than `fetch` or any other way of sending requests.
Otherwise, Liquid Ajax Cart won't update the cart-related content on the page.

### Queue of requests

When one of {% include v2/content/links-to-request-methods.html %} is called,
Liquid Ajax Cart adds a Shopify Cart API Ajax request to the [Queue of requests](/v2/docs/queue-of-requests/).

Once the [Queue](/v2/docs/queue-of-requests/) isn't empty, Liquid Ajax Cart switches to the "processing requests" mode 
and executes requests according to their order until the [Queue](/v2/docs/queue-of-requests/) is empty.

When Liquid Ajax Cart is in the "processing requests" mode, 
the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property is `true`
and the [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class is added to the `html` tag.

## Queue lifecycle

When one of {% include v2/content/links-to-request-methods.html %} is called,
Liquid Ajax Cart adds a Shopify Cart API Ajax request to the [Queue of requests](/v2/docs/queue-of-requests/).

If the [Queue](/v2/docs/queue-of-requests/) **isn't empty** when a new request is getting added,
that means Liquid Ajax Cart is already in the "processing requests" mode, 
and the new request will be added to the end of the [Queue](/v2/docs/queue-of-requests/)
and executed when the previous requests are finished:

{%- capture highlight_code -%}
#1: [/cart/change.js — executing]
#2: [/cart/add.js — new added request]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

Each request is executed according to the [Request lifecycle](#request-lifecycle). 

### Switching from the "idle" to the "processing requests" mode

If the [Queue](/v2/docs/queue-of-requests/) **is empty** when a new request is getting added,
that means Liquid Ajax Cart is in the "idle" mode and has to switch to the "request processing" mode.

Liquid Ajax Cart will do the following:

<ul class="steps-list">
<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Adds the request to the Queue</div>
<div class="steps-list__content" markdown="1">
As the [Queue](/v2/docs/queue-of-requests/) has been empty, the new request will be the first:
{%- capture highlight_code -%}
#1: [/cart/add.js — new added request]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Sets <code>liquidAjaxCart.processing</code> to <code>true</code></div>
<div class="steps-list__content" markdown="1">
Since Liquid Ajax Cart was in the "idle" mode,
the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing) property was `false`.
Now the [Queue of requests](/v2/docs/queue-of-requests/) has a request to execute, 
and the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property becomes `true`.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Adds the <code>js-ajax-cart-processing</code> CSS class</div>
<div class="steps-list__content" markdown="1">
The [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class is added to the `html` tag;
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--event">Event</span></div>
<div class="steps-list__title"><h3 id="liquid-ajax-cart-queue-start">Triggers the <code>liquid-ajax-cart:queue-start</code> event</h3></div>
<div class="steps-list__content" markdown="1">
Since Liquid Ajax Cart is switching to the "processing requests" mode,
the [`liquid-ajax-cart:queue-start`](/v2/docs/event-queue-start/) event is fired.
</div>
</li>

<li class="steps-list__step steps-list__step--feat">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Executes requests</div>
<div class="steps-list__content" markdown="1">
Liquid Ajax Cart executes the first request in the [Queue](/v2/docs/queue-of-requests/):
{%- capture highlight_code -%}
#1: [/cart/add.js — executing]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

If one of {% include v2/content/links-to-request-methods.html %} is called while the request is executing,
Liquid Ajax Cart will add the new requests to the end of the [Queue](/v2/docs/queue-of-requests/) and
execute them until the [Queue](/v2/docs/queue-of-requests/) is empty:
{%- capture highlight_code -%}
#1: [/cart/add.js — executing]
#2: [/cart/change.js]
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

Each request is executed according to the [Request lifecycle](#request-lifecycle).
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Sets <code>liquidAjaxCart.processing</code> to <code>false</code></div>
<div class="steps-list__content" markdown="1">
Once all requests are executed and the [Queue](/v2/docs/queue-of-requests/) is empty,
Liquid Ajax Cart is switching back to the "idle" mode,
thus it sets [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing) property was `false`.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Removes the <code>js-ajax-cart-processing</code> CSS class</div>
<div class="steps-list__content" markdown="1">
The [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class is removed from the `html` tag;
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--event">Event</span></div>
<div class="steps-list__title"><h3 id="liquid-ajax-cart-queue-end">Triggers the <code>liquid-ajax-cart:queue-end</code> event</h3></div>
<div class="steps-list__content" markdown="1">
Since Liquid Ajax Cart is switching back to the "idle" mode,
the [`liquid-ajax-cart:queue-end`](/v2/docs/event-queue-end/) event is fired.

Examples:
* [Add a gift to the cart if the total price is $100 or higher](/v2/docs/js-snippets/#add-a-gift-to-the-cart-if-the-total-price-is-100-or-higher);
</div>
</li>
</ul>

## Request lifecycle

<ul class="steps-list">
<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Creates a Request state object</div>
<div class="steps-list__content" markdown="1">

Liquid Ajax Cart creates a [Request state](/v2/docs/request-state/) object for each Shopify Cart API request.
When created, the object has the following properties:

{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {…},
  "requestType": "add",
  "info": {…}
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}

</div>
</li>
<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Prepares the request body</div>
<div class="steps-list__content" markdown="1">
Liquid Ajax Cart adds the `sections` parameter to the request body
with the IDs of the Shopify sections that contain [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements.
Shopify will re-render the sections HTML and attach it to the request response 
([Bundled section rendering](https://shopify.dev/docs/api/ajax/reference/cart#bundled-section-rendering)).
The modified `requestBody` property of the [Request state](/v2/docs/request-state/) object:

{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {
    "items": [
      {
        "id": 40934235668668,
        "quantity": 1
      }
    ],
    "sections": "my-ajax-cart"
  },
  "requestType": "add",
  "info": {…}
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Hides errors in the the <code>data-ajax-cart-errors</code> elements.</div>
<div class="steps-list__content" markdown="1">
Liquid Ajax Cart empties the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) elements related to the request.
For example, if the request was initiated by a product form, only the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) element
that belongs to the form, will be emptied.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--event">Event</span></div>
<div class="steps-list__title"><h3 id="liquid-ajax-cart-request-start">Triggers the <code>liquid-ajax-cart:request-start</code> event</h3></div>
<div class="steps-list__content" markdown="1">
The [`liquid-ajax-cart:request-start`](/v2/docs/event-request-start/) event is fired a moment before the request is performed.
You can read, modify or cancel the request in your event listener.
</div>
</li>

<li class="steps-list__step steps-list__step--feat">
<div class="steps-list__badge-list"><span class="steps-list__badge">If not cancelled</span></div>
<div class="steps-list__title">Sends the request to Shopify</div>
<div class="steps-list__content" markdown="1">
Liquid Ajax Cart performs the request if it isn't cancelled 
(the `info.cancel` property of the [Request state](/v2/docs/request-state/) object isn't `true`).
Otherwise, this step is skipped.

If the request is successful but the response doesn't have the cart state object (the `/cart/add.js` endpoint is the case),
or if the response doesn't have HTML of each Shopify section needed,
Liquid Ajax Cart performs an additional `/cart/update.js` request to get the data.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Updates the Request state object</div>
<div class="steps-list__content" markdown="1">
Liquid Ajax Cart populates the [Request state](/v2/docs/request-state/) object according to the request result 
— the `responseData`/`extraResponseData`/`fetchError` properties:

{%- capture highlight_code -%}
{
  "endpoint": "/cart/add.js",
  "requestBody": {…},
  "requestType": "add",
  "info": {…},
  "responseData": {
    "ok": true,
    "status": 200,
    "body": {…}
  },
  "extraResponseData": {…} 
}
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--callback">Callback</span></div>
<div class="steps-list__title">Calls the <code>firstCallback</code> function</div>
<div class="steps-list__content" markdown="1">
When you directly call one of {% include v2/content/links-to-request-methods.html %},
you can define the <code>firstCallback</code> function.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">If request is successful</span></div>
<div class="steps-list__title">Replaces the <code>data-ajax-cart-section</code> elements</div>
<div class="steps-list__content" markdown="1">
If the request is successful, Liquid Ajax Cart pulls the Shopify sections HTML from the request response, 
that contains re-rendered [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements HTML, 
and replaces the current [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements outer HTML
with the new one.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">If request is failed</span></div>
<div class="steps-list__title">Shows errors in the <code>data-ajax-cart-errors</code> elements</div>
<div class="steps-list__content" markdown="1">
If the request is failed, Liquid Ajax Cart puts an error message to the related [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) element;
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge">If request is successful</span></div>
<div class="steps-list__title">Saves the cart state in <code>liquidAjaxCart.cart</code> property</div>
<div class="steps-list__content" markdown="1">
If the request is successful, Liquid Ajax Cart pulls the cart state data from the response and saves it in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property;
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title">Syncs DOM with the cart state</div>
<div class="steps-list__content" markdown="1">
The [`data-ajax-cart-bind`](/v2/docs/data-ajax-cart-bind/) elements HTML gets updated according to the cart state data;

The [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input/) and [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) input values get updated according to the cart state data;

The [`js-ajax-cart-empty`](/v2/docs/js-ajax-cart-empty/), [`js-ajax-cart-not-empty`](/v2/docs/js-ajax-cart-not-empty/) CSS classes get updated according to the cart state data;
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--event">Event</span></div>
<div class="steps-list__title"><h3 id="liquid-ajax-cart-request-end">Triggers the <code>liquid-ajax-cart:request-end</code> event</h3></div>
<div class="steps-list__content" markdown="1">
Liquid Ajax Cart triggers the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event**;

Examples:
* [Open the Ajax-cart when a user adds a product to the cart](/v2/docs/js-snippets/#open-the-ajax-cart-when-a-user-adds-a-product-to-the-cart);
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"><span class="steps-list__badge steps-list__badge--callback">Callback</span></div>
<div class="steps-list__title">Calls <code>lastCallback</code> function</div>
<div class="steps-list__content" markdown="1">
When you directly call one of {% include v2/content/links-to-request-methods.html %},
you can define the <code>lastCallback</code> function.
</div>
</li>

<li class="steps-list__step">
<div class="steps-list__badge-list"></div>
<div class="steps-list__title"></div>
<div class="steps-list__content" markdown="1">
The request gets removed from the [Queue of requests](/v2/docs/queue-of-requests/);
</div>
</li>
</ul>