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
<div class="guide-row__col" markdown="1">

{% raw %}
```html
{% comment %} Somewhere in layout/theme.liquid {% endcomment %}
 
<script type="application/json" data-ajax-cart-initial-state >
  {{ cart | json }}
</script>
 
<script type="module">
  import {% endraw %}{% include code/v2/last-release-file-name.html asset_url=true %}{% raw %};
</script>
```
{% endraw %}

Upload the <a href="{{ last_release_file.path }}" download >{% include code/last-release-file-name.html %}</a> file to your Shopify theme's `asset` folder and include it in the `layout/theme.liquid` template.

Provide the initial cart state in the JSON format within a script tag with the [`data-ajax-cart-initial-state`](/v1/reference/data-ajax-cart-initial-state/) attribute. If not — Liquid Ajax Cart will make another Shopify Cart API request to get the cart state.

</div>
    <input type="radio" name="installation_types" id="installation_type_npm" />
    <label for="installation_type_npm">From npm-package</label> 
    <div>
        Npm installation
    </div>
</div>

### Providing the initial cart state