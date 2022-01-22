# productFormsFilter

Liquid Ajax Cart ajaxifies all product forms by default.

But, for example, if you want to ajaxify only product forms with the `data-my-product-form` attribute then provide a function as the `productFormsFilter` parameter:
{% raw %}
```html
<script type="module">
  import { configureCart } from {% endraw %}{% include code/last-release-file-name.html asset_url=true %}{% raw %};

  configureCart('productFormsFilter', formNode => { 
    return formNode.hasAttribute('data-my-product-form') 
  });
</script>
```
{% endraw %}

Liquid Ajax Cart will call your function and pass the the product form that is going to add a product to the cart, and proceed with an "Add to cart" Ajax request only if the function returns `true`.