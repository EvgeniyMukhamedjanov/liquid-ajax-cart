---
title: Cart mutations
layout: docs-v2
---

# Cart mutations

<p class="lead" markdown="1">
Liquid Ajax Cart lets you set up **cart mutations** that will automatically add or remove cart items based on specific conditions.
</p>

<p class="lead" markdown="1">
Use it for promotions and cart corrections: add a free gift to the cart when the cart total reaches the $100 threshold,
remove the product B when the product A is not in the cart, etc.
</p>

## What is a mutation

A mutation is a JavaScript function defined by you, that checks the current cart state (what the cart total is, what items are in the cart, etc.), and if certain items should be added/removed, it tells Liquid Ajax Cart what Shopify Cart API Ajax requests should be performed in order to add/remove these items.

If a mutation is defined, Liquid Ajax Cart will call this function when a page is just loaded 
and each time after a user changes their cart.

## Set up a mutation

Let's say, you have a promotion where you offer a free mug with every order.
Thus, if a user puts something in the cart you want to add the mug product to the cart automatically.

### Define a mutation function

In order to implement this you should define a function that will check the condition (user's cart isn't empty)
and initiate the action (add the mug product to the cart if it is not there).

In order to let Liquid Ajax Cart know about the function, use the [`mutations`](/v2/mutations/) configuration parameter.
It accepts array of such functions. In our case we have only one function, 
so the array will contain only one element:

{%- capture highlight_code -%}
function myMutation() {
  // todo: check condition, initiate cart update 
}

// Let Liquid Ajax Cart know about the mutation functions
window.liquidAjaxCart.conf('mutations', [
  myMutation
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Now Liquid Ajax Cart will call your `myMutation` function when a page is loaded and when a user changes their cart
so that you can check a new state of the cart (if it is empty or not in our case) and initiate an action.

### Check conditions

In order to check the state of the cart use the [`cart`](/v2/liquid-ajax-cart-cart/) property 
of the global [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object. It contains the data about the current cart state
in the JSON format. Let's check if the cart is not empty and doesn't have the Mug product added: 

{%- capture highlight_code -%}
function myMutation() {
  // The variant ID (not product ID!) of the Mug product
  const mugVariantId = 40934235668668;

  // The current cart state JSON from the liquidAjaxCart.cart property
  const cart = window.liquidAjaxCart.cart;

  // If the cart is empty -- do nothing, stop the function
  if (cart.item_count === 0) {
    return;
  }

  // If the cart is not empty, let's find out if the Mug product is in the cart
  const mugLineItem = cart.items.find(item => {
    return item.variant_id === mugVariantId;
  });

  // If the Mug product in the cart -- do nothing, stop the function
  if (mugLineItem) {
    return;
  }

  // if you reach this point, the cart isn't empty and there is no mug in it
  // Todo: initiate adding the Mug product to the cart
}

// Let Liquid Ajax Cart know about the mutation functions
window.liquidAjaxCart.conf('mutations', [
  myMutation
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code highlight_lines="2-24" %}

### Initiate cart requests

In order to initiate the cart update, your function should return an object with the `requests` property 
that should be an array of objects with information 
on what Shopify Cart API Ajax request you want to perform. 

Each "request"-object must have the `type` property. 
The available types are `add`, `get`, `update`, `change`, `clear`, 
according to [Shopify Cart API endpoints](https://shopify.dev/docs/api/ajax/reference/cart).

The second property is the `body` property.
The `body` object will be passed to the Shopify Cart API endpoint as is, 
so read what data Shopify expects in the [Shopify Cart API endpoints](https://shopify.dev/docs/api/ajax/reference/cart) documentation.

In our case we want to perform one Shopify Cart API `/cart/add.js` POST request,
so the `requests` property should be an array with one "request"-object that has the `type` property equal to `add` 
and the corresponding `body` value:

{%- capture highlight_code -%}
function myMutation() {
  // The variant ID (not product ID!) of the Mug product
  const mugVariantId = 40934235668668;
  
  // The current cart state JSON from the liquidAjaxCart.cart property
  const cart = window.liquidAjaxCart.cart;
  
  // If the cart is empty -- do nothing, stop the function
    if (cart.item_count === 0) {
  return;
  }
  
  // If the cart is not empty, let's find out if the Mug product is in the cart
  const mugLineItem = cart.items.find(item => {
    return item.variant_id === mugVariantId;
  });
  
  // If the Mug product in the cart -- do nothing, stop the function
  if (mugLineItem) {
    return;
  }
  
  // if you reach this point, the cart isn't empty and there is no mug in it
  // Initiate adding the Mug product to the cart:
  return {
    requests: [
      {
        type: "add",
        body: {
          items: [{
            id: mugVariantId,
            quantity: 1,
          }]
        }
      }
    ]
  };
}

// Let Liquid Ajax Cart know about the mutation functions
window.liquidAjaxCart.conf('mutations', [
  myMutation
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code highlight_lines="25-37" %}

Now if a user has anything in their cart, the Mug product will be in the cart as well.

## Multiple requests in a mutation

If a mutation returns the `requests` array that contains multiple "request"-objects, the requests will be performed in order:

{%- capture highlight_code -%}
function myMutation() {
  
  // ... mutation code ...

  // Initiate two requests: the "change" first, the "add" second:
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

## Multiple mutations

If you have two or more mutation functions for promotions or cart corrections, you should pass them all 
when settings the [`mutations`](/v2/mutations/) configuration parameter.

The functions will be called in the same order:

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

## Mutation function examples 

### Always add the product to the cart if the cart is not empty

It is the same example as in the "[Set up a mutation](#set-up-a-mutation)" section. 
Let's say, you have a promotion where you offer a free product with every order.
Thus, when a user put something in the cart you want to add the free product to the cart automatically.

{%- capture highlight_code -%}
function myMutation() {
  // The variant ID (not product ID!) of the product
  const variantId = 40934235668668;

  // The current cart state JSON from the liquidAjaxCart.cart property
  const cart = window.liquidAjaxCart.cart;

  // If the cart is empty -- do nothing, stop the function
  if (cart.item_count === 0) {
    return;
  }

  // If the cart is not empty, let's find out if the product is in the cart
  const lineItem = cart.items.find(item => {
    return item.variant_id === variantId;
  });

  // If the product in the cart -- do nothing, stop the function
  if (lineItem) {
    return; 
  }

  // if you reach this point, the cart isn't empty and the product isn't there
  // Initiate adding the product to the cart:
  return {
    requests: [
      {
        type: "add",
        body: {
          items: [{
            id: variantId,
            quantity: 1,
          }]
        }
      }
    ]
  };
}

// Let Liquid Ajax Cart know about the mutation functions
window.liquidAjaxCart.conf('mutations', [
  myMutation
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### Allow no more than one product A in the cart 

Let's say you have a product A and you don't want a user to have more than one item in the cart.
The following mutation function will automatically remove them.

{%- capture highlight_code -%}
function myMutation() {
  // variant ID of the Shipping Protection product  
  const variantId = 43093947318460; 

  // cart line-items
  const items = window.liquidAjaxCart.cart.items;

  // find the line-items with the product
  const lineItems = items.filter(item => {
    return item.variant_id === variantId;
  });

  // if there is no product, or it is only one -- do nothing, stop the function
  if (lineItems.length === 0 || (lineItems.length === 1 && lineItems[0].quantity === 1)) {
    return;
  }

  // prepare the body for the /cart/update.js request
  const updates = {};

  // set the quantity of the first found line-item to 1,
  // set the quantity of the rest line-items to 0
  for (let i = 0; i < lineItems.length; i++) {
    updates[lineItems[i].key] = (i === 0 ? 1 : 0);
  }

  // initiate the update request
  return {
    requests: [
      {
        type: "update",
        body: {
          updates
        }
      }
    ]
  }
}

// Let Liquid Ajax Cart know about the mutation functions
window.liquidAjaxCart.conf('mutations', [
  myMutation
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

### Add a gift to the cart if the total price is $100 or higher

Let's say you have a product with a default variant ID `40934235668668`
and you use a Shopify automatic discount to make it free when the total price of all products in the cart is $100 or higher.

The goal is to add the product to the cart automatically if the cart total is $100 or higher.
But if the user has already added the product before, not to add it again.

If the cart total is lower than $100,
then the automatically added product should be removed from the cart.
But if the product was added manually by the user, then it should stay.

{%- capture highlight_code -%}
function myMutation() {
  // line item property to distinguish the line item
  // that was automatically added by the mutation
  const autoaddedProp = '_autoadded';

  // current cart state
  const cart = window.liquidAjaxCart.cart;

  // The variant ID of the promo-product, that should be automatically added
  const variant = 40934235668668;

  // The product should be added when the cart total is $100 or higher
  const threshold = 10000;

  // The variable to keep the cart total price
  // that will be compared with the threshold.
  let total = cart.items_subtotal_price;
  // If the promo-product is already automatically added to the cart,
  // and it is not free, we should subtract its price from the cart total
  // before comparing with the threshold
  // in order to understand if the promo-product has to be removed.
  const autoAddedLineItem = cart.items.findIndex(lineItem => {
    return lineItem.properties?.[autoaddedProp] === 'Yes';
  });
  if (autoAddedLineItem > -1) {
    total -= cart.items[autoAddedLineItem].final_line_price;
  }

  // Compare the cart total that doesn't include
  // the possibly automatically added product
  if (total >= threshold) {

    // If the total price is equal or higher than the threshold,
    // and the cart doesn't contain the promo-product —
    // add the promo-product automatically.
    const promoVariantLineItem = cart.items.findIndex(lineItem => {
      return lineItem.variant_id === variant && lineItem.discounts.length > 0;
    });
    if (promoVariantLineItem === -1) {
      return {
        requests: [
          {
            type: "add",
            body: {
              items: [{
                id: variant,
                quantity: 1,
                properties: {[autoaddedProp]: "Yes"}
              }]
            }
          }
        ]
      }
    }
  } else {

    // If the total price is lower than the threshold,
    // and the cart contains the automatically added promo-product —
    // remove the promo-product from there.
    // If the promo-product was added manually by the user —
    // it won't be removed.
    if (autoAddedLineItem > -1) {
      return {
        requests: [
          {
            type: "change",
            body: {
              "line": autoAddedLineItem + 1,
              "quantity": 0
            }
          }
        ]
      }
    }
  }
}

// Let Liquid Ajax Cart know about the mutation functions
window.liquidAjaxCart.conf('mutations', [
  myMutation
]);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}
