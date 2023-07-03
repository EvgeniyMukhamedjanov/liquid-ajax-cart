---
title: liquidAjaxCart.update() 
layout: docs-v2
disable_anchors: true
---

# liquidAjaxCart.update()

<p class="lead" markdown="1">
The method performs an Ajax request to the Shopify Cart API `POST /cart/update.js` endpoint.
</p>

The method takes a request body object as the first parameter, request options object as the second parameter.

The request body object will be passed to the Shopify Cart API endpoint,
so read what Shopify expects in the [`/cart/update.js`](https://shopify.dev/docs/api/ajax/reference/cart#post-locale-cart-update-js) documentation.

{%- capture highlight_code -%}

// Request body data you want to send to Shopify
const body = {
  updates: [3, 2, 1]
}

{% include v2/content/request-options-object.html %}

liquidAjaxCart.update(body, options);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

{% include v2/content/request-options-text.html %}
