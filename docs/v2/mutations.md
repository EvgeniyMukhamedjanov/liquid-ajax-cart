---
title: mutations
layout: docs-v2
---

# mutations

<p class="lead" markdown="1">
A configuration parameter which lets you define [cart mutation functions](/v2/cart-mutations/).
</p>

## Define mutations

Use the [`conf`](/v2/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object to define functions:

{%- capture highlight_code -%}
function myMutation1 () {
  // ... mutation code ...
}

function myMutation2 () {
  // ... mutation code ...
}

window.liquidAjaxCart.conf('mutations', [
  myMutation1,
  myMutation2
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Liquid Ajax Cart will call these function when a page is just loaded 
and each time after a user changes their cart.

## Returning object structure

Each function is expected to return either nothing (if nothing should be changed in the cart) 
or an object with the information on what Shopify Cart API Ajax requests should be performed:

{%- capture highlight_code -%}
function myMutation () {
  // ... mutation code ...

  return {
    requests: [
      {
        type: "change", // remove the first item from the cart
        body: {
          line: 1,
          quantity: 0
        }
      },
      {
        type: "add", // add the product with "40934235668668" variant id 
        body: {
          items: [{
            id: 40934235668668,
            quantity: 1,
          }]
        }
      }
    ]
  };
}
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### `requests`
An array of objects each of which contains information on one Shopify Cart API Ajax request that should be performed.

### `type`
Each `requests` array's object must have the `type` property. 
The available types are `add`, `get`, `update`, `change`, `clear`, 
according to [Shopify Cart API endpoints](https://shopify.dev/docs/api/ajax/reference/cart).

### `body`
The `body` object will be passed to the Shopify Cart API endpoint as is, 
so read what data Shopify expects in the [Shopify Cart API endpoints](https://shopify.dev/docs/api/ajax/reference/cart) documentation.

## Examples

Find detailed explanation with examples of how to create mutation functions
in the "[Auto-add/remove cart items](/v2/cart-mutations/)" guide.
