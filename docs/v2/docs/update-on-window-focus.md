---
title: updateOnWindowFocus
layout: docs-v2
disable_toc: true
---

# updateOnWindowFocus

<p class="lead" markdown="1">
  The configuration parameter toggles the functionality that updates everything related to Liquid Ajax Cart when the browser tab loses focus and gets focus back.
</p>

Liquid Ajax Cart makes a Shopify Cart API Ajax request each time when the browser tab loses focus and gets focus back 
to keep [`data-ajax-cart-section`](/v2/docs/data-ajax-cart-section/) containers and the [`liquidAjaxCart.cart`](/v2/docs/liquid-ajax-cart-cart/) object up to date.

It is necessary because a user can open two browser tabs with the same Shopify store, adds a product to the cart in the second tab, 
then goes back to the first one. The first tab "doesn't know" that the new product was added, so the user will see outdated data in the cart.
The additional Ajax request is supposed to prevent this issue.

You might want to disable this functionality during the development process because when you switch from DevTools to a page content, 
`window` object will get and lose focus all the time and cart sections will be updating constantly. 

Use the [`conf`](/v2/docs/liquid-ajax-cart-conf/) method of the [`liquidAjaxCart`](/v2/docs/liquid-ajax-cart/) object 
to switch this functionality off:
{%- capture highlight_code -%}
liquidAjaxCart.conf("updateOnWindowFocus", false);
{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}
