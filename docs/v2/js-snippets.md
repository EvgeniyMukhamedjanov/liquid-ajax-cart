---
title: Ready snippets
layout: docs-v2
---

# Ready snippets

## Open the Ajax-cart when a user adds a product to the cart

Usually the Ajax-cart isn't visible and opens when a user clicks the cart icon in the header.
The click on the icon triggers a special CSS class to be added that makes the Ajax-cart show up.
The simplified code looks like this:

{%- capture highlight_code -%}
// Add a special CSS class when the cart-icon is clicked 
document.querySelector("#cart-icon").addEventListener("click", function(){
  document.body.classList.toggle("js-show-ajax-cart");
});
{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}

{%- capture highlight_code -%}
// The Ajax-cart is hidden by default
.my-ajax-cart {
  display: none;
}

// The Ajax-cart is visible if a special class is added
body.js-show-ajax-cart .my-ajax-cart {
  display: block;
}
{%- endcapture -%}
{% include v2/codeblock.html title="assets/style.css" language="css" code=highlight_code %}

Our goal is to add the same CSS class to the `body` tag when a new product has been just added to the cart:
{% include v2/content/add-to-cart-class-example.html %}