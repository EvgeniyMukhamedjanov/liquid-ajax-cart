# cartRequestGet() 

Performs a request to the Shopify Cart API `GET /cart.js` endpoint.

Takes the options object as the first parameter.

```html
<script type="module">
  import { cartRequestGet } from {% include code/last-release-file-name.html asset_url=true %}

  {% include code/request-options-object.html %}

  cartRequestGet( options );
</script>
```

{% include code/request-options-text.html %}