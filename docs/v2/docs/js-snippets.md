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
// Add a special CSS class when the cart-icon is clicked 
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
// Listen to the "liquid-ajax-cart:request-end" event which is fired 
// after a Shopify Cart API Ajax request is performed
document.addEventListener('liquid-ajax-cart:request-end', event => {
  const {requestState} = event.detail;

  // If the "add to cart" request is successful 
  if (requestState.requestType === 'add' && requestState.responseData?.ok) {

    // Add the CSS class to the "body" tag
    document.body.classList.add('js-show-ajax-cart');
  }
});
{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}

## Add a gift to the cart if the total price is $100 or higher

Let's say you have a product with a default variant ID `40934235668668` 
and you use a Shopify automatic discount to make it free when the total price of all products in the cart is $100 or higher.

The goal is to add the product to the cart automatically if the cart total is $100 or higher.
But if the user has already added the product before, not to add it again.

If the cart total is lower than $100,
then the automatically added product should be removed from the cart.
But if the product was added manually by the user, then it should stay.

{%- capture highlight_code -%}
// line item property to distinguish the line item
// that was automatically added by the script
const AUTOADDED_PROP = '_autoadded';

// subscribeToCartStateUpdate( state => {
document.addEventListener('liquid-ajax-cart:queue-end', event => {
  // The current cart state
  const cart = liquidAjaxCart.cart;

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
    return lineItem.properties?.[AUTOADDED_PROP] === 'Yes';
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
      liquidAjaxCart.add({
        items: [{
          id: variant,
          quantity: 1,
          properties: {[AUTOADDED_PROP]: "Yes"}
        }]
      });
    }
  } else {

    // If the total price is lower than the threshold,
    // and the cart contains the automatically added promo-product —
    // remove the promo-product from there.
    // If the promo-product was added manually by the user —
    // it won't be removed.
    if (autoAddedLineItem > -1) {
      liquidAjaxCart.change({
        "line": autoAddedLineItem + 1,
        "quantity": 0
      });
    }
  }
});
{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}