---
title: .js-ajax-cart-set
layout: page
---

# .js-ajax-cart-set

Liquid Ajax Cart adds the `js-ajax-cart-set` CSS class to the `body` tag if Liquid Ajax Cart has been loaded and got information about a user’s cart state.

Under the hood Liquid Ajax Cart checks the `status.cartStateSet` property of the [`State`](/v1/reference/state/) object and adds the CSS class if the `status.cartStateSet` value is `true` and removes the CSS class if the value is `false`.
