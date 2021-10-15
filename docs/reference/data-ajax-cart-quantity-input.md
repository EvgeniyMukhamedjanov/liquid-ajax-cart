# data-ajax-cart-quantity-input

**_Will be ready soon_**

Provides an editable input field for a cart item quantity.

{% raw %}
```html
{% for item in cart.items %}
  <input type="number" value="{{ item.quantity }}" data-ajax-cart-quantity-input="{{ item.key }}" />
{% endfor %}
```
{% endraw %}
