---
title: liquidAjaxCart.update() 
layout: docs-v2
---

# liquidAjaxCart.update()

<p class="lead" markdown="1">
A method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object, 
which initiates an Ajax request to the Shopify Cart API `POST /cart/update.js` endpoint.
</p>

## Structure

The method takes a request body object as the first parameter, and an object with the request options as the second parameter.

The request body object is passed to the Shopify Cart API endpoint as is,
so read what data Shopify expects in the [`/cart/update.js`](https://shopify.dev/docs/api/ajax/reference/cart#post-locale-cart-update-js) documentation.

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
