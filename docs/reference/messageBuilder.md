# messageBuilder

The `messageBuilder` configuration parameter lets you change the HTML layout of the messages that are put in [`data-ajax-cart-messages`](/reference/data-ajax-cart-messages/) containers.

By default the messages are built using the following function:
```javascript
messages => {
  let result = '';
  messages.forEach( element => {
    result += `<div class="js-ajax-cart-message js-ajax-cart-message--${ element.type }">${ element.text }</div>`;
  })
  return result;
}
```

You can pass your own function using the `messageBuilder` configuration parameter. For example lets use an unordered list for messages and change CSS classes:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('messageBuilder', messages => {
    let result = '<ul>';
    messages.forEach( element => {
      result += `<li class="my-message my-message--${ element.type }">${ element.text }</li>`;
    })
    result += '</ul>'
    return result;
  })
</script>
```
{% endraw %}

The function will be called with the only parameter `messages` — an array with the all the messages that are going to be displayed. Each message is a Javascript object that contains the following properties:
```json
{
  "type": "error",
  "text": "All 3 T-shirt are in your cart.",
  "code": "shopify_error",
  "requestState": {…}
}
```
* `type` — is always `error` for now. It is planned to add more message types in future releases.
* `code`:
  * `shopify_error` — if Shopify responded with an error message to a [Cart Ajax API request](/reference/requests/). For example if a user tried to use a product form to add to cart more products than available, Shopify will respond with an error message.
  * `request_error` — if a [Cart Ajax API request](/reference/requests/) is not successful and doesn't have any error description, or if the request is not performed at all due to internet connection, for example.
* `requestState` — the [Request State](/reference/requestState/) object with information about the request.