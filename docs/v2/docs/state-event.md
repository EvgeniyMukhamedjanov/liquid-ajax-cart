---
title: liquid-ajax-cart:state
layout: docs-v2
disable_anchors: true
---

# liquid-ajax-cart:state

<p class="lead" markdown="1">
The event is fired at the `document` when the [Cart state](/v2/docs/cart-state/) is changed.
</p>

The event's `detail` property contains an object with two properties:
* `state` — the [Cart state](/v2/docs/cart-state/) object;
* `isCartUpdated` — a boolean value that indicates whether the [Cart state](/v2/docs/cart-state/)'s `cart` object has changed.

{%- capture highlight_code -%}
document.addEventListener("liquid-ajax-cart:state", function(event) {
  const {state, isCartUpdated} = event.detail;

  console.log('State is updated: ', state);
  console.log('state.cart is changed: ', isCartUpdated);
})
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}