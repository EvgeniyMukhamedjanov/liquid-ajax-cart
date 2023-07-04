---
title: liquid-ajax-cart:sections
layout: docs-v2
disable_toc: true
---

# liquid-ajax-cart:sections

<p class="lead" markdown="1">
The `liquid-ajax-cart:sections` event is fired at the `document` when 
[`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements are re-rendered.
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

* `id` — a handle of a Shopify section, that contains [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements, which were re-rendered.
* `elements` — an array of re-rendered [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) elements. If the Shopify section is re-rendered completely due to an error, then the only item of the `elements` array will be the Shopify section HTML element.