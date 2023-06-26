---
title: Installation
layout: docs-v2
disable_anchors: true
---

# Installation

<p class="lead">
You can install Liquid Ajax Cart directly to the Shopify theme code or import from npm-package.
In both cases Liquid Ajax Cart will be available globally on the website.
</p>

## Include the library

<div class="tabs">

<input type="radio" name="installation_types" id="installation_type_direct" checked />
<label for="installation_type_direct">Directly to theme</label>
<div markdown="1">

<div class="code-editor-header">layout/theme.liquid</div>

{% capture code_my %}
{%- raw -%}
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}
 
<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
 
<script type="module">
  import {% endraw %}{% include code/v2/last-release-file-name.html asset_url=true %}{% raw %};
</script>
{% endraw %}
{% endcapture %}

<pre><code class="language-liquid">{{- code_my | escape -}}</code></pre>


Upload the <a href="{% include code/v2/last-release-file-name.html path=true %}" download >`{% include code/v2/last-release-file-name.html %}`</a> file to your Shopify theme's `asset` folder and include it in the `layout/theme.liquid` template.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/v2/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another Shopify Cart API request to get the cart state.
</div>

<input type="radio" name="installation_types" id="installation_type_npm" />
<label for="installation_type_npm">From npm-package</label> 
<div markdown="1">

<div class="code-editor-header">Terminal</div>

```
npm install liquid-ajax-cart
```

<div class="code-editor-header">your-module.js</div>

```javascript
import 'liquid-ajax-cart';
```

<div class="code-editor-header">layout/theme.liquid</div>

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}

<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
```
{% endraw %}

Import the `liquid-ajax-cart` package to a JavaScript module that is going to be processed by Webpack or any other bundler.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/v2/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another Shopify Cart API request to get the cart state.
</div>

</div>

### Providing the initial cart state