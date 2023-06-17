---
title: .js-ajax-cart-not-empty
layout: page
---

# .js-ajax-cart-not-empty

Liquid Ajax Cart adds the `js-ajax-cart-not-empty` CSS class to the `body` tag if the user’s cart is not empty.

Under the hood Liquid Ajax Cart checks the `status.cartStateSet` and the `cart.item_count` properties of the [`State`](/reference/state/) object and adds the CSS class if the `status.cartStateSet` is `true` and the `cart.item_count` is more than `0`. Otherwise — it removes the CSS class.
