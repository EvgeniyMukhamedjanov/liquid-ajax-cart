# subscribeToCartSectionsUpdate

<p style="text-align: right;"><small><a href="https://github.com/kaboomdev/">@Kobi</a>, especially for you.</small></p>

The `subscribeToCartSectionsUpdate` function adds your callback function to the list of functions that will be called each time after [`data-ajax-cart-section`](/reference/data-ajax-cart-section/) sections HTML is updated. 

The callback should be passed as the only parameter.

```javascript
subscribeToCartSectionsUpdate( myCallback );
```

```html
<script type="module">
  import { subscribeToCartSectionsUpdate } from {% include code/last-release-file-name.html asset_url=true %}

  subscribeToCartSectionsUpdate( sections => {
    console.log('Sections are updated: ', sections);
  });
</script>
```

Your callback will be called with an array of updated sections:

```json
[
  {
    "id": "my-cart",
    "elements": [ Element {} ]
  },
  {
    "id": "my-mini-cart",
    "elements": [ Element {}, Element {} ]
  }
]
```

* `id` — Shopify section's name.
* `elements` — an array of new `data-ajax-cart-section` HTML elements that replaced old ones. If the Shopify section is updated completely due to an error then the only item of the `elements` array will be the Shopify section's HTML element.