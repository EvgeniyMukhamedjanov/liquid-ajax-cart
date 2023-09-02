---
title: liquidAjaxCart.init
layout: docs-v2
---

# liquidAjaxCart.init

<p class="lead" markdown="1">
A boolean read-only property of the [`liquidAjaxCart`](/v2/liquid-ajax-cart/) object, 
which becomes `true` once Liquid Ajax Cart is initialized.
</p>

## Use case

Use this property along with the [`liquid-ajax-cart:init`](/v2/event-init/) event 
when you want to run your JavaScript once Liquid Ajax Cart is initialized.

{% include v2/content/init-event-example.html %}