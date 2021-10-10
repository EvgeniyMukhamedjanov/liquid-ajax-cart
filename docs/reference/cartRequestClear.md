# cartRequestClear

Performs a request to the Shopify Cart API `POST /cart/clear.js` endpoint.

Takes the request's body as a first parameter, the options object as the second parameter.

```html
<script type="module">
  import { cartRequestClear } from {% include code/last-release-file-name.html asset_url=true %}

  {% include code/request-options-object %}
    
  cartRequestClear( {}, options );

</script>
```

{% include code/request-options-text %}