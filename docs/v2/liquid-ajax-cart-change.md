---
title: liquidAjaxCart.change() 
layout: docs-v2
---

# liquidAjaxCart.change()

<p class="lead" markdown="1">
A method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object, 
which initiates an Ajax request to the Shopify Cart API `POST /cart/change.js` endpoint.
</p>

## Structure

The method takes a request body object as the first parameter, and an object with the request options as the second parameter.

The request body object is passed to the Shopify Cart API endpoint as is,
so read what data Shopify expects in the [`/cart/change.js`](https://shopify.dev/docs/api/ajax/reference/cart#post-locale-cart-change-js) documentation.

{%- capture highlight_code -%}

// Request body data you want to send to Shopify
const body = {
  id: '40934235668668:719bc4cb60310cbc4dee2ae38d8bf04c',
  quantity: 0
}

{% include v2/content/request-options-object.html %}

liquidAjaxCart.change(body, options);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

{% include v2/content/request-options-text.html %}
