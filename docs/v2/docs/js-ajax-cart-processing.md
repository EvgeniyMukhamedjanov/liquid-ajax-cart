---
title: js-ajax-cart-processing
layout: docs-v2
---

# js-ajax-cart-processing

<p class="lead" markdown="1">
A CSS class which is appended to the `html` tag when there is a Shopify Cart API Ajax request in progress.
</p>

## How it works

Under the hood Liquid Ajax Cart is keeping the `js-ajax-cart-processing` CSS class appended to the `html` tag 
when the [Queue of requests](/v2/docs/queue-of-requests/) is not empty, 
which means that Liquid Ajax Cart is currently executing Shopify Cart API Ajax requests 
until the [Queue of requests](/v2/docs/queue-of-requests/) is empty. 

## Use case

Use this CSS class to show a loading indicator for an Ajax cart section or make the ajaxified elements, 
such as a cart item quantity input, or a remove cart item button, look visually disabled. 

{% include v2/content/cart-loading-state-css-example.html %}