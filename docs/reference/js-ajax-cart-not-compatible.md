# .js-ajax-cart-not-compatible

Liquid Ajax Cart adds the `js-ajax-cart-not-compatible` CSS class to the `body` tag if the current browser doesn't support all the features needed for Liquid Ajax Cart.

To run Liquid Ajax Cart a browser must support `fetch`, `Promise`, `FormData`, `WeakMap`, `DOMParser`, template strings, destructuring assignment.

The function that checks browser compatibility is called `isCompatible` and it is located in the [index.ts](https://github.com/EvgeniyMukhamedjanov/liquid-ajax-cart/blob/main/_src/index.ts) file.