---
title: liquidAjaxCart.state 
layout: docs-v2
disable_anchors: true
---

# liquidAjaxCart.state

<p class="lead" markdown="1">
A read-only property that keeps the [Cart state](/v2/docs/cart-state) 
</p>

{%- capture highlight_code -%}

console.log(liquidAjaxCart.state);

{%- endcapture -%}
{% include v2/codeblock.html language="javascript" code=highlight_code %}

Result:

{% include v2/content/cart-state-json-example.html %}