# data-ajax-cart-toggle-class-button

Add the `data-ajax-cart-toggle-class-button` attribute to an HTML element, pass a CSS class name as a parameter, and  Liquid Ajax Cart will "toggle" the CSS class for the `body` tag when a user clicks on the element.

The CSS class will be added to the `body` tag if it doesn't have the CSS class. The CSS class will be removed from the `body` tag if it has the CSS class.

The usecase is "Show/Hide Cart" button. It is used in the header of the demo store: "Cart" link shows and hides the right-side cart.

{% raw %}
```html

<!-- Floating cart -->
<div class="my-floating-cart"> {% section 'my-cart' %} </div>

<style>
  .my-floating-cart { display: none; }

  /* Show the floating cart if the 'js-my-cart-open' CSS class exists */
  .js-my-cart-open .my-floating-cart { display: block; }
</style>



<!-- Button to open/close the floating cart -->
<a href="{{ routes.cart_url }}"
  data-ajax-cart-toggle-class-button="js-my-cart-open">
  My Cart
</a>

<!--
  Liquid Ajax Cart will intercept a user's click on the following link
  and instead of redirecting to "/cart" it will add/remove the "js-ajax-cart-opened" <body> class 
-->

```
{% endraw %}

If you want to create a button that will only add or only remove a CSS class — specify the additional parameter:

```html
<button data-ajax-cart-toggle-class-button="js-my-cart-open | add">
  Open cart
</button>

<button data-ajax-cart-toggle-class-button="js-my-cart-open | remove">
  Close cart
</button>
```
