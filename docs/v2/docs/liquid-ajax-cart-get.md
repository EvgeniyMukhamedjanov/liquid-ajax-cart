---
title: liquidAjaxCart.get() 
layout: docs-v2
disable_anchors: true
---

# liquidAjaxCart.get()

<p class="lead" markdown="1">
The method performs an Ajax request to the Shopify Cart API `GET /cart.js` endpoint.
</p>

The method takes request options object as the first parameter:

{%- capture highlight_code -%}
{% include v2/content/request-options-object.html %}

liquidAjaxCart.get(options);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

{% include v2/content/request-options-text.html %}
