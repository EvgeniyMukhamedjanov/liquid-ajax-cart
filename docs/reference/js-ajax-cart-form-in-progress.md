# .js-ajax-cart-form-in-progress

When a user submits a Shopify product form, Liquid Ajax Cart intercepts the submission and sends an Ajax "Add to Cart" request. The form remains inactive when the request is in progress to prevent accidental double submissions.

Liquid Ajax Cart adds the `js-ajax-cart-form-in-progress` CSS class to the form if the request is in progress so you can show a loading indicator or make the submit button visually disabled.

{% include code/js-ajax-cart-form-in-progress.html %}