# .js-ajax-cart-request-in-progress

Liquid Ajax Cart adds the `js-ajax-cart-request-in-progress` CSS class to the `body` if there are one or more Ajax Cart API requests in progress.

[`Controls`](/reference/controls) become inactive when Liquid Ajax Cart is sending an Ajax request so you can show a loading indicator or make the controls visually disabled using the `js-ajax-cart-request-in-progress` CSS class.

Under the hood Liquid Ajax Cart checks the `status.requestInProgress` property of the [`State`](/reference/state) object and adds the CSS class if the `status.requestInProgress` value is `true` and removes the CSS class if the value is `false`.