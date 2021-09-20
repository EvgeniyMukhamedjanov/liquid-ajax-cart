# Liquid Ajax Cart
Liquid Ajax Cart is a Javascript library for Shopify that lets you build ajax-cart functionality using plain liquid templates.
##### 1. Create a liquid section for Ajax Cart with a `data-ajax-cart-section` container:

```liquid
{% comment %} sections/ajax-cart.liquid {% endcomment %}

<div data-ajax-cart-section>
  <h2>Cart</h2>
  
  <div>
    {% for item in cart.items %}
      <div>
      	<p>
      	  <a class="h3" href="{{ item.url }}">{{ item.product.title }}</a> <br/>
          {% unless item.product.has_only_default_variant %}
            <small>{{ item.variant.title }}</small> <br/>
          {% endunless %}
          <small> Price: {{ item.final_price | money }} </small>
        </p>

        <div>
          <span>Quantity: </span>
          <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | minus: 1 }}"><i>-</i></button>
          {{ item.quantity }}
          <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | plus: 1 }}"><i>+</i></button>
        </div>

        <div> Total: <strong>{{ item.final_line_price | money }}</strong> </div>
        <div><a href="javascript:;" data-ajax-cart-quantity-button="{{ item.key }} | 0"><small>Remove</small></a></div>
      </div>
    {% endfor %}
  </div>
  <div> <a href="#checkout-route">Checkout — {{ cart.total_price | money_with_currency }}</a> </div>
</div>

{% schema %}
{
  "name": "Ajax Cart"
}
{% endschema %}
```

##### 2. Include the section and liquid-ajax-cart.js in your theme.liquid
```liquid
{% section 'ajax-cart' %}

<script type="module">
  import '{{ 'liquid-ajax-cart.js' | asset_url }}';
</script>
```
 
##### 3. Specify a place for product forms error messages
```liquid
{% form 'product', product %}
  
  <!-- product form's code ... -->
  
  <div data-ajax-cart-form-error></div>
  
  <!-- ... product form's code -->
  
{% endform %}
```
That's it.

