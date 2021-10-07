# Ajaxified sections

Liquid Ajax Cart reloads HTML code of the theme sections that marked with [`data-ajax-cart-section`](/reference/data-ajax-cart-section) attribute every time when the user's cart is changed. 

It uses [Bundled section rendering](https://shopify.dev/api/ajax/reference/cart#bundled-section-rendering) under the hood to ask Shopify to provide re-rendered HTML code for theme sections after each Cart Ajax API request.

After Liquid Ajax Cart received a response of another Cart Ajax API request with the re-rendered sections HTML, it replaces HTML of `data-ajax-cart-section` sections with the new one.

If you have a scrollable area within a `data-ajax-cart-section` section, the scroll position will be reset to top every time when the cart is changed because the section's HTML will be completely replaced with a new one. To keep the scroll position the same — add [`data-ajax-cart-section-scroll`](/reference/data-ajax-cart-section-scroll) to the scrollable area.

