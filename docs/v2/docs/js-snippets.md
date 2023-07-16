---
title: Ready snippets
layout: docs-v2
---

# Ready snippets

## Open the Ajax-cart when a user adds a product to the cart

Usually the Ajax-cart isn't visible and opens when a user clicks on the cart icon in the header.
The click on the icon triggers a special CSS class to be added that makes the Ajax-cart show up.
The simplified code looks like this:

{%- capture highlight_code -%}
// Add a special CSS class on the cart-icon click 
document.querySelector("#cart-icon").addEventListener("click", function(){
  document.body.classList.toggle("js-show-ajax-cart");
});
{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}

{%- capture highlight_code -%}
// The Ajax-cart is hidden by default
.my-ajax-cart {
  display: none;
}

// The Ajax-cart is visible if a special class is added
body.js-show-ajax-cart .my-ajax-cart {
  display: block;
}
{%- endcapture -%}
{% include v2/codeblock.html title="assets/style.css" language="css" code=highlight_code %}

Our goal is to add the same CSS class to the `body` tag when a new product has been just added to the cart:
{%- capture highlight_code -%}
// Listen to the "liquid-ajax-cart:request" event that is fired 
// a moment before a Shopify Cart API Ajax request is performed
document.addEventListener('liquid-ajax-cart:request', event => {
  const {requestState, onResult} = event.detail;

  // Make sure that the request is for adding a product to the cart
  // using the "Request state" object
  if (requestState.requestType === 'add') {

    // Define a callback that will be called when the request is finished 
    // using the "onResult" function
    onResult(function(requestState) {

      // Check if the request was successful
      // using the "Request state" object
      if (requestState.responseData?.ok) {
        // Add the CSS class to the "body" tag
        document.body.classList.add('js-show-ajax-cart');
      }
    });
  }
});
{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}

## Add a gift to the cart if the total price is $100 or higher

Let's say you have a product with a default variant ID `40934235668668` 
and you use a Shopify automatic discount to make it free when the total price of all products in the cart is $100 or higher.

The goal is to add the product to the cart automatically if the total price is $100 or higher.

{%- capture highlight_code -%}
// line item property to distinguish the line item that was added by the script
const AUTOADDED_PROP = '_autoadded'; 

// Listen to the "liquid-ajax-cart:state" event that is fired
// when the Cart state is changed
document.addEventListener('liquid-ajax-cart:state', event => {
  const state = event.detail.state; // current cart state
  const promoVariant = 40934235668668; // gift variant id
  const promoThreshold = 10000; // $100, the gift should be added, when reached 

    // check if Liquid Ajax Cart is loaded 
    // and there is no Shopify Cart API Ajax request in progress
    if (state.status.cartStateSet && !state.status.requestInProgress) {

      let currentSubtotal = state.cart.items_subtotal_price;

      // Find out if there is the automaticaly added gift in the cart
      const autoAddedLineItem = state.cart.items.findIndex(lineItem => {
        return (AUTOADDED_PROP in lineItem.properties);
      });

      // If there is the automaticaly added gift item that is not free —
      // substract its price from currentSubtotal
      // The item might not be free if the cart total became less than $100
      if (autoAddedLineItem > -1) {
        currentSubtotal -= state.cart.items[autoAddedLineItem].final_line_price;
      }

      // If the cart total is equal or more than $100
      if (currentSubtotal >= promoThreshold) {

        // Try to find a promoVariant product with an applied discount
        const promoVariantLineItem = state.cart.items.findIndex(lineItem => {
          return lineItem.variant_id === promoVariant && lineItem.discounts.length > 0;
        });

        // If there is no a promoVariant product with an applied discount
        // lets add one with the AUTOADDED_PROP property
        if (promoVariantLineItem === -1) {
          liquidAjaxCart.add({
            items: [{
              id: promoVariant,
              quantity: 1,
              properties: {AUTOADDED_PROP: "Yes"}
            }]
          });
        }
      } else {

        // If current cart subtotal is less than $100
        // and the automatically added product is still in the cart —
        // lets remove it
        if (autoAddedLineItem > -1) {
          liquidAjaxCart.change({
            "line": autoAddedLineItem + 1,
            "quantity": 0
          });
        }
      }
    }
});
{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}