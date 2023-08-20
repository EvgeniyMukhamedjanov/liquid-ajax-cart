---
title: Differences from v1.x.x
layout: docs-v2
---

# Differences from v1.x.x

<p class="lead" markdown="1">
The architecture of the library is redesigned based on 1.5 years of hands-on experience with Liquid Ajax Cart v1.x.x.
</p>

## Migration?

**You don't need to migrate from Liquid Ajax Cart v1.x.x to v2.x.x for existing Shopify stores**,
unless you want to have the v2.x.x features.
The maintenance of the library v1.x.x will be continued.

Meanwhile, it is recommended to use v2.x.x for new Shopify stores, 
as new features will be introduced to Liquid Ajax Cart v2.x.x only.

## Quantity buttons
{: .markdown__badge.markdown__badge--new}

Liquid Ajax Cart v2.0.0 introduces the [`<ajax-cart-quantity>`](/v2/docs/ajax-cart-quantity/) custom tag
and the attributes [`data-ajax-cart-quantity-plus`](/v2/docs/data-ajax-cart-quantity-plus/),
[`data-ajax-cart-quantity-minus`](/v2/docs/data-ajax-cart-quantity-minus/) in order to ajaxify "Plus" and "Minus"
cart item quantity buttons.

The new "Plus" and "Minus" buttons don't initiate a Shopify Cart API Ajax request immediately when clicked.
Liquid Ajax Cart gives the user 300 ms time to click the button again before initiating the request (debounce).
This approach lets the user change the quantity by more than one before sending 
the request and before the cart goes to the “processing requests” mode.

**v1.x.x approach (still supported in v2.x.x but not recommended):**
{%- capture highlight_code -%}
{% raw %}
<a data-ajax-cart-request-button
  href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | minus: 1 }}" >
  Minus one
</a>

<input data-ajax-cart-quantity-input="{{ line_item_index }}"
  name="updates[]" 
  value="{{ item.quantity }}" 
  type="number" />

<a data-ajax-cart-request-button 
  href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
  Plus one 
</a>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

**v2.x.x approach:**
{%- capture highlight_code -%}
{% raw %}
<ajax-cart-quantity>
  <a data-ajax-cart-quantity-minus
    href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
    Minus one 
  </a>

  <input data-ajax-cart-quantity-input="{{ line_item_index }}"
    name="updates[]" 
    value="{{ item.quantity }}" 
    type="number" />

  <a data-ajax-cart-quantity-plus
    href="{{ routes.cart_change_url }}?line={{ line_item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
    Plus one 
  </a>
</ajax-cart-quantity>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

## Product forms
Liquid Ajax Cart v2.x.x doesn't automatically ajaxifies all the Shopify product forms anymore as the v1.x.x did. 
A Shopify product form should be wrapped in the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) 
to be ajaxified:

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
{% include v2/codeblock.html language="liquid" code=highlight_code %}

### Loading state

The `js-ajax-cart-form-in-progress` CSS class is removed.
Instead, the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag gets the `loading` attribute when in progress.

## CSS classes

### js-ajax-cart-set

The `js-ajax-cart-set` CSS class is removed. Use the [`js-ajax-cart-init`](/v2/docs/js-ajax-cart-init/) CSS class instead.

### js-ajax-cart-request-in-progress

The `js-ajax-cart-request-in-progress` CSS class is renamed to [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/).

### js-ajax-cart-form-in-progress

The `js-ajax-cart-form-in-progress` CSS class is removed.
Instead, the [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag gets the `loading` attribute when in progress.

### js-ajax-cart-not-compatible

The `js-ajax-cart-not-compatible` CSS class is removed.

## Data attributes

### data-ajax-cart-bind-state

The `data-ajax-cart-bind-state` attribute is renamed to [`data-ajax-cart-bind`](/v2/docs/data-ajax-cart-bind/).

The source of data for the attribute is the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property
so there is no need to add the `cart.` prefix to the attribute's value.

**v1.x.x:**
{%- capture highlight_code -%}
{% raw %}
<div data-ajax-cart-bind-state="cart.item_count">
  {{ cart.item_count }}
</div>

<div data-ajax-cart-bind-state="cart.total_price | money_with_currency">
  {{ cart.total_price | money_with_currency }}
</div>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

**v2.x.x:**
{%- capture highlight_code -%}
{% raw %}
<div data-ajax-cart-bind="item_count">
  {{ cart.item_count }}
</div>

<div data-ajax-cart-bind="total_price | money_with_currency">
  {{ cart.total_price | money_with_currency }}
</div>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

### data-ajax-cart-configuration

The `data-ajax-cart-configuration` attribute is removed.
The only way to set configuration parameters is the [`liquidAjaxCart.conf()`](/v2/docs/liquid-ajax-cart-conf/) method.

### data-ajax-cart-messages

The `data-ajax-cart-messages` attribute is renamed to [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/),
as there is no plans anymore to display anything but error messages in it.

If you need to display custom messages based on request results,
use the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event.

### data-ajax-cart-toggle-class-button

The `data-ajax-cart-toggle-class-button` attribute is removed.

## Import Liquid Ajax Cart

Liquid Ajax Cart v2.x.x **doesn't export anything**. 
Access to the API is provided by the global [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object only.
Most of the methods and properties of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object
are available only after the [initialization](#initialization).

## Subscription to events 

All the `subscribeToCart*()` functions are replaced with events that are fired at the `document`. 
Therefore, you can subscribe to them even before Liquid Ajax Cart is loaded.

### subscribeToCartSectionsUpdate()

The `subscribeToCartSectionsUpdate()` is removed.
Subscribe to the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event instead, 
as sections are updated after a successful Shopify Cart API Ajax request. 

### subscribeToCartAjaxRequests()

The `subscribeToCartAjaxRequests()` function is removed.
Instead, subscribe to the events [`liquid-ajax-cart:request-start`](/v2/docs/event-request-start/), 
[`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/).

### subscribeToCartStateUpdate()

The `subscribeToCartStateUpdate()` function is removed.

The function let you subscribe to the update of the user's cart state (`state.cart`) and
the `state.status.requestInProgress` properties.

In the v2.x.x the user's cart state is stored in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property.
To subscribe to its update, use the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event,
as the cart state is updated after a successful Shopify Cart API Ajax request:

{%- capture highlight_code -%}
// v1.x.x
liquidAjaxCart.subscribeToCartStateUpdate(( state, isCartUpdated ) => {
  if (isCartUpdated) {
    console.log("User's cart state is updated");
    console.log("New cart state", state.cart);
    console.log("Previous cart state", state.previousCart);
  } 
});

// v2.x.x
document.addEventListener("liquid-ajax-cart:request-end", function(event) {
  const {cart, previousCart} = event.detail;
  
  if (cart) {
    console.log("User's cart state is updated");
    console.log("New cart state", cart); // same as liquidAjaxCart.cart
    console.log("Previous cart state", previousCart);
  }
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

In v2.x.x the `state.status.requestInProgress` value is stored 
in the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property.
To subscribe to its update use the events the events [`liquid-ajax-cart:queue-start`](/v2/docs/event-queue-start/)
and [`liquid-ajax-cart:queue-end`](/v2/docs/event-queue-end/):

{%- capture highlight_code -%}
/**
 * Listen for Liquid Ajax Cart starts processing requests
 */

// v1.x.x
liquidAjaxCart.subscribeToCartStateUpdate(( state, isCartUpdated ) => {
  if (!isCartUpdated && state.status.requestInProgress) {
    console.log("Liquid Ajax Cart started processing requests");
  }
});

// v2.x.x
document.addEventListener("liquid-ajax-cart:queue-start", function(event) {
  console.log("Liquid Ajax Cart started processing requests");
});


/**
 * Listen for Liquid Ajax Cart finishes processing requests
 */

// v1.x.x
liquidAjaxCart.subscribeToCartStateUpdate(( state, isCartUpdated ) => {
  if (!isCartUpdated && !state.status.requestInProgress) {
    console.log("No requests in progress anymore");
  }
});

// v2.x.x
document.addEventListener("liquid-ajax-cart:queue-end", function(event) {
  console.log("No requests in progress anymore");
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### Initialization
{: .markdown__badge.markdown__badge--new}

If you want to run your JavaScript once Liquid Ajax Cart is initialized,
check the [`liquidAjaxCart.init`](/v2/docs/liquid-ajax-cart-init/) property
and listen for the [`liquid-ajax-cart:init`](/v2/docs/event-init/) event:
{% include v2/content/init-event-example.html %}

{% include v2/content/lifecycle-reference.html %}

## getCartState()

The `getCartState()` function is removed. In order to get the same data, 
use the properties of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object.

### state.cart

The user's cart state is stored in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property.

{%- capture highlight_code -%}
// v1.x.x
const cart = liquidAjaxCart.getCartState().cart;

// v2.x.x
const cart = liquidAjaxCart.cart
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### state.previousCart

The `state.previousCart` isn't stored anywhere.
it is returned by the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event only.

{%- capture highlight_code -%}
// v1.x.x
liquidAjaxCart.subscribeToCartStateUpdate(( state, isCartUpdated ) => {
  if (isCartUpdated) {
    console.log("User's cart state is updated");
    console.log("New cart state", state.cart);
    console.log("Previous cart state", state.previousCart);
  }
});

// v2.x.x
document.addEventListener("liquid-ajax-cart:request-end", function(event) {
  const {cart, previousCart} = event.detail;
  
  if (cart) {
    console.log("User's cart state is updated");
    console.log("New cart state: ", cart); // same as liquidAjaxCart.cart
    console.log("Previous cart state: ", previousCart);
  }
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### state.status.requestInProgress

The `state.status.requestInProgress` value is stored in the [`liquidAjaxCart.processing`](/v2/docs/liquid-ajax-cart-processing/) property.

{%- capture highlight_code -%}
// v1.x.x
const isProcessing = liquidAjaxCart.getCartState().status.requestInProgress;

// v2.x.x
const isProcessing = liquidAjaxCart.processing;
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### state.status.cartStateSet

The `state.status.cartStateSet` value is not stored anymore. If Liquid Ajax Cart is initialized, the cart state always exists.

## cartRequest*() methods

All the function that send Shopify Cart API Ajax requests are replaced 
with the methods of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object:
* `cartRequestGet()` → [`liquidAjaxCart.get()`](/v2/docs/liquid-ajax-cart-get/);
* `cartRequestAdd()` → [`liquidAjaxCart.add()`](/v2/docs/liquid-ajax-cart-add/);
* `cartRequestChange()` → [`liquidAjaxCart.change()`](/v2/docs/liquid-ajax-cart-change/);
* `cartRequestUpdate()` → [`liquidAjaxCart.update()`](/v2/docs/liquid-ajax-cart-update/);
* `cartRequestClear()` → [`liquidAjaxCart.clear()`](/v2/docs/liquid-ajax-cart-clear/).

### firstComplete, lastComplete

The `firstComplete`, `lastComplete` request parameters are renamed to `firstCallback`, `lastCallback` accordingly.

### newQueue

The `newQueue` parameter is replaced with the `important` parameter which works in the opposite way:
when the `important` is `true`, the request will be added to the beginning of the [Queue of requests](/v2/docs/queue-of-requests/).

The default value for the `important` parameter is `false`.

## Configuration

### configureCart()

The `configureCart()` method is renamed to [`conf()`](/v2/docs/liquid-ajax-cart-conf/).

### data-ajax-cart-configuration

The `data-ajax-cart-configuration` attribute is removed.
The only way to set configuration parameters is the [`liquidAjaxCart.conf()`](/v2/docs/liquid-ajax-cart-conf/) method.

### productFormsFilter

The `productFormsFilter` configuration parameter is removed as Liquid Ajax Cart doesn't ajaxify
Shopify product forms automatically.

### messageBuilder

The `messageBuilder` configuration parameter is removed.
If you need to display custom messages based on request results,
use the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event.

### stateBinderFormatters

The `stateBinderFormatters` is renamed to [`binderFormatters`](/v2/docs/binder-formatters/).

### addToCartCssClass

The `addToCartCssClass` configuration parameter is removed.
Use the [`liquid-ajax-cart:request-end`](/v2/docs/event-request-end/) event to append a CSS class
when a product is added to the cart. 
The ready snippet: [Open the Ajax-cart when a user adds a product to the cart](/v2/docs/js-snippets/#open-the-ajax-cart-when-a-user-adds-a-product-to-the-cart).