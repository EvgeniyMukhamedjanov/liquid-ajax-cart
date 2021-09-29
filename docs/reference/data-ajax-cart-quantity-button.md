# data-ajax-cart-quantity-button

Changes quantity of a cart item on a user's click. 

As a parameter it takes a string with a [line item's key](https://shopify.dev/api/liquid/objects/line_item#line_item-key) followed by the vertical bar symbol `|`, followed by a new quantity value:

```html 
{% raw %} <button data-ajax-cart-quantity-button=" 17285644550:70ff98a797ed385f6ef25e6e974708ca | 15 " > Change quantity to 15 </button>

{% comment %}
  Mostly these buttons are used within a loop of cart items:
{% endcomment %}

{% for line_item in cart.items %}
  Quantity:
  <button data-ajax-cart-quantity-button=" {{ line_item.key }} | {{ line_item.quantity | minus: 1 }} "> Minus 1 </button>
  {{ line_item.quantity }}
  <button data-ajax-cart-quantity-button=" {{ line_item.key }} | {{ line_item.quantity | plus: 1 }} "> Plus 1 </button>
  
  <a data-ajax-cart-quantity-button=" {{ line_item.key }} | 0 "> Remove </a>
{% endfor %} {% endraw %}
```
The button becomes not active if Liquid Ajax Cart is performing any AJAX request. After all requests are finished, the button becomes active again.

If there is an AJAX request in progress, the `body` tag has `js-ajax-cart-request-in-progress` CSS class (see [Body CSS classes](#body-css-classes)). Thus you can make `data-ajax-cart-quantity-button` buttons look disabled when they are not active:

```css
.js-ajax-cart-request-in-progress [data-ajax-cart-quantity-button] {
  opacity: .5;
}
```

The button is used for `+` and `−` buttons on the demo store within the right-side cart.
