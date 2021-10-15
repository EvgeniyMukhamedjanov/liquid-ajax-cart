# data-ajax-cart-quantity-input

**_Will be ready soon_**

Provides an editable input field for a cart item quantity.

```html
{% for item in cart.items %}
  <input type="number" value="{{ item.quantity }}" data-ajax-cart-quantity-input="{{ item.key }}" />
{% endfor %}
```
