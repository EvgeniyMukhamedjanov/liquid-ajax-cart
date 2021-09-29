# data-ajax-cart-toggle-class-button

Takes a CSS class as a parameter and adds the CSS class to the `body` tag on a user's click. If the `body` tag has the CSS class then it will be removed from the `body`.

The usecase is "Show/Hide Cart" button. It is used in the header of the demo store: "Cart" link shows and hides the right-side cart.

```html

<!--
  Liquid Ajax Cart will intercept a user's click on the following link
  and instead of redirecting to "/cart" it will add/remove the "js-ajax-cart-opened" <body> class 
-->

<a href="/cart" data-ajax-cart-toggle-class-button="js-ajax-cart-opened" > Cart </button>

<div class="mini-cart">
  <!-- Cart content -->
</div>

<style>
  .mini-cart { display: none; }
  .js-ajax-cart-opened .mini-cart { display: block; }
</style>

```

If you want to create a button that will only add or only remove a class, specify an additional parameter:

```liquid

<a href="/cart" data-ajax-cart-toggle-class-button="js-ajax-cart-opened | add" > Open </button>

<a href="/cart" data-ajax-cart-toggle-class-button="js-ajax-cart-opened | remove" > Close </button>

```
