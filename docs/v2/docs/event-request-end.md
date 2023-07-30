---
title: liquid-ajax-cart:request-end
layout: docs-v2
---

# liquid-ajax-cart:request-end

<p class="lead" markdown="1">
The `liquid-ajax-cart:request-end` event is fired at the `document` after a Shopify Cart API Ajax request is finished
and Liquid Ajax Cart updates the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property
and re-renders all cart-related elements.  
</p>

## How it works

The `liquid-ajax-cart:request-end` event is fired for each Shopify Cart API Ajax request, initiated by Liquid Ajax Cart,
even if the request is [cancelled](/v2/docs/request-state/#infocancel).

Let's say you defined a function `requestEndHandler` as a listener of the `liquid-ajax-cart:request-end` event:
{%- capture highlight_code -%}
function requestEndHandler(event) {};
document.addEventListener("liquid-ajax-cart:request-end", requestEndHandler);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

This is when your `requestEndHandler` function will be invoked:
1. A Shopify Cart API Ajax request is finished or [cancelled](/v2/docs/request-state/#infocancel);
2. The [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements update;
3. The [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) elements update;
4. The [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property update;
5. The [`data-ajax-cart-bind`](/v2/docs/data-ajax-cart-bind/) elements update;
6. The [`data-ajax-cart-property-input`](/v2/docs/data-ajax-cart-property-input/) input values update;
7. The [`data-ajax-cart-quantity-input`](/v2/docs/data-ajax-cart-quantity-input/) input values update;
8. The [`js-ajax-cart-empty`](/v2/docs/js-ajax-cart-empty/), [`js-ajax-cart-not-empty`](/v2/docs/js-ajax-cart-not-empty/) CSS classes update;
9. Invoking your `requestEndHandler` function.

## Structure

The event's `detail` property contains an object with the following properties:
* `requestState` — a [Request state](/v2/docs/request-state/) object;
* `cart` — cart state data or `undefined` if the request isn't successful;
* `previousCart` — previous cart state data or `undefined` if the request isn't successful;
* `sections` — array with updated [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request-end", function(event) {
  const {requestState, cart, previousCart, sections} = event.detail;

  // Print out all the available event data
  console.log({requestState, cart, previousCart, sections});
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### `cart`, `previousCart`

If a Shopify Cart API Ajax request is successful, Liquid Ajax Cart pulls the cart state data from the response, 
saves it, so you can access the cart state via the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property, 
and returns the same data in the event's `detail.cart` property. The event's `detail.previousCart` property
provides the cart state data that was kept in the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) property 
before the update.

If the request isn't successful, thus it doesn't have the cart state data, the event's `detail.cart` and `detail.previousCart` properties
will be `undefined`.

### `sections`

Liquid Ajax Cart re-renders the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements 
after each successful Shopify Cart API Ajax request.

The event's `detail.sections` property contains an array with all HTML elements re-rendered after the request.
If the request wasn't successful or the page doesn't have the [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements,
then the `detail.sections` property will contain an empty array.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request-end", function(event) {
  const {sections} = event.detail;
  
  // Print out re-rendered sections
  console.log(sections);
  });
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Result:
{%- capture highlight_code -%}
[
  {
    "id": "my-ajax-cart",
    "elements": [ Element {}, Element {} ]
  }
]
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}

* `id` — Shopify section's ID;
* `elements` — an array of the re-rendered [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements.