---
title: data-ajax-cart-request-button
layout: docs-v2
disable_anchors: true
---

# data-ajax-cart-request-button

<p class="lead" markdown="1">
The attribute turns the user clicks on the [`routes.cart_add_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_add_url), [`routes.cart_change_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_change_url), [`routes.cart_clear_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_clear_url), [`routes.cart_update_url`](https://shopify.dev/api/liquid/objects/routes#routes-cart_update_url) and [`line_item.url_to_remove`](https://shopify.dev/api/liquid/objects/line_item#line_item-url_to_remove) links into Shopify Cart API Ajax requests.
</p>

## How it works

Liquid Ajax Cart listens to the `click` event at the `data-ajax-cart-request-button` elements.
When the event is fired, Liquid Ajax Cart checks if the element's `href` attribute value is a valid 
`routes.cart_add_url`, `routes.cart_change_url`, `routes.cart_clear_url`, `routes.cart_update_url` or `line_item.url_to_remove` URL.
If the URL is valid, Liquid Ajax Cart turns the URL into a `FormData` object and sends it as a Shopify Cart API Ajax request.

## Use cases

The most popular use cases are "Remove cart item" and "Clear cart" buttons. 

It might be used for an "Add to cart" button, "Plus" and "Minus" cart item quantity buttons,
but it is recommended to use other approaches for these cases.

### "Remove cart item" button

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items">
    {% for item in cart.items %}
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      <a data-ajax-cart-request-button href="{{ item.url_to_remove }}">
        Remove
      </a>

      <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

### "Clear cart" button

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <a data-ajax-cart-request-button href="{{ routes.cart_clear_url }}">
    Clear cart
  </a>

  <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

### "Plus" and "Minus" cart item quantity buttons (not recommended)

Liquid Ajax Cart sends a Shopify Cart API Ajax immediately when a user clicks on a `data-ajax-cart-request-button`.
It might be a disadvantage in case of "Plus" and "Minus" buttons. 
For example if a user wants to increase a cart item quantity by three by clicking a "Plus" button three times,
Liquid Ajax Cart will make the first Shopify Cart API Ajax request right after the first click and switches to the "loading" state.
Thus, the user will have to wait for the previous request to be finished before making the next click.

To provide a better user experience, it is recommended to use the [`<ajax-cart-quantity>`](/v2/docs/ajax-cart-quantity/) custom tag 
for the "Plus" and "Minus" buttons. This custom tag waits for some time before sending a Shopify Cart API Ajax request,
letting a user click a button more than once without the "loading" state delay.

If you still want to use the `data-ajax-cart-request-button` for the case, this is how to do it:

{%- capture highlight_code -%}
{% raw %}
<div class="my-cart" data-ajax-cart-section>
  <h2>Cart</h2>

  <div class="my-cart__items" data-ajax-cart-section-scroll>
    {% for item in cart.items %}
      {% assign item_index = forloop.index %}
      <hr />  
      <div><a href="{{ item.url }}">{{ item.title }}</a></div>
      <div>Price: {{ item.final_price | money }}</div>

      <div>
        Quantity:
        <a data-ajax-cart-request-button
          href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | minus: 1 }}" > 
          Minus one 
        </a>

        <input data-ajax-cart-quantity-input="{{ item_index }}"
          name="updates[]" 
          value="{{ item.quantity }}" 
          type="number" 
          form="my-ajax-cart-form" />

        <a data-ajax-cart-request-button
          href="{{ routes.cart_change_url }}?line={{ item_index }}&quantity={{ item.quantity | plus: 1 }}"> 
          Plus one 
        </a>
      </div>
  
      <!-- ... -->
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="sections/my-ajax-cart.liquid" language="liquid" code=highlight_code %}

### "Add to cart" button (not recommended)

If you have an "Add to cart" link, you can ajaxify it by adding the `data-ajax-cart-request-button` to it.

But it is recommended to use the [Shopify product forms](https://shopify.dev/docs/themes/architecture/templates/product#the-product-form) 
to make "Add to cart" buttons and ajaxify them as explained in the "[Product forms](/v2/docs/product-forms/)" guide article. 
There are a few advantages when using ajaxified product form rather than links:
1. The [`<ajax-cart-product-form>`](/v2/docs/ajax-cart-product-form/) custom tag, that is intended to ajaxify product forms, has the `loading` attribute. This lets you show a dedicated loading indicator for the "Add to cart" button using CSS only.
2. You can use the [`data-ajax-cart-errors`](/v2/docs/data-ajax-cart-errors/) attribute within the ajaxified product forms to show error messages without writing JavaScript.
3. An ajaxified product form switches to the "loading" state only when there is a Shopify Ajax Cart Ajax request sent from the form itself. Meanwhile, the `data-ajax-cart-request-button` elements switch to the "loading" state when there is any Shopify Cart API Ajax request in progress.

If you still want to use an "Add to cart" link with the `data-ajax-cart-request-button` attribute, this is how to do it:

{%- capture highlight_code -%}
{% raw %}
<!-- You have to use a variant ID with the "routes.cart_add_url" route -->
{% assign variant_id = 40875540775100 %}
<a data-ajax-cart-request-button
  href="{{ routes.cart_add_url }}?id={{ variant_id }}&quantity=1" >
  Add to cart
</a>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

## Using without `href`

It is recommended to use the `data-ajax-cart-request-button` with a real link because they works even without JavaScript and if Liquid Ajax Cart isn't loaded.

But if you can’t use the `a` tag with the `href` parameter,
add the `data-ajax-cart-request-button` attribute to the HTML element you want 
and provide a valid `routes.cart_add_url`, `routes.cart_change_url`, `routes.cart_clear_url`, `routes.cart_update_url` or `line_item.url_to_remove` URL as an attribute’s value:

{%- capture highlight_code -%}
{% raw %}
<button data-ajax-cart-request-button="{{ item.url_to_remove }}">
  Remove
</button>

<div data-ajax-cart-request-button="{{ routes.cart_clear_url }}">
  Clear cart
</div>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html language="liquid" code=highlight_code %}

## Loading state

The `data-ajax-cart-request-button` elements become inactive when there is any Shopify Cart API Ajax request in progress.

If you want to make them visually disabled when they are inactive, use the [`js-ajax-cart-processing`](/v2/docs/js-ajax-cart-processing/) CSS class 
which gets added by Liquid Ajax Cart when there is a Shopify Cart API Ajax request in progress.