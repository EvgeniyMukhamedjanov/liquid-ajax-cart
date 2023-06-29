---
title: liquid-ajax-cart:sections event
layout: docs-v2
disable_anchors: true
---

# liquid-ajax-cart:sections event

<p class="lead" markdown="1">
The `liquid-ajax-cart:sections` event is fired at the `document` when `data-ajax-cart-section` sections HTML is updated.
</p>

The event's `detail` property contains an array with updated sections.

{% include v2/content/sections-event-code-example.html %}

The array of updated sections:

{%- capture highlight_code -%}
[
  {
    "id": "my-cart",
    "elements": [ Element {} ]
  },
  {
    "id": "my-mini-cart",
    "elements": [ Element {}, Element {} ]
  }
]
{%- endcapture -%}
{% include v2/codeblock.html language="json" code=highlight_code %}

* `id` — Shopify section's name.
* `elements` — an array of updated `data-ajax-cart-section` HTML elements. If the Shopify section is updated completely due to an error then the only item of the `elements` array will be the Shopify section HTML element.