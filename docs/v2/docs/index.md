---
title: Installation
layout: docs-v2
disable_toc: true
---

# Installation

<p class="lead">
Include Liquid Ajax Cart to the Shopify theme code or import the package from npm.
In both cases it will be globally available on the website.
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

<script type="application/json" data-ajax-cart-initial-state>
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
<label for="installation_type_npm">From npm</label> 
<div>

<p markdown="1">Download Liquid Ajax Cart from npm:</p>

{%- capture highlight_code -%}
npm install liquid-ajax-cart
{%- endcapture -%}
{% include v2/codeblock.html language="plain" code=highlight_code %}

<p>Import the library:</p>
{%- capture highlight_code -%}
import "liquid-ajax-cart";
{%- endcapture -%}
{% include v2/codeblock.html title="src/index.js" language="javascript" code=highlight_code %}

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

<script src="{{ 'my-bundle.min.js' | asset_url }}" defer="defer"></script>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

</div>

</div>

## Initialization

Once Liquid Ajax Cart is loaded and initialized, 
the [`js-ajax-cart-init`](/v2/docs/js-ajax-cart-init/) CSS class will be added to the `html` tag.

If you want to run your JavaScript once Liquid Ajax Cart is initialized, 
check the [`liquidAjaxCart.init`](/v2/docs/liquid-ajax-cart-init/) property 
and listen to the [`liquid-ajax-cart:init`](/v2/docs/event-init/) event:
{% include v2/content/init-event-example.html %}

{% include v2/content/lifecycle-reference.html %}