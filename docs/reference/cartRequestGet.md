# cartRequestGet() 

Performs a request to the Shopify Cart API `GET /cart.js` endpoint

```html
<script type="module">
  import { cartRequestGet } from {% include code/last-release-file-name.html asset_url=true %}

  const options = {
    firstComplete: ( requestState ) => {
      // The first callback that will be called after the request is finished:
      // state object is not updated yet,
      // sections are not updated yet,
      // everything is not updated yet.
    },
    lastComplete: ( requestState ) => {
      // The last callback that will be called after the request is finished:
      // state is updated,
      // sections are updated,
      // everything is updated.
    }
  }

  cartRequestGet( options );
</script>
```

### Options

The `options` parameter is an object and it might have the following properties:

##### firstComplete

The `firstComplete` parameter is a function that will be called right after the request is finished and before any other callbacks that are subscribed to the request. 

This function is called before updating of the [State](/reference/state/) object, the `data-ajax-cart-section` sections, the `body` CSS classes, the `data-ajax-cart-bind-state` elements.

##### lastComplete

The `lastComplete` parameter is a function that will be called after the request is finished and after any other callbacks that are subscribed to the request. 

You can use the [`getCartState`](/reference/getCartState/) function to read the [`State`](/reference/state/) object because it is already updated.

Also the `data-ajax-cart-section` sections, the `body` CSS classes, the `data-ajax-cart-bind-state` are updated when the function is called.