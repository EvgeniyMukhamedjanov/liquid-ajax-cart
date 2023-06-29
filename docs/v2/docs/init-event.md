---
title: liquid-ajax-cart:init
layout: docs-v2
disable_anchors: true
---

# liquid-ajax-cart:init

<p class="lead" markdown="1">
The `liquid-ajax-cart:init` event is fired at the `document` when Liquid Ajax Cart is successfully loaded.
</p>

Use this event if you want to make sure that your JavaScript will be run after Liquid Ajax Cart is loaded.

{%- capture highlight_code -%}

function runAfterLiquidAjaxCartLoad(a, b, c) {
  // your code
}

if ("liquidAjaxCart" in window) {
  runAfterLiquidAjaxCartLoad(1, 2, 3);
} else {
  document.addEventListener("liquid-ajax-cart:init", function() {
    runAfterLiquidAjaxCartLoad(1, 2, 3);
  })
}

{%- endcapture -%}
{% include v2/codeblock.html title="assets/script.js" language="javascript" code=highlight_code %}