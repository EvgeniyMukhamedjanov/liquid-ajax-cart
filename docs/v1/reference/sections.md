---
title: Ajaxified sections
layout: page
---

# Ajaxified sections

Liquid Ajax Cart reloads HTML code of the HTML containers that marked with the [`data-ajax-cart-section`](/v1/reference/data-ajax-cart-section/) attribute every time when the Shopify cart is changed. 

It uses [Bundled section rendering](https://shopify.dev/api/ajax/reference/cart#bundled-section-rendering) under the hood to ask Shopify to provide re-rendered HTML code for theme sections with each Cart API request response. Due to this, the `data-ajax-cart-section` must be applied only within sections.

After Liquid Ajax Cart received a response of a Shopify Cart API request with the re-rendered sections' HTML, it replaces HTML of the `data-ajax-cart-section` containers within the section with the new ones.

##### Immutable elements

If you want to have an immutable HTML element within a [`data-ajax-cart-section`](/v1/reference/data-ajax-cart-section/) container — add the `data-ajax-cart-static-element` attribute to this element. HTML of the immutable element will *not* be replaced when its section gets updated.

##### Scrollable area

If you have a scrollable area within a `data-ajax-cart-section` container, the scroll position will be reset to top every time when the cart is changed because the section's HTML will be completely replaced with a new one. To keep the scroll position the same add the [`data-ajax-cart-section-scroll`](/v1/reference/data-ajax-cart-section-scroll/) attribute to the scrollable area.


##### JavaScript callback

If you want to run your JavaScript code after the HTML code of the `data-ajax-cart-section` sections are reloaded — use the [`subscribeToCartSectionsUpdate`](/v1/reference/subscribeToCartSectionsUpdate/) function.

##### Example 
Since the cart sections are plain Shopify liquid theme sections, you are free to use any Liquid tags, objects and filters.

{% include code/section.html %}
