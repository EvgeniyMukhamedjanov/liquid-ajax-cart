---
title: Installation
layout: docs-v2
disable_toc: true
---

# Installation

<p class="lead">
Install Liquid Ajax Cart to the Shopify theme code or import from npm-package.
In both cases it will be available globally on the website.
</p>

<div class="tabs">

<input type="radio" name="installation_types" id="installation_type_direct" checked />
<label for="installation_type_direct">Directly to theme</label>
<div>

<p markdown="1">Upload the <a href="{% include v2/last-release-file-name.html path=true %}" download >{% include v2/last-release-file-name.html %}</a> file to your Shopify theme's `asset` folder and include it in the `layout/theme.liquid` template.</p>

<p markdown="1">
Provide the cart data in the JSON format within the `script` tag 
with the [`data-ajax-cart-initial-state`](/v2/docs/data-ajax-cart-initial-state/) attribute so that
Liquid Ajax Cart knows the user cart state.  
If Liquid Ajax Cart doesn't find the cart JSON, it will make a Shopify Cart API Ajax request to get the cart state.
</p>

{%- capture highlight_code -%}
{% raw %}{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>

<script type="module">
  import {% endraw %}{% include v2/last-release-file-name.html asset_url=true %}{% raw %};
</script>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

</div>

<input type="radio" name="installation_types" id="installation_type_npm" />
<label for="installation_type_npm">From npm-package</label> 
<div>

<p markdown="1">Download Liquid Ajax Cart from `npm`:</p>

{%- capture highlight_code -%}
npm install liquid-ajax-cart
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

<p>Import the library to run Liquid Ajax Cart:</p>
{%- capture highlight_code -%}
import "liquid-ajax-cart";
{%- endcapture -%}
{% include v2/codeblock.html title="my-bundle.js" language="javascript" code=highlight_code %}

<p markdown="1">
Provide the cart data in the JSON format within the `script` tag 
with the [`data-ajax-cart-initial-state`](/v2/docs/data-ajax-cart-initial-state/) attribute so that
Liquid Ajax Cart knows the user cart state.  
If Liquid Ajax Cart doesn't find the cart JSON, it will make a Shopify Cart API Ajax request to get the cart state.
</p>
{%- capture highlight_code -%}
{% raw %}
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state>
  {{ cart | json }}
</script>

<script src="{{ 'my-bundle.js' | asset_url }}" defer="defer"></script>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

</div>

</div>