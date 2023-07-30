---
title: liquidAjaxCart.add() 
layout: docs-v2
disable_anchors: true
---

# liquidAjaxCart.add()

<p class="lead" markdown="1">
The method performs an Ajax request to the Shopify Cart API `POST /cart/add.js` endpoint.
</p>

The method takes a request body object as the first parameter, request options object as the second parameter.

The request body object will be passed to the Shopify Cart API endpoint,
so read what Shopify expects in the [`/cart/add.js`](https://shopify.dev/docs/api/ajax/reference/cart#post-locale-cart-add-js) documentation.

{%- capture highlight_code -%}

// Request body data you want to send to Shopify
const body = {
  items: [
    {
      id: 40934235668668,
      quantity: 1
    }
  ]  
}

{% include v2/content/request-options-object.html %}

liquidAjaxCart.add(body, options);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

{% include v2/content/request-options-text.html %}
