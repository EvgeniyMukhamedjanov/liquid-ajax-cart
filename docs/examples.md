---
title: JavaScript examples
---

### Access to Liquid Ajax Cart JavaScript functions

The default manual Liquid Ajax Cart installation code looks like it is described in the [Guide](/guide/):

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}
 
<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
 
<script type="module">
  import {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};
</script>
```
{% endraw %}

If you want to use any function from Liquid Ajax Cart, you need to import it:

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}
 
<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
 
<script type="module">
  // import subscribeToCartAjaxRequests along with including Liquid Ajax Cart
  import { subscribeToCartAjaxRequests } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  // Using the imported function:
  subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {
    // Your code
  });
</script>
```
{% endraw %}

You can also call Liquid Ajax Cart functions outside the module using the global `liquidAjaxCart` object:

```javascript
// Check that Liquid Ajax Cart exists
if ( 'liquidAjaxCart' in window ) {

  // Call any function you need
  liquidAjaxCart.subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {
    // Your code
  });
}
```

---

### Show a pop-up message after adding to the cart

If just adding a CSS class to the `body` tag is enough for showing your pop-up — consider using the [`addToCartCssClass`](/reference/addToCartCssClass/) configuration parameter instead. 

But if you need to show information about products that have been just added to the cart then take a look at the following code:

```javascript
import { subscribeToCartAjaxRequests } from {% include code/last-release-file-name.html asset_url=true %};

// Define a callback for all the Cart Ajax API requests
// It will be called BEFORE each request is getting performed
subscribeToCartAjaxRequests(( requestState, subscribeToResult ) => {

  // If the request is 'Add to cart'
  if ( requestState.requestType === 'add' ) {
    
    // Define a callback that will be called after the request is finished
    subscribeToResult( requestState => {

      // If the request is successful 
      if ( requestState.responseData?.ok ) {

        // Find out the name of the product if only one product was added to the cart
        let productName = requestState.responseData.body.title;
        if ( requestState.responseData.body.items?.length === 1 ) {
          productName = requestState.responseData.body.items[0].title;
        }

        // Show a pop-up
        alert(`${ productName ? '«' + productName + '» is' : 'Products are' } successfully added`);
      }
    });
  }
});
```

---

### Add a product to the cart automatically if the total price is $100 or higher

Lets say you have a product with a default variant id `40934235668668`. And you use a Shopify automatic discount for it: if the total price of all products in the cart is $100 or higher then the product is free.

Thus you want to add the product to the cart automatically if the total price is $100 or higher.

```javascript
import { cartRequestAdd, cartRequestChange, subscribeToCartStateUpdate } from {% include code/last-release-file-name.html asset_url=true %};

// Define a callback that will be called each time when the cart state is updated
subscribeToCartStateUpdate( state => {

  const promoVariant = 40934235668668;  // product's variant ID
  const promoSubtotal = 10000;          // $100

  // If cart state exists and there is no Ajax Cart API request in progress
  if ( state.status.cartStateSet && !state.status.requestInProgress ) {

    let currentSubtotal = state.cart.items_subtotal_price;

    // Find out if there is a product that was automatically added before
    const autoAddedLineItem = state.cart.items.findIndex( lineItem => { 
      return lineItem.properties?._autoadded === 'Yes' ;
    });

    // If there is the automaticaly added product —
    // lets calculate the currentSubtotal without the product
    if ( autoAddedLineItem > -1 ) {
      currentSubtotal -= state.cart.items[autoAddedLineItem].final_line_price;
    }

    if ( currentSubtotal >= promoSubtotal ) {

      // Try to find a promoVariant product with an applied discount
      const promoVariantLineItem = state.cart.items.findIndex( lineItem => { 
        return lineItem.variant_id === promoVariant && lineItem.discounts.length > 0;
      });

      // If there is no a promoVariant product with an applied discount
      // lets add one with _autoadded property
      if ( promoVariantLineItem === -1 ) {
        cartRequestAdd({ 
          items: [{
              id: promoVariant,
              quantity: 1,
              properties: { "_autoadded": "Yes" }
          }]  
        });
      }
    } else {

      // If current cart subtotal is less than $100
      // and an autoadded product is still in the cart —
      // lets remove it
      if ( autoAddedLineItem > -1 ) {
        cartRequestChange({ 
          "line": autoAddedLineItem + 1,
          "quantity": 0
        });
      }
    }
  }
});
```