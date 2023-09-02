---
title: liquidAjaxCart.get() 
layout: docs-v2
---

# liquidAjaxCart.get()

<p class="lead" markdown="1">
A method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object, 
which initiates an Ajax request to the Shopify Cart API `GET /cart.js` endpoint.
</p>

## Structure

The method takes an object with the request options as the first parameter:

{%- capture highlight_code -%}
{% include v2/content/request-options-object.html %}

liquidAjaxCart.get(options);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

{% include v2/content/request-options-text.html %}
