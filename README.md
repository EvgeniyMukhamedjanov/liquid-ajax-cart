# Liquid Ajax Cart
Liquid Ajax Cart is a Javascript library for Shopify that lets you build ajax-cart functionality using plain liquid templates.
##### 1. Create a new section for Ajax Cart:

```liquid
{% comment %}
  /sections/ajax-cart.liquid

  Add a wrapper with a [data-ajax-cart-section] attribute 
  so that Liquid Ajax Cart knows that the section should be rerendered
  after user's cart state is changed.
{% endcomment %}

<div data-ajax-cart-section>
  <div>
    <h2>Section "ajax-cart"</h2>
    <p>The section gets updated after each action because it has a content wrapper with [data-ajax-cart-section] attribute. Liquid Ajax Cart asks Shopify to render new HTML for [data-ajax-cart-section] sections with each API request.</p>
  </div>

  <div>
    {% for item in cart.items %}
      <div>

        <p>
          <a class="h3" href="{{ item.url }}">{{ item.product.title }}</a>

          {% unless item.product.has_only_default_variant %}
            <br />
            <small>{{ item.variant.title }}</small>
          {% endunless %}

          <br />
          <small> Price: 
          {% if item.original_price != item.final_price %}
            <del>{{ item.original_price | money }}</del>
            <span>{{ item.original_price | money }}</span>
          {% else %}
              <span>{{ item.original_price | money }}</span>
            {% endif %}
          </small>
        </p>

        <div>
          Quantity: 
          <button class="ajax-cart-demo__qty-btn" data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | minus: 1 }}"><i>-</i></button>
          {{ item.quantity }}
          <button data-ajax-cart-quantity-button="{{ item.key }} | {{ item.quantity | plus: 1 }}"><i>+</i></button>
        </div>

        <div>
          Total: <strong>{{ item.final_line_price | money }}</strong>
        </div>

        <div><a href="javascript:;" data-ajax-cart-quantity-button="{{ item.key }} | 0"><small>Remove</small></a></div>
      </div>
    {% endfor %}
  </div>

  <div>
    <a href="#checkout-route">Checkout — {{ cart.total_price | money_with_currency }}</a>
  </div>
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
Done.
