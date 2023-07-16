---
title: The liquidAjaxCart object
layout: docs-v2
disable_anchors: true
---

# The `liquidAjaxCart` object

<p class="lead" markdown="1">
The object exposes the methods and properties of the Liquid Ajax Cart library.
</p>

## Methods and properties

* [`get()`](/v2/docs/liquid-ajax-cart-get/) — makes a Shopify Cart API `GET /cart.js` Ajax request;
* [`add()`](/v2/docs/liquid-ajax-cart-add/) — makes a `POST /cart/add.js` request;
* [`change()`](/v2/docs/liquid-ajax-cart-change/) — makes a `POST /cart/change.js` request;
* [`update()`](/v2/docs/liquid-ajax-cart-update/) — makes a `POST /cart/update.js` request;
* [`clear()`](/v2/docs/liquid-ajax-cart-get/) — makes a `POST /cart/clear.js` request;
* [`cart`](/v2/docs/liquid-ajax-cart-cart/) — current cart state JSON;
* [`previousCart`](/v2/docs/liquid-ajax-cart-previous-cart/) — previous cart state JSON;
* [`conf()`](/v2/docs/liquid-ajax-cart-conf/) — sets configuration parameter values;

## Access via `import`

To get the `liquidAjaxCart` object you can import it from the library during installation:

<div class="tabs">

<input type="radio" name="import_types" id="import_type_asset" checked />
<label for="import_type_asset">From theme asset</label>
<div>

{%- capture highlight_code -%}
{% raw %}
<script type="module">
  import liquidAjaxCart from {% endraw %}{% include v2/last-release-file-name.html asset_url=true %}{% raw %};
</script>
{% endraw %}
{%- endcapture -%}
{% include v2/codeblock.html title="layout/theme.liquid" language="liquid" code=highlight_code %}

</div>

<input type="radio" name="import_types" id="import_type_npm" />
<label for="import_type_npm">From npm-package</label> 
<div>

{%- capture highlight_code -%}
import liquidAjaxCart from "liquid-ajax-cart";
{%- endcapture -%}
{% include v2/codeblock.html title="src/index.js" language="javascript" code=highlight_code %}

</div>

</div>

## Access via `window`

Once Liquid Ajax Cart is installed, the `liquidAjaxCart` object is available globally as a `window` property.

Before accessing it from the `window` object, make sure that Liquid Ajax Cart is loaded.
If it is not loaded yet, subscribe to the [`liquid-ajax-cart:init`](/v2/docs/init-event/) event 
and use the `window.liquidAjaxCart` after the event is fired:

{% include v2/content/init-event-example.html %}

