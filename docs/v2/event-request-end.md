---
title: liquid-ajax-cart:request-end
layout: docs-v2
---

# liquid-ajax-cart:request-end

<p class="lead" markdown="1">
An event which is fired at the `document` when Liquid Ajax Cart completes a Shopify Cart API Ajax request.
</p>

## How it works
When a Shopify Cart API Ajax request is executed or [cancelled](/v2/request-state/#infocancel),
Liquid Ajax Cart updates the cart state in the [`liquidAjaxCart.cart`](/v2/liquid-ajax-cart-cart/) property,
updates the [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) elements and all the cart related content,
and then triggers the `liquid-ajax-cart:request-end` event.

{% include v2/content/lifecycle-events-reference.html %}

## Use cases

{% include v2/content/request-end-use-cases.html %}



## Structure

The event's `detail` property contains an object with the following properties:

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:request-end", function(event) {
  const {requestState, cart, previousCart, sections} = event.detail;

  // Print out all the available event data
  console.log({requestState, cart, previousCart, sections});
});
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### `requestState`

A [Request state](/v2/request-state/) object, related to the request.

### `cart`, `previousCart`

If a Shopify Cart API Ajax request is successful, Liquid Ajax Cart retrieves the cart state data from the response, 
saves it in the [`liquidAjaxCart.cart`](/v2/liquid-ajax-cart-cart/) property, 
and returns the saved cart state data in the `detail.cart` property of the event. 
The `detail.previousCart` property of the event
provides the cart state data that was kept in the [`liquidAjaxCart.cart`](/v2/liquid-ajax-cart-cart/) property 
before the update.

If the request isn't successful, thus it doesn't have the cart state data, the properties `detail.cart` and `detail.previousCart` of the event
are `undefined`.

### `sections`

Liquid Ajax Cart re-renders the [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) elements 
after each successful Shopify Cart API Ajax request.

The event's `detail.sections` property contains an array with all HTML elements re-rendered after the request.
If the request isn't successful or the page doesn't have the [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) elements,
then the `detail.sections` property contains an empty array.

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
* `elements` — an array of the re-rendered [`data-ajax-cart-section`](/v2/data-ajax-cart-section/) elements.