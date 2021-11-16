# productFormsFilter

The `productFormsFilter` configuration parameter lets you set the function that will "answer the question" if a product form should be ajaxified or not.

By default the function looks like this:
```javascript
formNode => true
```

The function is called on product form `submit` event with the form's node as the only parameter. If the function returns `true` Liquid Ajax Cart intercepts the submission and sends a Cart Ajax API request using the [`cartRequestAdd`](/reference/cartRequestAdd/) function instead of page reloading.

By default the function always returns `true` thus all the product forms will be ajaxified.

If you want to ajaxify only product forms with the `data-my-product-form` attribute, for example, then you can provide your own `productFormsFilter` function:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('productFormsFilter', formNode => formNode.hasAttribute('data-my-product-form'));
</script>
```
{% endraw %}